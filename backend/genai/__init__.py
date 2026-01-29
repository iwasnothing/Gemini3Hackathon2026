"""
GenAI module for SecureBI backend.
Uses Google Vertex AI SDK (google-genai) for data cube generation—no LangChain.
"""

from .llm import get_vertex_client, generate_content
from .data_cube_prompt import (
    DataCubeStructure,
    create_data_cube_prompt,
    build_data_cube_prompt,
    generate_data_cube,
    create_data_cube_prompt_simple,
)

__all__ = [
    "get_vertex_client",
    "generate_content",
    "DataCubeStructure",
    "create_data_cube_prompt",
    "build_data_cube_prompt",
    "generate_data_cube",
    "create_data_cube_prompt_simple",
]
