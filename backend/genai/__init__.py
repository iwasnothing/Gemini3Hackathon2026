"""
GenAI module for SecureBI backend.
Provides LLM integration and data cube generation capabilities.
"""

from .llm import get_llm, get_llm_with_structured_output
from .data_cube_prompt import (
    DataCubeStructure,
    create_data_cube_prompt,
    generate_data_cube,
    create_data_cube_prompt_simple
)

__all__ = [
    "get_llm",
    "get_llm_with_structured_output",
    "DataCubeStructure",
    "create_data_cube_prompt",
    "generate_data_cube",
    "create_data_cube_prompt_simple",
]
