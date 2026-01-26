# Insight Canvas - AI-Assisted Self-Served BI Dashboard Tool

A modern, full-stack web application for building AI-assisted business intelligence dashboards. Users can configure data source connectors, view and edit database schemas, create AI Semitic Data Layers with metadata using natural language queries, and build interactive dashboards with AI assistance.

## Features

### 🔌 Data Source Connectors
- Configure multiple data source types (PostgreSQL, MySQL, MongoDB, Snowflake, BigQuery)
- View connection status and last sync information
- Manage data source configurations

### 📊 Schema Viewer & Editor
- View database schema with tables and columns
- Edit table and column descriptions (domain descriptions)
- Explore table structures and relationships

### 🎲 AI Semitic Data Layer Creation
- Create AI Semitic Data Layers with metadata using natural language queries
- Preview query results before saving
- Define dimensions and measures
- Store and manage metadata for enhanced data understanding
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

### Test Automation

Run automated user journey walkthroughs:
```bash
npm run test
```

See [TEST_AUTOMATION.md](TEST_AUTOMATION.md) for details. Tests generate visual documentation and are NOT for CI/CD or quality management.

## Project Structure

```
insight-canvas/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes (backend)
│   │   ├── data-sources/     # Data source endpoints
│   │   ├── data-cubes/       # AI Semitic Data Layer endpoints
│   │   └── dashboards/       # Dashboard endpoints
│   ├── data-sources/         # Data sources pages
│   ├── data-cubes/           # AI Semitic Data Layer pages
│   ├── dashboards/           # Dashboard pages
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── Layout.tsx            # Main layout wrapper
│   └── Sidebar.tsx           # Navigation sidebar
├── lib/                      # Utilities and types
│   ├── services/             # Service layer
│   │   ├── interfaces.ts     # Service contracts
│   │   ├── factory.ts        # Service factory
│   │   └── mock/             # Mock implementations
│   ├── types.ts              # TypeScript type definitions
│   └── mockData.ts           # Mock data for development
└── package.json              # Dependencies
```

## API Endpoints

### Data Sources
- `GET /api/data-sources` - List all data sources
- `POST /api/data-sources` - Create a new data source
- `GET /api/data-sources/[id]/schema` - Get schema for a data source

### AI Semitic Data Layers
- `GET /api/data-cubes` - List all AI Semitic Data Layers
- `POST /api/data-cubes` - Create a new AI Semitic Data Layer with metadata
- `POST /api/data-cubes/query` - Execute a natural language query

### Dashboards
- `GET /api/dashboards` - List all dashboards
- `POST /api/dashboards` - Create a new dashboard
- `POST /api/dashboards/[id]/ai-chat` - Send message to AI assistant

## Mock vs Real Data

The application uses a service layer pattern to isolate mock data from business logic:

### Using Mock Data (Default)
Mock data is enabled by default. No configuration needed.

### Switching to Real Data
1. Create a `.env.local` file:
```bash
NEXT_PUBLIC_USE_MOCK=false
```

2. Implement real services in `lib/services/real/`:
   - `RealDataSourceService.ts`
   - `RealDataCubeService.ts` (for AI Semitic Data Layers)
   - `RealDashboardService.ts`

3. Update `lib/services/factory.ts` to use real implementations

### Service Architecture
- **Interfaces** (`lib/services/interfaces.ts`) - Define contracts
- **Factory** (`lib/services/factory.ts`) - Switch between mock/real
- **Mock Services** (`lib/services/mock/`) - Mock implementations
- **API Routes** - Use services via factory (no direct mock dependencies)

## License

MIT
