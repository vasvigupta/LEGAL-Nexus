"""
LLM Service — Legal Nexus AI Synthesis Engine
Abstracts LLM inference for RAG-grounded legal response generation.
Supports: Ollama (local, default), Gemini API, OpenAI API.
Gracefully falls back to template synthesis if no LLM is available.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# ── Constrained Legal System Prompt ──────────────────────────────────────────
LEGAL_SYSTEM_PROMPT = """You are Legal Nexus AI, a distinguished Indian Legal Intelligence Assistant.

STRICT RULES:
1. You MUST ONLY cite statutory provisions from the RETRIEVED LEGAL CONTEXT provided below. Do NOT hallucinate, invent, or cite any Act, Section, or legal provision that is not present in the retrieved context.
2. If the retrieved context does not contain sufficient information, say "Based on the available statutory provisions..." and recommend consulting a verified advocate.
3. Provide authoritative, wise, and articulate responses in plain language that a common citizen can understand.
4. Always cite the specific Act name, Section number, and Section title from the retrieved context.
5. Structure your response with:
   - A clear statement of the legal position
   - The applicable statutory provisions (cited from context only)
   - Actionable next steps the citizen should take
   - Any important deadlines or limitation periods
6. NEVER provide advice on committing crimes, evading law enforcement, or circumventing statutory penalties.
7. Support English, Hindi, and Hinglish queries. Respond in the same language as the user's query.
8. Add a disclaimer that this is AI-generated legal information, not professional legal advice.

RESPONSE FORMAT:
- Use markdown formatting (bold for Acts/Sections, bullet points for steps)
- Keep responses concise but comprehensive (200-400 words)
- Always ground every claim in the retrieved statutory text
"""

# ── Output Safety Prompt ─────────────────────────────────────────────────────
OUTPUT_SAFETY_CHECK_PROMPT = """Review the following AI-generated legal response for safety:

RESPONSE TO CHECK:
{response}

Check for:
1. Does it advise committing any crime or illegal activity?
2. Does it help evade law enforcement or avoid legal penalties?
3. Does it contain personally identifiable information (names, phone numbers, addresses)?
4. Does it cite any statute/section NOT present in the provided legal context?
5. Does it make absolute guarantees about legal outcomes?

If ANY of these are true, respond with ONLY the word "UNSAFE" followed by the reason.
If the response is safe, respond with ONLY the word "SAFE".
"""


class LLMService:
    """
    Unified LLM inference service with multi-backend support.
    Priority: Ollama (local) → Gemini API → OpenAI API → Template fallback
    """

    def __init__(self):
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self._ollama_available = None  # Lazy check

    def _check_ollama_available(self) -> bool:
        """Check if Ollama server is running and the model is loaded."""
        if self._ollama_available is not None:
            return self._ollama_available
        try:
            import requests
            resp = requests.get(f"{self.ollama_url}/api/tags", timeout=3)
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                model_names = [m.get("name", "") for m in models]
                # Check if our target model (or a prefix match) is available
                base_model = self.ollama_model.split(":")[0]
                self._ollama_available = any(
                    base_model in name for name in model_names
                )
                if not self._ollama_available:
                    logger.warning(
                        f"Ollama is running but model '{self.ollama_model}' not found. "
                        f"Available: {model_names}. Trying llama3.2:latest as fallback."
                    )
                    # Try common fallback models
                    for fallback in ["llama3.2:latest", "llama3.2:1b", "llama3.1:8b"]:
                        if any(fallback.split(":")[0] in name for name in model_names):
                            self.ollama_model = fallback
                            self._ollama_available = True
                            logger.info(f"Using fallback model: {fallback}")
                            break
                return self._ollama_available
            self._ollama_available = False
            return False
        except Exception as e:
            logger.warning(f"Ollama not available: {e}")
            self._ollama_available = False
            return False

    def _call_ollama(self, prompt: str, system: str = "", temperature: float = 0.3) -> Optional[str]:
        """Call Ollama local inference server."""
        try:
            import requests
            payload = {
                "model": self.ollama_model,
                "prompt": prompt,
                "system": system or LEGAL_SYSTEM_PROMPT,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "top_p": 0.9,
                    "num_predict": 800,
                }
            }
            resp = requests.post(
                f"{self.ollama_url}/api/generate",
                json=payload,
                timeout=60
            )
            if resp.status_code == 200:
                return resp.json().get("response", "").strip()
            logger.warning(f"Ollama returned status {resp.status_code}: {resp.text[:200]}")
            return None
        except Exception as e:
            logger.warning(f"Ollama call failed: {e}")
            self._ollama_available = False  # Mark as unavailable for future calls
            return None

    def _call_gemini(self, prompt: str, system: str = "") -> Optional[str]:
        """Call Google Gemini API."""
        if not self.gemini_api_key:
            return None
        try:
            import requests
            full_prompt = f"{system or LEGAL_SYSTEM_PROMPT}\n\n{prompt}"
            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}",
                json={"contents": [{"parts": [{"text": full_prompt}]}]},
                timeout=30
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
            return None
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}")
            return None

    def _call_openai(self, prompt: str, system: str = "") -> Optional[str]:
        """Call OpenAI API."""
        if not self.openai_api_key:
            return None
        try:
            import requests
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.openai_api_key}"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system or LEGAL_SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 800
                },
                timeout=30
            )
            if resp.status_code == 200:
                return resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            return None
        except Exception as e:
            logger.warning(f"OpenAI API call failed: {e}")
            return None

    def generate(self, prompt: str, system: str = "", temperature: float = 0.3) -> Optional[str]:
        """
        Generate text using the best available LLM backend.
        Priority: Ollama → Gemini → OpenAI → None (caller handles fallback)
        """
        # 1. Try Ollama (local, free, private)
        if self._check_ollama_available():
            result = self._call_ollama(prompt, system, temperature)
            if result:
                logger.info("LLM response generated via Ollama")
                return result

        # 2. Try Gemini API
        result = self._call_gemini(prompt, system)
        if result:
            logger.info("LLM response generated via Gemini API")
            return result

        # 3. Try OpenAI API
        result = self._call_openai(prompt, system)
        if result:
            logger.info("LLM response generated via OpenAI API")
            return result

        logger.warning("No LLM backend available. Falling back to template synthesis.")
        return None

    def synthesize_from_rag(
        self,
        user_query: str,
        domain: str,
        retrieved_chunks: List[Dict[str, Any]],
        language: str = "en"
    ) -> Optional[str]:
        """
        Synthesize a grounded legal response from RAG-retrieved statutory chunks.
        The LLM receives ONLY the retrieved chunks as its legal knowledge base.
        """
        if not retrieved_chunks:
            return None

        # Build the retrieved context block
        context_parts = []
        for i, chunk in enumerate(retrieved_chunks, 1):
            act = chunk.get("act", chunk.get("chunk", {}).get("act", "Unknown Act"))
            section = chunk.get("section", chunk.get("chunk", {}).get("section", ""))
            section_title = chunk.get("sectionTitle", chunk.get("chunk", {}).get("sectionTitle", ""))
            text = chunk.get("text", chunk.get("chunk", {}).get("text", ""))
            remedy = chunk.get("remedy", chunk.get("chunk", {}).get("remedy", ""))

            context_parts.append(
                f"[STATUTE {i}]\n"
                f"Act: {act}\n"
                f"Section: {section}\n"
                f"Title: {section_title}\n"
                f"Statutory Text: {text}\n"
                f"Legal Remedy: {remedy}\n"
            )

        context_block = "\n---\n".join(context_parts)

        lang_instruction = ""
        if language == "hi":
            lang_instruction = "Respond in Hindi (Devanagari script). "
        elif language == "hinglish":
            lang_instruction = "Respond in Hinglish (Hindi words in Roman script mixed with English). "

        prompt = f"""RETRIEVED LEGAL CONTEXT (cite ONLY from these statutes):
