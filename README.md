# Insight Canvas - AI-Assisted Self-Served BI Dashboard Tool

A modern, full-stack web application for building AI-assisted business intelligence dashboards. Users can configure data source connectors, view and edit database schemas, create data cubes using natural language queries, and build interactive dashboards with AI assistance.

## Features

### 🔌 Data Source Connectors
- Configure multiple data source types (PostgreSQL, MySQL, MongoDB, Snowflake, BigQuery)
- View connection status and last sync information
- Manage data source configurations

### 📊 Schema Viewer & Editor
- View database schema with tables and columns
- Edit table and column descriptions (domain descriptions)
- Explore table structures and relationships

### 🎲 Data Cube Creation
- Create data cubes using natural language queries
- Preview query results before saving
- Define dimensions and measures
- Free-text query interface for intuitive data exploration

### 📈 Interactive Dashboards
- Build interactive dashboards with multiple widget types:
  - Line charts
  - Bar charts
  - Pie charts
  - Metric cards
  - Data tables
- Drag-and-drop dashboard layout (UI ready for implementation)
- Real-time data visualization

### 🤖 AI Assistant
- Each dashboard includes an AI assistant
- Ask questions about dashboard data
- Get insights and explanations
- Natural language Q&A interface

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Next.js API Routes

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
insight-canvas/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes (backend)
│   │   ├── data-sources/     # Data source endpoints
│   │   ├── data-cubes/       # Data cube endpoints
│   │   └── dashboards/       # Dashboard endpoints
│   ├── data-sources/         # Data sources pages
│   ├── data-cubes/           # Data cubes pages
│   ├── dashboards/           # Dashboard pages
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── Layout.tsx            # Main layout wrapper
│   └── Sidebar.tsx           # Navigation sidebar
├── lib/                      # Utilities and types
│   ├── types.ts              # TypeScript type definitions
│   └── mockData.ts           # Mock data for development
└── package.json              # Dependencies
```

## API Endpoints

### Data Sources
- `GET /api/data-sources` - List all data sources
- `POST /api/data-sources` - Create a new data source
- `GET /api/data-sources/[id]/schema` - Get schema for a data source

### Data Cubes
- `GET /api/data-cubes` - List all data cubes
- `POST /api/data-cubes` - Create a new data cube
- `POST /api/data-cubes/query` - Execute a natural language query

### Dashboards
- `GET /api/dashboards` - List all dashboards
- `POST /api/dashboards` - Create a new dashboard
- `POST /api/dashboards/[id]/ai-chat` - Send message to AI assistant

## Current Status

This application is built with mock data for demonstration purposes. All API endpoints return mock data to showcase the UI and functionality. To integrate with real data sources, you would need to:

1. Replace mock data in `lib/mockData.ts` with actual database queries
2. Implement real database connectors for each data source type
3. Integrate with an AI/LLM service for natural language query processing
4. Add authentication and authorization
5. Implement real-time data synchronization

## License

MIT
