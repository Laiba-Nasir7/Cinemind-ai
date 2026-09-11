import os
import json
import logging
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

class BaseGeminiAgent:
    """
    Base agent class interacting with Google Gemini API using structured JSON output schemas.
    Includes intelligent fallback generation for keyless Demo Mode.
    """

    def __init__(self, agent_name: str, model_name: str = "gemini-2.5-flash"):
        self.agent_name = agent_name
        self.model_name = model_name
        self.api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.client = None
        
        self._init_client()

    def _init_client(self):
        """Initializes the Google GenAI SDK client if GEMINI_API_KEY is present."""
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            logger.info(f"[{self.agent_name}] No valid GEMINI_API_KEY found. Running in Fallback/Demo Mode.")
            self.client = None
            return

        try:
            # Try official google-genai SDK first
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
            self.sdk_type = "google-genai"
            logger.info(f"[{self.agent_name}] Successfully initialized google-genai client with model {self.model_name}.")
        except Exception as e1:
            try:
                # Fallback to google-generativeai SDK
                import google.generativeai as genai_legacy
                genai_legacy.configure(api_key=self.api_key)
                self.client = genai_legacy
                self.sdk_type = "google-generativeai"
                logger.info(f"[{self.agent_name}] Initialized google-generativeai client.")
            except Exception as e2:
                logger.warning(f"[{self.agent_name}] Could not initialize GenAI SDKs ({str(e1)}, {str(e2)}). Using Fallback Mode.")
                self.client = None

    def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        fallback_data_factory: Any
    ) -> T:
        """
        Executes Gemini API structured completion.
        If client is uninitialized or API call fails, seamlessly calls fallback_data_factory().
        """
        if not self.client:
            logger.info(f"[{self.agent_name}] Client unavailable. Generating structured response via Fallback Factory.")
            return fallback_data_factory()

        try:
            if self.sdk_type == "google-genai":
                from google.genai import types
                
                # Gemini 2.5 Structured JSON request
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=response_schema,
                        temperature=0.2,
                    ),
                )
                raw_text = response.text
                parsed_json = json.loads(raw_text)
                return response_schema.model_validate(parsed_json)

            elif self.sdk_type == "google-generativeai":
                model = self.client.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={"response_mime_type": "application/json"}
                )
                full_prompt = f"{prompt}\n\nStrict Output Schema (JSON):\n{json.dumps(response_schema.model_json_schema())}"
                response = model.generate_content(full_prompt)
                raw_text = response.text
                parsed_json = json.loads(raw_text)
                return response_schema.model_validate(parsed_json)

        except Exception as e:
            logger.error(f"[{self.agent_name}] Gemini API call failed: {str(e)}. Falling back to deterministic demo engine.")
            return fallback_data_factory()

        return fallback_data_factory()