---
{context_block}
---

LEGAL DOMAIN: {domain}

USER'S QUERY:
"{user_query}"

{lang_instruction}Based on ONLY the retrieved statutory provisions above, provide a wise, authoritative, and helpful legal analysis. Structure your response as:
1. **Legal Position**: What the law says about this situation
2. **Applicable Provisions**: Cite specific Acts and Sections from the retrieved context
3. **Actionable Steps**: What the citizen should do next (with timelines if applicable)
4. **Important Note**: Any critical deadlines, limitation periods, or mandatory procedural steps"""

        return self.generate(prompt)

    def verify_output_safety(self, response: str, retrieved_chunks: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run a lightweight LLM-based safety check on the generated response.
        Returns {'safe': True/False, 'reason': str}
        """
        # First, do a fast regex-based check (no LLM needed)
        import re
        unsafe_patterns = [
            r'\b(?:how\s+to|guide\s+to|steps\s+to)\s+(?:kill|murder|assault|hack|forge)\b',
            r'\b(?:escape|evade|avoid)\s+(?:arrest|punishment|jail|police|law)\b',
            r'\b(?:bribe|threaten|intimidate)\s+(?:judge|police|witness|officer)\b',
        ]
        for pattern in unsafe_patterns:
            if re.search(pattern, response, re.IGNORECASE):
                return {"safe": False, "reason": f"Unsafe content detected: matches pattern '{pattern}'"}

        # If Ollama is available, do a deeper LLM-based check
        if self._check_ollama_available():
            check_prompt = OUTPUT_SAFETY_CHECK_PROMPT.format(response=response[:1500])
            result = self._call_ollama(check_prompt, system="You are a safety reviewer. Respond with ONLY 'SAFE' or 'UNSAFE: <reason>'.", temperature=0.1)
            if result:
                result_upper = result.strip().upper()
                if result_upper.startswith("UNSAFE"):
                    reason = result.strip()[7:].strip() if len(result.strip()) > 7 else "LLM safety check flagged content"
                    return {"safe": False, "reason": reason}
                return {"safe": True, "reason": "Passed LLM safety verification"}

        return {"safe": True, "reason": "Passed regex safety check (LLM check unavailable)"}

    def get_status(self) -> Dict[str, Any]:
        """Return the current status of all LLM backends."""
        return {
            "ollama": {
                "available": self._check_ollama_available(),
                "url": self.ollama_url,
                "model": self.ollama_model,
            },
            "gemini": {
                "configured": bool(self.gemini_api_key),
            },
            "openai": {
                "configured": bool(self.openai_api_key),
            }
        }


# Singleton instance
llm_service = LLMService()
