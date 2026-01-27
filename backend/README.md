# SecureBI Backend API

Python FastAPI backend for SecureBI application.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your MySQL database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=securebi
```

4. Create the MySQL database:
```sql
CREATE DATABASE securebi;
```

5. Run the application:
```bash
python -m app.main
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Models

The backend uses SQLAlchemy with MySQL to store:
- Data Sources
- Tables (schema information)
- Data Cubes (Semantic Data Layer)
- Dashboards
- Data Entitlements
- App Configs

## API Endpoints

### Data Sources
- `GET /api/data-sources` - List all data sources
- `POST /api/data-sources` - Create a new data source
- `GET /api/data-sources/{id}/schema` - Get schema for a data source
- `PUT /api/data-sources/{id}` - Update a data source
- `DELETE /api/data-sources/{id}` - Delete a data source

### Data Cubes (Semantic Data Layer)
- `GET /api/data-cubes` - List all data cubes
- `POST /api/data-cubes` - Create a new data cube
- `POST /api/data-cubes/query` - Execute a natural language query

### Dashboards
- `GET /api/dashboards` - List all dashboards
- `POST /api/dashboards` - Create a new dashboard
- `GET /api/dashboards/{id}` - Get a specific dashboard
- `PUT /api/dashboards/{id}` - Update a dashboard
- `DELETE /api/dashboards/{id}` - Delete a dashboard
- `POST /api/dashboards/{id}/ai-chat` - Send message to AI assistant

### Data Marketplace
- `GET /api/data-marketplace` - Get all resources (data sources, cubes, dashboards)

### Data Entitlement
- `GET /api/data-entitlement` - Get entitlements for current user
- `POST /api/data-entitlement` - Create a new entitlement
- `DELETE /api/data-entitlement/{id}` - Delete an entitlement

### App Config
- `GET /api/app-config` - Get all application configs
- `GET /api/app-config/{key}` - Get a specific config
- `POST /api/app-config` - Create a new config
- `PUT /api/app-config/{key}` - Update a config
- `DELETE /api/app-config/{key}` - Delete a config
