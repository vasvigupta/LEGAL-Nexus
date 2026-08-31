"""
LangGraph Legal Workflow Orchestrator
Coordinates multi-agent execution with state management, conditional branching, and centralized Guardrail Layer enforcement
"""

from typing import Dict, Any
from .state import LegalGraphState
from ..agents.privacy import PrivacyAgent
from ..agents.intake import IntakeAgent
from ..agents.classification import ClassificationAgent
from ..agents.case import CaseAgent
from ..agents.research import ResearchAgent
from ..agents.evidence import EvidenceAgent
from ..agents.risk import RiskUrgencyAgent
from ..agents.verification import VerificationAgent
from ..guardrails.manager import guardrail_manager
from ..schemas.case_schemas import (
    LegalWorkflowOutput,
    StructuredCaseState,
    IntakeResult,
    EvidenceChecklist,
    UrgencyAssessment,
    VerificationReport
)

class LegalWorkflowEngine:
    def __init__(self, research_agent: ResearchAgent = None, verification_agent: VerificationAgent = None):
        self.research_agent = research_agent or ResearchAgent()
        self.verification_agent = verification_agent or VerificationAgent()

    # 1. Privacy & Input Guardrail Node
    def privacy_node(self, state: LegalGraphState) -> LegalGraphState:
        raw_text = state.get("raw_input", "")
        # Process through Guardrail Layer for PII and injection
        guard_res = guardrail_manager.process_input(raw_text, tool_name="CASE_INTAKE")
        state["redacted_input"] = guard_res["sanitized_text"]
        state["pii_counts"] = guard_res.get("pii_counts", {})
        state["guardrail_result"] = guard_res
        return state

    # 2. Intake Node
    def intake_node(self, state: LegalGraphState) -> LegalGraphState:
        redacted = state["redacted_input"]
        existing_facts = {}
        if "case_state" in state and state["case_state"]:
            existing_facts = {k: v.value for k, v in state["case_state"].facts.items()}
            
        intake_res = IntakeAgent.process_intake(redacted, existing_facts=existing_facts)
        state["intake_result"] = intake_res
        state["language"] = intake_res.detectedLanguage
        return state

    # 3. Classification Node
    def classification_node(self, state: LegalGraphState) -> LegalGraphState:
        intake_res = state["intake_result"]
        classification = ClassificationAgent.classify_case(intake_res)
        state["classification"] = classification
        return state

    # 4. Case Builder Node
    def case_builder_node(self, state: LegalGraphState) -> LegalGraphState:
        intake_res = state["intake_result"]
        classification = state["classification"]
        existing_case = state.get("case_state")
        
        case_state = CaseAgent.build_case_state(
            intake_result=intake_res,
            classification=classification,
            existing_case=existing_case
        )
        state["case_state"] = case_state
        # Decide if research is needed (always True for statutory grounding unless empty)
        state["needs_research"] = bool(case_state.category and case_state.issue)
        return state

    # 5. Research Node
    def research_node(self, state: LegalGraphState) -> LegalGraphState:
        if state.get("needs_research", True):
            case_state = state["case_state"]
            raw_input = state["raw_input"]
            research_res = self.research_agent.research_case(case_state, user_query=raw_input)
            state["research_result"] = research_res
        else:
            state["research_result"] = None
        return state

    # 6. Evidence Node
    def evidence_node(self, state: LegalGraphState) -> LegalGraphState:
        case_state = state["case_state"]
        evidence_checklist = EvidenceAgent.audit_evidence(case_state)
        state["evidence_checklist"] = evidence_checklist
        return state

    # 7. Urgency / Risk Node
    def urgency_node(self, state: LegalGraphState) -> LegalGraphState:
        case_state = state["case_state"]
        urgency = RiskUrgencyAgent.evaluate_urgency(case_state)
        case_state.urgency = urgency
        state["urgency_assessment"] = urgency
        return state

    # 8. Verification Node
    def verification_node(self, state: LegalGraphState) -> LegalGraphState:
        case_state = state["case_state"]
        research_res = state.get("research_result")
        verification_rep = self.verification_agent.verify_response_and_case(
            case=case_state,
            research_result=research_res
        )
        state["verification_report"] = verification_rep
        return state

    # 9. Final Synthesis Node
    def synthesis_node(self, state: LegalGraphState) -> LegalGraphState:
        case_state = state["case_state"]
        intake_res = state["intake_result"]
        research_res = state.get("research_result", {})
        evidence = state["evidence_checklist"]
        urgency = state["urgency_assessment"]
        verification = state["verification_report"]

        # Action Plan Synthesis
        action_plan = []
        for route in case_state.potentialRoutes:
            action_plan.append({"step": "Statutory Action", "detail": route})

        if urgency.recommendation:
            action_plan.insert(0, {"step": "Urgency Guidance", "detail": urgency.recommendation})

        if research_res.get("llmSynthesized", False):
            raw_explanation = research_res.get("explanation", "")
        else:
            raw_explanation = (
                f"Based on your statement regarding {case_state.issue} ({case_state.category}), "
                f"we have established structured case {case_state.caseNumber}. "
                f"{research_res.get('explanation', '')}"
            )

        # Run output guardrail validation
        output_guard_res = guardrail_manager.process_output(
            raw_output=raw_explanation,
            retrieved_sources=research_res.get("legalBasis", []),
            domain=case_state.category
        )

        output = LegalWorkflowOutput(
            case=case_state,
            intake=intake_res,
            research=research_res,
            evidence=evidence,
            urgency=urgency,
            verification=verification,
            responseExplanation=output_guard_res["safe_response"],
            actionPlan=action_plan
        )
        state["workflow_output"] = output
        return state

    # Orchestrator Execution Pipeline
    def execute(self, raw_input: str, existing_case=None) -> LegalWorkflowOutput:
        # Reset any previously corrupted/blocked case state
        if existing_case and (getattr(existing_case, 'status', '') == 'BLOCKED' or getattr(existing_case, 'caseNumber', '') == 'BLOCKED-SECURITY'):
            existing_case = None

        # Pre-execution Guardrail Check for Malicious Prompt Injections / Harm / Blocks
        input_guard_res = guardrail_manager.process_input(raw_input, tool_name="CASE_INTAKE")
        if input_guard_res.get("blocked", False):
            err_msg = input_guard_res.get("error_message") or "⚠️ Security Alert: Input blocked by Legal Nexus Guardrail Layer."
            return LegalWorkflowOutput(
                case=StructuredCaseState(
                    caseNumber="BLOCKED-SECURITY",
                    category="Security & Safety Violation",
                    issue=input_guard_res.get("status", "Blocked"),
                    jurisdiction="N/A",
                    status="BLOCKED"
                ),
                intake=IntakeResult(
                    extractedFacts={},
                    detectedLanguage="en",
                    domain="Security & Safety Violation",
                    issue=input_guard_res.get("status", "Blocked"),
                    missingFields=[],
                    clarifyingQuestions=[],
                    redactedText=input_guard_res.get("sanitized_text", "")
                ),
                research={"legalBasis": [], "explanation": err_msg},
                evidence=EvidenceChecklist(available=[], missing=[], recommended=[]),
                urgency=UrgencyAssessment(
                    urgencyLevel="ATTENTION_RECOMMENDED",
                    score=0.95,
                    triggers=["Security or Safety Guardrail triggered."],
                    recommendation=err_msg,
                    colorCode="RED"
                ),
                verification=VerificationReport(valid=False, status="BLOCKED_BY_GUARDRAIL"),
                responseExplanation=err_msg,
                actionPlan=[{"step": "Guardrail Alert", "detail": err_msg}]
            )

        state: LegalGraphState = {
            "raw_input": raw_input,
            "case_state": existing_case,
            "errors": []
        }

        # Sequence of graph nodes
        state = self.privacy_node(state)
        state = self.intake_node(state)
        state = self.classification_node(state)
        state = self.case_builder_node(state)
        state = self.research_node(state)
        state = self.evidence_node(state)
        state = self.urgency_node(state)
        state = self.verification_node(state)
        state = self.synthesis_node(state)

        return state["workflow_output"]

# Singleton instance
legal_workflow = LegalWorkflowEngine()
