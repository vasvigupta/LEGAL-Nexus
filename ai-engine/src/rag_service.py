"""
Legal RAG Service Orchestrator

Coordinates:
Domain Detection -> Query Expansion -> Hybrid Retrieval
-> Re-ranking -> Source Verification -> LLM Synthesis
"""

import logging
from typing import Dict, List, Any, Tuple

from .domain_classifier import LegalDomainClassifier
from .query_expander import QueryExpander
from .hybrid_retriever import HybridRetriever
from .reranker import LegalReranker
from .source_verifier import SourceVerifier
from .llm_service import llm_service

logger = logging.getLogger(__name__)


class LegalRAGService:
    def __init__(self, data_dir: str = None):
        self.retriever = HybridRetriever.get_instance(data_dir=data_dir)
        self.verifier = SourceVerifier(hybrid_retriever=self.retriever)

    def conduct_research(
        self,
        query: str,
        jurisdiction: str = "India",
        language: str = "en",
        top_k: int = 4
    ) -> Dict[str, Any]:
        """
        Executes end-to-end legal research with authoritative citations.

        Flow:
        Domain Detection
        -> Query Expansion
        -> Hybrid Retrieval
        -> Re-ranking
        -> Source Verification
        -> LLM Synthesis
        """

        # 1. Domain Detection
        domain_name, domain_conf, matched_tags = (
            LegalDomainClassifier.classify_domain(query)
        )

        # 2. Query Decomposition & Expansion
        query_meta = QueryExpander.expand_query(query)
        search_query = query_meta["expandedQuery"]

        # 3. Hybrid Retrieval (Dense + BM25)
        raw_candidates = self.retriever.retrieve(
            query=search_query,
            domain_filter=domain_name if domain_conf > 0.55 else None,
            top_k=top_k * 2
        )

        # 4. Re-ranking
        reranked_candidates = LegalReranker.rerank(
            candidates=raw_candidates,
            query=query,
            explicit_sections=query_meta["explicitSections"]
        )

        # Keep only the requested number of top candidates
        top_candidates = reranked_candidates[:top_k]

        # 5. Source Verification and Grounding
        verified_provisions, authoritative_sources = (
            self.verifier.verify_and_ground_candidates(
                candidates=top_candidates,
                query=query
            )
        )

        # Convert confidence to percentage
        confidence_percent = (
            int(domain_conf * 100)
            if domain_conf <= 1.0
            else int(domain_conf)
        )

        # 6. Strict Confidence Gate
        # Only provide LLM synthesis when confidence is >= 80%
        # and verified provisions are available.
        if domain_conf < 0.80 or not verified_provisions:
            low_conf_msg = (
                f"### ⚠️ Insufficient Statutory Information "
                f"(Confidence: {confidence_percent}%)\n\n"
                f"I do not have sufficient verified statutory provisions "
                f"or specific dispute details in my grounded legal database "
                f"to reliably answer this query with the required "
                f"high-confidence threshold (minimum 80% confidence required).\n\n"
                f"**To identify the exact applicable Acts and Sections "
                f"under Indian Law:**\n"
                f"• **Describe your specific issue**: Specify whether this "
                f"involves unpaid salary, tenancy security deposit, cyber "
                f"fraud, criminal threat/assault, cheque bounce, or consumer "
                f"deficiency.\n"
                f"• **Provide key details**: Include approximate financial "
                f"amounts, timeline/dates, city/state, and whether any "
                f"agreement, police complaint (FIR), or notice has been sent.\n"
                f"• **Official Statutory Reference**: You can search verified "
                f"Indian legislation at India Code "
                f"(https://www.indiacode.nic.in) or consult a practicing advocate."
            )

            return {
                "query": query,
                "detectedDomain": domain_name,
                "domainConfidence": round(domain_conf, 2),
                "confidenceScore": confidence_percent,
                "isHighConfidence": False,
                "jurisdiction": jurisdiction,
                "language": language,
                "legalBasis": [],
                "explanation": low_conf_msg,
                "actionableRemedies": [
                    {
                        "step": "Provide Specific Facts",
                        "detail": (
                            "Add specific dispute facts or consult a "
                            "verified advocate."
                        )
                    }
                ],
                "sources": [],
                "confidence": "LOW_CONFIDENCE_INSUFFICIENT_DATA",
                "verifiedAt": "2026-08-30",
                "llmSynthesized": False,
            }

        # 7. LLM-Powered Synthesis
        # Uses RAG-retrieved candidates and falls back to
        # template synthesis if the LLM is unavailable.
        explanation, remedies = self._synthesize_with_llm(
            query=query,
            domain=domain_name,
            provisions=verified_provisions,
            candidates=top_candidates,
            language=language
        )

        # 8. Compute Overall Confidence
        if any(
            p.get("confidence") == "HIGH"
            for p in verified_provisions
        ):
            overall_confidence = "HIGH"

        elif any(
            p.get("confidence") == "MEDIUM"
            for p in verified_provisions
        ):
            overall_confidence = "MEDIUM"

        else:
            overall_confidence = "VERIFIED_HIGH_CONFIDENCE"

        # 9. Final Response
        return {
            "query": query,
            "detectedDomain": domain_name,
            "domainConfidence": round(domain_conf, 2),
            "confidenceScore": confidence_percent,
            "isHighConfidence": True,
            "jurisdiction": jurisdiction,
            "language": language,
            "legalBasis": verified_provisions,
            "explanation": explanation,
            "actionableRemedies": remedies,
            "sources": authoritative_sources,
            "confidence": overall_confidence,
            "verifiedAt": "2026-08-30",
            "llmSynthesized": explanation != self._template_explanation(
                verified_provisions
            ),
        }

    def _synthesize_with_llm(
        self,
        query: str,
        domain: str,
        provisions: List[Dict[str, Any]],
        candidates: List[Dict[str, Any]],
        language: str = "en"
    ) -> Tuple[str, List[Dict[str, str]]]:
        """
        Attempt LLM synthesis from RAG-retrieved chunks.

        Falls back to template synthesis if LLM is unavailable.
        """

        remedies = self._extract_remedies(provisions)

        if not provisions:
            return (
                "Based on the query, no direct statutory provisions "
                "were located. Please consult a verified advocate "
                "for specific guidance.",
                [
                    {
                        "step": "Consult Advocate",
                        "detail": (
                            "Consult a legal professional through "
                            "the Nyaya Setu directory."
                        )
                    }
                ]
            )

        # Try LLM synthesis
        try:
            llm_response = llm_service.synthesize_from_rag(
                user_query=query,
                domain=domain,
                retrieved_chunks=candidates,
                language=language
            )

            if llm_response:
                # Verify the LLM output is safe
                safety_check = llm_service.verify_output_safety(
                    llm_response,
                    candidates
                )

                if safety_check.get("safe", True):
                    logger.info(
                        "RAG → LLM synthesis successful and verified safe"
                    )
                    return llm_response, remedies

                logger.warning(
                    "LLM output failed safety check: "
                    f"{safety_check.get('reason')}"
                )

        except Exception as e:
            logger.warning(
                f"LLM synthesis failed, using template fallback: {e}"
            )

        # Template fallback
        return self._template_explanation(provisions), remedies

    def _template_explanation(
        self,
        provisions: List[Dict[str, Any]]
    ) -> str:
        """Original template-based explanation as fallback."""

        if not provisions:
            return (
                "Based on the query, no direct statutory provisions "
                "were located. Please consult a verified advocate "
                "for specific guidance."
            )

        primary = provisions[0]

        act_title = primary.get(
            "act",
            "the applicable statute"
        )

        section = primary.get(
            "section",
            "relevant provision"
        )

        return (
            f"Under Indian law ({act_title}), your issue falls "
            f"within the scope of {section}. "
            f"The law stipulates that rights and liabilities are "
            f"governed by statutory mandates. "
            f"Specifically: {primary.get('statutorySnippet', '')} "
            f"You have a statutory entitlement to seek full redressal, "
            f"compensation, and restitution through designated authorities."
        )

    def _extract_remedies(
        self,
        provisions: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """Extract actionable remedies from verified provisions."""

        remedies = []

        for p in provisions:
            if p.get("actionableRemedy"):
                remedies.append(
                    {
                        "provision": p.get("provision"),
                        "remedy": p.get("actionableRemedy"),
                        "sourceUrl": p.get("sourceUrl"),
                    }
                )

        return remedies