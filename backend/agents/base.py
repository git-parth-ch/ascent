import os
import json
import logging
import warnings
import httpx
import time
from typing import Type, Any, Dict, Optional
from pydantic import BaseModel, Field
with warnings.catch_warnings():
    warnings.simplefilter("ignore", FutureWarning)
    import google.generativeai as genai
from dotenv import load_dotenv
from openai import OpenAI
from backend.agents.llm_cache import get_cached, set_cached

load_dotenv()

logger = logging.getLogger("ascent.agents")

# Configure genai
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class AgentResponse(BaseModel):
    used_fallback: bool = Field(default=False)
    provider: str = Field(default="gemini")

class BaseAgent:
    def __init__(self, name: str):
        self.name = name

    def fallback(self, blueprint_dict: Dict[str, Any], *args, **kwargs) -> BaseModel:
        """
        To be implemented by subclass. Returns a deterministic Pydantic model response.
        """
        raise NotImplementedError("Deterministic fallback not implemented.")

    def call_gemini(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Calls Gemini 2.5 Flash model and returns parsed dict.
        """
        if not GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set.")
            return None
        
        cached = get_cached("gemini-2.5-flash", prompt)
        if cached is not None:
            print(f"[{self.name}] Cache hit — skipping Gemini API call")
            self._last_call_was_cached = True
            return cached

        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            text = response.text.strip()
            result = json.loads(text)
            set_cached("gemini-2.5-flash", prompt, result)
            self._last_call_was_cached = False
            return result
        except Exception as e:
            logger.warning(f"Gemini call failed for {self.name}: {e}")
            self._last_call_was_cached = False
            return None

    def call_groq(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Calls Groq Llama 3.3 70B via the openai SDK.
        """
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            logger.warning("GROQ_API_KEY not set.")
            return None

        cached = get_cached("llama-3.3-70b-versatile", prompt)
        if cached is not None:
            print(f"[{self.name}] Cache hit — skipping Groq API call")
            self._last_call_was_cached = True
            return cached

        try:
            client = OpenAI(
                api_key=groq_api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content.strip()
            result = json.loads(content)
            set_cached("llama-3.3-70b-versatile", prompt, result)
            self._last_call_was_cached = False
            return result
        except Exception as e:
            logger.warning(f"Groq call failed for {self.name}: {e}")
            self._last_call_was_cached = False
            return None

    def execute(self, prompt: str, blueprint_dict: Dict[str, Any], response_schema: Type[BaseModel], *args, **kwargs) -> BaseModel:
        """
        Executes the agent logic with retries and fallbacks.
        """
        self._last_call_was_cached = False

        # Step 1: Call Gemini (Attempt 1)
        parsed = self.call_gemini(prompt)
        if parsed is not None:
            try:
                parsed["used_fallback"] = False
                parsed["provider"] = "gemini"
                validated = response_schema(**parsed)
                print(f"[{self.name}] Success using provider: gemini")
                if not getattr(self, '_last_call_was_cached', False):
                    time.sleep(1)
                return validated
            except Exception as e:
                logger.warning(f"[{self.name}] Gemini Attempt 1 validation failed: {e}")

        # Step 2: Retry Gemini (Attempt 2)
        print(f"[{self.name}] Retrying Gemini...")
        parsed = self.call_gemini(prompt)
        if parsed is not None:
            try:
                parsed["used_fallback"] = False
                parsed["provider"] = "gemini"
                validated = response_schema(**parsed)
                print(f"[{self.name}] Success on Gemini retry using provider: gemini")
                if not getattr(self, '_last_call_was_cached', False):
                    time.sleep(1)
                return validated
            except Exception as e:
                logger.warning(f"[{self.name}] Gemini retry validation failed: {e}")

        # Step 3: Call Groq Fallback
        print(f"[{self.name}] Falling back to Groq...")
        parsed = self.call_groq(prompt)
        if parsed is not None:
            try:
                parsed["used_fallback"] = True
                parsed["provider"] = "groq"
                validated = response_schema(**parsed)
                print(f"[{self.name}] Success using provider: groq")
                if not getattr(self, '_last_call_was_cached', False):
                    time.sleep(1)
                return validated
            except Exception as e:
                logger.warning(f"[{self.name}] Groq validation failed: {e}")

        # Step 4: Deterministic Fallback
        print(f"[{self.name}] Falling back to deterministic fallback...")
        fallback_model = self.fallback(blueprint_dict, *args, **kwargs)
        fallback_dict = fallback_model.model_dump()
        fallback_dict["used_fallback"] = True
        fallback_dict["provider"] = "deterministic"
        print(f"[{self.name}] Success using provider: deterministic")
        # No delay needed for deterministic fallback
        return response_schema(**fallback_dict)
