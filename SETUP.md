# SecureBI Setup Guide

This guide will help you set up both the Next.js frontend and Python FastAPI backend.

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- MySQL 5.7+ or MySQL 8.0+
- pip (Python package manager)

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your MySQL database:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=securebi
   ```

5. **Create the MySQL database:**
   ```sql
   CREATE DATABASE securebi;
   ```

6. **Run the backend server:**
   ```bash
   python run.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   The backend API will be available at `http://localhost:8000`
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   The `.env.local` file should already contain:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   BACKEND_URL=http://localhost:8000
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Architecture

### Backend (Python FastAPI)
- **Location:** `backend/`
- **Port:** 8000
- **Database:** MySQL (configured via `.env`)
- **ORM:** SQLAlchemy
- **API Documentation:** Available at `/docs` endpoint

### Frontend (Next.js)
- **Location:** Root directory
- **Port:** 3000
- **API Routes:** All API routes in `app/api/` proxy requests to the Python backend

### Data Flow
1. Frontend components make requests to Next.js API routes (`/api/*`)
2. Next.js API routes proxy requests to Python FastAPI backend (`http://localhost:8000/api/*`)
3. Python backend queries MySQL database using SQLAlchemy
4. Response flows back through the same path

## Database Schema

The backend automatically creates the following tables on first run:
- `data_sources` - Data source configurations
- `tables` - Table schema information
- `data_cubes` - Semantic data layer definitions
- `dashboards` - Dashboard configurations
- `data_entitlements` - User access permissions
- `app_configs` - Application configuration settings

## Troubleshooting

### Backend won't start
- Check that MySQL is running
- Verify database credentials in `.env`
- Ensure the database `securebi` exists
- Check that port 8000 is not in use

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- Check CORS settings in `backend/app/main.py`

### Database connection errors
- Verify MySQL is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`
- Verify credentials in `.env` file
- Ensure MySQL user has proper permissions

## Development

### Running both servers

In separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python run.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Production Deployment

For production, you'll need to:
1. Set up proper environment variables
2. Use a production WSGI server (e.g., Gunicorn) for the backend
3. Configure reverse proxy (nginx) if needed
4. Set up SSL certificates
5. Use environment-specific database credentials
6. Enable proper authentication and authorization
