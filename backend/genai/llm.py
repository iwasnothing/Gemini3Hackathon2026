"""
LLM module for SecureBI backend.
Provides LangChain integration with Google Gemini model via Vertex AI.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import Gemini/Vertex AI (langchain_google_genai supports both via configuration)
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    GEMINI_API_AVAILABLE = True
except ImportError:
    GEMINI_API_AVAILABLE = False
    ChatGoogleGenerativeAI = None

def get_llm(model_name: str = None, temperature: float = 0.0):
    """
    Initialize and return a LangChain LLM instance.
    Uses Vertex AI if available (for GCP), otherwise falls back to Gemini API.
    
    Args:
        model_name: The Gemini model to use. If None, reads from GEMINI_MODEL_NAME env variable.
                   Defaults to "gemini-2.5-flash-lite" if not set.
                   For Vertex AI, use models like "gemini-1.5-flash" or "gemini-2.5-flash-lite"
        temperature: Temperature for the model (default: 0.0 for deterministic output)
    
    Returns:
        LLM instance (ChatVertexAI or ChatGoogleGenerativeAI)
    
    Raises:
        ValueError: If no valid authentication method is available
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Get model name from environment variable if not provided
    if model_name is None:
        model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash-lite")
    
    if not GEMINI_API_AVAILABLE:
        raise ValueError(
            "langchain-google-genai is not installed. "
            "Please install it with: pip install langchain-google-genai"
        )
    
    logger.info(f"Initializing LLM with model: {model_name}")
    
    # Check if we should use Vertex AI (preferred for GCP)
    use_vertex_ai = os.getenv("USE_VERTEX_AI", "true").lower() == "true"
    use_vertex_ai_via_api = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "false").lower() == "true"
    logger.info(f"USE_VERTEX_AI: {use_vertex_ai}, GOOGLE_GENAI_USE_VERTEXAI: {use_vertex_ai_via_api}")
    
    # Check for API keys
    google_api_key = os.getenv("GOOGLE_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    # Priority 1: Try Vertex AI with service account credentials (most reliable for GCP)
    if use_vertex_ai:
        # Use Vertex AI via langchain_google_genai with Application Default Credentials
        # This works with GOOGLE_APPLICATION_CREDENTIALS or default credentials
        try:
            # Get project ID from environment or credentials
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT")
            location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
            
            if not project_id:
                raise ValueError(
                    "GOOGLE_CLOUD_PROJECT or GCP_PROJECT environment variable is not set. "
                    "Required for Vertex AI."
                )
            
            logger.info(f"Initializing Vertex AI with service account credentials, model: {model_name}, project: {project_id}, location: {location}")
            
            # Configure langchain_google_genai to use Vertex AI
            os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
            os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
            os.environ["GOOGLE_CLOUD_LOCATION"] = location
            
            # Use ChatGoogleGenerativeAI with Vertex AI routing (no API key needed with service account)
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                temperature=temperature,
            )
            logger.info("Vertex AI LLM initialized successfully with service account")
            return llm
        except Exception as e:
            logger.warning(f"Failed to initialize Vertex AI with service account: {str(e)}. Will try API key method if available.")
            # Continue to try API key method below
    
    # Priority 2: Try Vertex AI via API key (may have permission issues)
    if use_vertex_ai_via_api and google_api_key:
        if not GEMINI_API_AVAILABLE:
            raise ValueError(
                "GOOGLE_GENAI_USE_VERTEXAI is set to true, but langchain-google-genai is not installed. "
                "Please install it with: pip install langchain-google-genai"
            )
        
        try:
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT")
            location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
            
            if not project_id:
                raise ValueError(
                    "GOOGLE_CLOUD_PROJECT or GCP_PROJECT environment variable is not set. "
                    "Required for Vertex AI."
                )
            
            logger.info(f"Initializing Vertex AI via API key with model: {model_name}, project: {project_id}, location: {location}")
            
            # Use ChatGoogleGenerativeAI with Vertex AI routing
            # Set environment variables that langchain_google_genai will use
            os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"
            os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
            os.environ["GOOGLE_CLOUD_LOCATION"] = location
            
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=google_api_key,
                temperature=temperature,
            )
            logger.info("Vertex AI LLM (via API key) initialized successfully")
            return llm
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI LLM via API key: {str(e)}", exc_info=True)
            # If API key method fails due to permissions, provide helpful error
            error_msg = str(e)
            if "PERMISSION_DENIED" in error_msg or "403" in error_msg:
                raise ValueError(
                    f"Vertex AI API key permission denied: {str(e)}. "
                    "API keys for Vertex AI require IAM permissions. "
                    "Please either:\n"
                    "1. Grant the 'Vertex AI User' role to the service account associated with your API key, OR\n"
                    "2. Use service account credentials (GOOGLE_APPLICATION_CREDENTIALS) instead, OR\n"
                    "3. Try using a different model like 'gemini-1.5-flash' or 'gemini-1.5-pro'"
                ) from e
            raise ValueError(
                f"Failed to initialize Vertex AI LLM via API key: {str(e)}. "
                "Please verify your GOOGLE_API_KEY is valid and has Vertex AI permissions."
            ) from e
    
    # Fall back to Gemini API (for local development with API keys)
    if GEMINI_API_AVAILABLE:
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is not set. "
                "Please set it in your .env file or environment, or use Vertex AI with GOOGLE_APPLICATION_CREDENTIALS."
            )
        
        try:
            return ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=temperature,
            )
        except Exception as e:
            raise ValueError(
                f"Failed to initialize Gemini API LLM: {str(e)}. "
                "Please verify your GEMINI_API_KEY is valid."
            ) from e
    
    raise ValueError(
        "No LLM backend available. Please install langchain-google-genai."
    )

def get_llm_with_structured_output(
    model_name: str = None,
    temperature: float = 0.0,
    response_format: dict = None
):
    """
    Initialize and return a LangChain LLM instance configured for structured output.
    
    Args:
        model_name: The Gemini model to use. If None, reads from GEMINI_MODEL_NAME env variable.
                   Defaults to "gemini-2.5-flash-lite" if not set.
        temperature: Temperature for the model (default: 0.0 for deterministic output)
        response_format: Optional response format specification for structured output
    
    Returns:
        LLM instance configured for structured output
    """
    llm = get_llm(model_name=model_name, temperature=temperature)
    
    # Configure for structured output if response_format is provided
    if response_format:
        # Note: Gemini models support structured output through response_format parameter
        # This may need to be adjusted based on the specific LangChain version
        pass
    
    return llm
