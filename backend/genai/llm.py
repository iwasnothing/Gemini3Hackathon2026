"""
LLM module for SecureBI backend.
Uses the Google Vertex AI SDK (google-genai) for Gemini models—no LangChain.
"""
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Google Gen AI client for Vertex AI (lazy init)
_vertex_client = None


def _ensure_vertex_env():
    """Set env vars required for Vertex AI if not already set."""
    if os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "").lower() not in ("true", "1", "yes"):
        os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
    if not os.getenv("GOOGLE_CLOUD_PROJECT") and os.getenv("GCP_PROJECT"):
        os.environ["GOOGLE_CLOUD_PROJECT"] = os.environ["GCP_PROJECT"]
    if not os.getenv("GOOGLE_CLOUD_LOCATION"):
        os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"


def get_vertex_client():
    """
    Return a configured Google Gen AI client for Vertex AI.
    Uses GOOGLE_APPLICATION_CREDENTIALS (service account) or ADC.
    """
    global _vertex_client
    if _vertex_client is not None:
        return _vertex_client
    _ensure_vertex_env()
    project = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT")
    if not project:
        raise ValueError(
            "GOOGLE_CLOUD_PROJECT or GCP_PROJECT must be set for Vertex AI."
        )
    try:
        from google import genai
        from google.genai.types import HttpOptions
    except ImportError as e:
        raise ValueError(
            "Google Gen AI SDK is not installed. Install with: pip install google-genai"
        ) from e
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    client = genai.Client(
        vertexai=True,
        project=project,
        location=location,
        http_options=HttpOptions(api_version="v1"),
    )
    _vertex_client = client
    logger.info(
        "Vertex AI client initialized (google-genai), project=%s",
        project,
    )
    return _vertex_client


def generate_content(
    prompt: str,
    model: str = None,
    temperature: float = 0.0,
) -> str:
    """
    Generate text from Vertex AI Gemini model.

    Args:
        prompt: The full prompt (e.g. system + user message combined).
        model: Model name; defaults to GEMINI_MODEL_NAME or gemini-2.5-flash-lite.
        temperature: Sampling temperature (0.0 = deterministic).

    Returns:
        Response text from the model.
    """
    if model is None:
        model = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash-lite")
    client = get_vertex_client()
    try:
        from google.genai.types import GenerateContentConfig
        config = GenerateContentConfig(temperature=temperature)
    except ImportError:
        config = None
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=config,
    )
    if hasattr(response, "text") and response.text:
        return response.text
    # Fallback: extract text from candidates
    if getattr(response, "candidates", None):
        for c in response.candidates:
            if getattr(c, "content", None) and getattr(c.content, "parts", None):
                for p in c.content.parts:
                    if getattr(p, "text", None):
                        return p.text
    raise ValueError("Vertex AI returned no text in response.")
