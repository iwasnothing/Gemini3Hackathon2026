"""
Data Cube Prompt module for SecureBI backend.
Creates prompts for generating data cubes with structured output.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from .llm import get_llm


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


def create_data_cube_prompt(
    user_request: str,
    data_source_info: Dict[str, Any],
    available_tables: List[Dict[str, Any]],
    schema_info: Optional[Dict[str, Any]] = None
) -> ChatPromptTemplate:
    """
    Create a prompt template for generating a data cube from a natural language request.
    
    Args:
        user_request: The user's natural language request for creating a data cube
        data_source_info: Information about the data source (name, type, database, etc.)
        available_tables: List of available tables with their schemas
        schema_info: Optional additional schema information
    
    Returns:
        ChatPromptTemplate: Configured prompt template
    """
    
    # Format tables information
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
    
    # Build the prompt
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """You are an expert data engineer specializing in creating semantic data cubes for business intelligence.

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
- You MUST ONLY reference tables and columns that appear in the \"Available Tables and Schemas\" section above.
- NEVER invent new table or column names. If the user asks for a field that does not exist, choose the closest matching existing column instead and still produce a valid query.
- Always qualify tables/columns consistently with the names shown in the schema (including dataset/schema prefixes if present).

CRITICAL: Output ONLY valid JSON matching the exact schema above."""),
        ("human", "User Request: {user_request}\n\nPlease create a data cube definition based on this request. Output the result as valid JSON matching the exact format specified.")
    ])
    
    return prompt_template.partial(
        data_source_name=data_source_info.get("name", "Unknown"),
        data_source_type=data_source_info.get("type", "unknown"),
        database_name=data_source_info.get("database", "unknown"),
        tables_info=tables_info
    )


def generate_data_cube(
    user_request: str,
    data_source_info: Dict[str, Any],
    available_tables: List[Dict[str, Any]],
    schema_info: Optional[Dict[str, Any]] = None,
    model_name: str = None
) -> DataCubeStructure:
    """
    Generate a data cube definition from a natural language request using LLM.
    
    Args:
        user_request: The user's natural language request for creating a data cube
        data_source_info: Information about the data source
        available_tables: List of available tables with their schemas
        schema_info: Optional additional schema information
        model_name: The Gemini model to use. If None, reads from GEMINI_MODEL_NAME env variable.
                   Defaults to "gemini-2.5-flash-lite" if not set.
    
    Returns:
        DataCubeStructure: Generated data cube structure
    
    Raises:
        ValueError: If the LLM fails to generate valid structured output
    """
    import os
    # Get model name from environment variable if not provided
    if model_name is None:
        model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash-lite")
    # Create prompt
    prompt = create_data_cube_prompt(
        user_request=user_request,
        data_source_info=data_source_info,
        available_tables=available_tables,
        schema_info=schema_info
    )
    
    # Initialize LLM
    llm = get_llm(model_name=model_name, temperature=0.0)
    
    # Create output parser
    parser = PydanticOutputParser(pydantic_object=DataCubeStructure)
    
    # Create chain without parser first to get raw output
    chain_without_parser = prompt | llm
    
    # Generate response
    try:
        # Get raw LLM output
        raw_output = chain_without_parser.invoke({"user_request": user_request})
        
        # Extract content from the response
        if hasattr(raw_output, 'content'):
            content = raw_output.content
        elif isinstance(raw_output, str):
            content = raw_output
        else:
            content = str(raw_output)
        
        # Try to parse JSON from the content
        import json
        import re
        
        # Extract JSON from the content (handle cases where LLM adds extra text)
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = content
        
        # Parse JSON
        try:
            result = json.loads(json_str)
        except json.JSONDecodeError:
            # Try to fix common JSON issues
            json_str = json_str.replace("'", '"')  # Replace single quotes
            result = json.loads(json_str)
        
        # Transform result to match expected schema
        # Handle cube_name -> name
        if "cube_name" in result and "name" not in result:
            result["name"] = result.pop("cube_name")
        
        # Handle sql_query -> query
        if "sql_query" in result and "query" not in result:
            result["query"] = result.pop("sql_query")
        
        # Handle dimensions as objects -> strings
        if "dimensions" in result and result["dimensions"]:
            if result["dimensions"] and isinstance(result["dimensions"][0], dict):
                result["dimensions"] = [dim.get("name", str(dim)) for dim in result["dimensions"]]
        
        # Handle measures as objects -> strings
        if "measures" in result and result["measures"]:
            if result["measures"] and isinstance(result["measures"][0], dict):
                result["measures"] = [measure.get("name", str(measure)) for measure in result["measures"]]
        
        # Validate and return as DataCubeStructure
        return DataCubeStructure(**result)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"Failed to parse JSON from LLM output: {str(e)}. "
            f"LLM output: {content[:500] if 'content' in locals() else 'N/A'}"
        ) from e
    except Exception as e:
        raise ValueError(
            f"Failed to generate data cube structure: {str(e)}. "
            "Please ensure your request is clear and the available tables/schemas are correct."
        ) from e


def create_data_cube_prompt_simple(
    user_request: str,
    table_schemas: List[Dict[str, Any]]
) -> str:
    """
    Create a simple text prompt for data cube generation (alternative to template-based approach).
    
    Args:
        user_request: The user's natural language request
        table_schemas: List of table schemas with columns
    
    Returns:
        str: Formatted prompt string
    """
    schemas_text = "\n".join([
        f"Table: {t.get('name', 'unknown')}\n"
        f"Columns: {', '.join([c.get('name', '') for c in t.get('columns', [])])}"
        for t in table_schemas
    ])
    
    prompt = f"""Create a data cube definition based on the following request:

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
    
    return prompt
