"""
Data Cube Prompt module for SecureBI backend.
Creates prompts for generating data cubes; uses Google Vertex AI SDK (no LangChain).
"""
import json
import os
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from .llm import generate_content as vertex_generate_content


class DataCubeStructure(BaseModel):
    """Structured output schema for data cube generation."""
    name: str = Field(description="A descriptive name for the data cube")
    description: str = Field(description="A detailed description of what the data cube represents")
    query: str = Field(description="The SQL query that defines the data cube")
    dimensions: List[str] = Field(description="List of dimension fields (e.g., date, category, region)")
    measures: List[str] = Field(description="List of measure fields (e.g., sales, revenue, count)")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Additional metadata about the data cube (e.g., time_granularity, currency)"
    )


def _build_tables_text(available_tables: List[Dict[str, Any]]) -> str:
    """Format available tables and columns into a string for the prompt."""
    tables_info = ""
    for table in available_tables:
        table_name = table.get("name", "unknown")
        schema_name = table.get("schema", "")
        columns = table.get("columns", [])
        row_count = table.get("row_count", 0)
        tables_info += f"\nTable: {schema_name + '.' if schema_name else ''}{table_name}\n"
        tables_info += f"  Row Count: {row_count}\n"
        tables_info += "  Columns:\n"
        for col in columns:
            col_name = col.get("name", "")
            col_type = col.get("type", "")
            col_desc = col.get("description", "")
            pk = " (PRIMARY KEY)" if col.get("primary_key", False) else ""
            tables_info += f"    - {col_name}: {col_type}{pk}"
            if col_desc:
                tables_info += f" - {col_desc}"
            tables_info += "\n"
    return tables_info


def build_data_cube_prompt(
    user_request: str,
    data_source_info: Dict[str, Any],
    available_tables: List[Dict[str, Any]],
    schema_info: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Build the full prompt string for generating a data cube from a natural language request.
    """
    tables_info = _build_tables_text(available_tables)
    data_source_name = data_source_info.get("name", "Unknown")
    data_source_type = data_source_info.get("type", "unknown")
    database_name = data_source_info.get("database", "unknown")

    system_and_user = f"""You are an expert data engineer specializing in creating semantic data cubes for business intelligence.

Your task is to analyze the user's request and create a well-structured data cube definition.

IMPORTANT: You MUST output the result in the EXACT JSON format specified below. Use these exact field names:
- "name" (not "cube_name" or "cubeName")
- "description" 
- "query" (not "sql_query" or "sqlQuery")
- "dimensions" (as an array of strings, not objects)
- "measures" (as an array of strings, not objects)
- "metadata" (optional object)

Example format:
{{
  "name": "SalesByRegion",
  "description": "Sales data grouped by region",
  "query": "SELECT region, SUM(sales) as total_sales FROM sales_table GROUP BY region",
  "dimensions": ["region"],
  "measures": ["total_sales"],
  "metadata": {{}}
}}

Data Source Information:
- Name: {data_source_name}
- Type: {data_source_type}
- Database: {database_name}

Available Tables and Schemas (this is the ONLY schema you can use):
{tables_info}

Guidelines:
- Generate valid SQL queries appropriate for the data source type ({data_source_type})
- Identify dimensions (fields used for grouping/filtering like dates, categories, regions) as simple strings
- Identify measures (fields used for aggregation like sums, counts, averages) as simple strings
- Ensure the query is optimized and follows best practices
- When data needed for the cube lives in multiple tables, you MUST include explicit JOINs with correct join keys based ONLY on the columns in the provided schema
- Add WHERE clauses if needed to filter data appropriately
- Use appropriate aggregate functions (SUM, COUNT, AVG, etc.) for measures
- Dimensions and measures should be arrays of strings (field names), not objects
- You MUST ONLY reference tables and columns that appear in the "Available Tables and Schemas" section above.
- NEVER invent new table or column names. If the user asks for a field that does not exist, choose the closest matching existing column instead and still produce a valid query.
- Always qualify tables/columns consistently with the names shown in the schema (including dataset/schema prefixes if present).

CRITICAL: Output ONLY valid JSON matching the exact schema above.

User Request: {user_request}

Please create a data cube definition based on this request. Output the result as valid JSON matching the exact format specified."""
    return system_and_user


def create_data_cube_prompt(
    user_request: str,
    data_source_info: Dict[str, Any],
    available_tables: List[Dict[str, Any]],
    schema_info: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Build the full prompt string for data cube generation (kept for API compatibility).
    Returns the prompt as a single string for use with Vertex AI SDK.
    """
    return build_data_cube_prompt(
        user_request=user_request,
        data_source_info=data_source_info,
        available_tables=available_tables,
        schema_info=schema_info,
    )


def generate_data_cube(
    user_request: str,
    data_source_info: Dict[str, Any],
    available_tables: List[Dict[str, Any]],
    schema_info: Optional[Dict[str, Any]] = None,
    model_name: str = None,
) -> DataCubeStructure:
    """
    Generate a data cube definition from a natural language request using Vertex AI (Google Gen AI SDK).
    """
    if model_name is None:
        model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash-lite")

    prompt = build_data_cube_prompt(
        user_request=user_request,
        data_source_info=data_source_info,
        available_tables=available_tables,
        schema_info=schema_info,
    )

    try:
        content = vertex_generate_content(
            prompt=prompt,
            model=model_name,
            temperature=0.0,
        )
    except Exception as e:
        raise ValueError(
            f"Failed to generate data cube structure: {str(e)}. "
            "Please ensure your request is clear and the available tables/schemas are correct."
        ) from e

    try:
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        json_str = json_match.group(0) if json_match else content
        result = json.loads(json_str)
    except json.JSONDecodeError:
        try:
            json_str = content.replace("'", '"')
            result = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"Failed to parse JSON from model output: {str(e)}. "
                f"Model output: {content[:500] if content else 'N/A'}"
            ) from e

    if "cube_name" in result and "name" not in result:
        result["name"] = result.pop("cube_name")
    if "sql_query" in result and "query" not in result:
        result["query"] = result.pop("sql_query")
    if result.get("dimensions") and isinstance(result["dimensions"][0], dict):
        result["dimensions"] = [d.get("name", str(d)) for d in result["dimensions"]]
    if result.get("measures") and isinstance(result["measures"][0], dict):
        result["measures"] = [m.get("name", str(m)) for m in result["measures"]]

    return DataCubeStructure(**result)


def create_data_cube_prompt_simple(
    user_request: str,
    table_schemas: List[Dict[str, Any]],
) -> str:
    """
    Create a simple text prompt for data cube generation (alternative to template-based approach).
    """
    schemas_text = "\n".join([
        f"Table: {t.get('name', 'unknown')}\n"
        f"Columns: {', '.join([c.get('name', '') for c in t.get('columns', [])])}"
        for t in table_schemas
    ])
    return f"""Create a data cube definition based on the following request:

Request: {user_request}

Available Tables:
{schemas_text}

Please provide a JSON response with the following structure:
{{
    "name": "descriptive name",
    "description": "detailed description",
    "query": "SQL query",
    "dimensions": ["dimension1", "dimension2"],
    "measures": ["measure1", "measure2"],
    "metadata": {{"key": "value"}}
}}"""
