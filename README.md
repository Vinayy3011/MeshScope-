# MeshScope — Wireless Mesh Network Performance Analyzer

MeshScope is a real-time wireless mesh network monitoring and diagnostic dashboard built for analyzing data communication across interconnected gateway, relay, and edge nodes. It combines an interactive RF topology visualizer, synchronized time-series telemetry charts, automated connectivity alerting, and exportable multi-page PDF diagnostic reports.

## Key Features

- **Real-Time Network Telemetry**
  - Monitors per-node and network-wide **latency** (mean & P95 in ms), **packet loss** (%), **throughput** (Mbps), **RSSI/SNR**, **airtime utilization**, and **hop counts**.
  - Supports live stream pause/resume and configurable sampling intervals (`1x` at 1s, `2x` at 0.5s).

- **Interactive Mesh Topology Visualizer**
  - Displays primary ETX-weighted routing paths alongside redundant backup links with directional traffic flow indicators.
  - Supports node dragging to test distance-dependent RF path loss, zoom controls, RF coverage ring overlays, and dynamic deployment of additional relay or edge nodes.
  - Includes a Node Inspector panel with live peer link metrics, active route tracing back to the gateway, and per-node fault simulation (`RF Noise`, `Congestion`, `Drop Node`).

- **Automated Connectivity Alert Engine**
  - Evaluates live node telemetry against configurable warning and critical thresholds for latency, packet loss, throughput floors, and unreachable/partitioned nodes.
  - Generates deduplicated alerts with automated remediation recommendations, acknowledgement controls, and auto-resolution upon node recovery.

- **Fault Simulation Presets**
  - Built-in scenario presets in the sidebar (`Nominal Baseline`, `RF Interference`, `Backbone Congestion`, `Node Failover Test`) to stress-test multi-hop failover and alert workflows.

- **Exportable PDF & CSV Diagnostic Reports**
  - Generates multi-page PDF reports using `jsPDF` and `jspdf-autotable` featuring an executive KPI summary, embedded PNG snapshots of the live topology and telemetry trend charts, a per-node RF diagnostics matrix, and an automated incident log.
  - Exports raw historical telemetry samples to CSV for offline analysis.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **PDF & Reporting**: `jspdf`, `jspdf-autotable`, HTML5 Canvas snapshot rendering

## Project Structure

```text
├── index.html                          # Entry HTML and typography imports
├── package.json                        # Scripts and dependencies
└── src/
    ├── App.tsx                         # Main application layout and state orchestration
    ├── index.css                       # Tailwind v4 configuration and typography styles
    ├── types/
    │   └── mesh.ts                     # TypeScript interfaces for nodes, links, alerts, and telemetry
    ├── engine/
    │   └── meshSimulator.ts            # RF path-loss physics, Dijkstra ETX routing, and alert engine
    ├── utils/
    │   ├── pdfReportGenerator.ts       # Multi-page PDF diagnostic report builder
    │   └── csvExport.ts                # Raw CSV telemetry exporter
    └── components/
        ├── Sidebar.tsx                 # Navigation views, routing protocol selector, and fault presets
        ├── HeaderBar.tsx               # Stream controls, theme toggle, and quick PDF export
        ├── KpiStrip.tsx                # Live KPI summary cards with inline sparklines
        ├── TopologyCanvas.tsx          # Interactive SVG topology stage and Node Inspector
        ├── TelemetryCharts.tsx         # Synchronized SVG time-series charts with crosshair inspection
        ├── NodeTable.tsx               # Searchable and sortable per-node diagnostics matrix
        ├── AlertsPanel.tsx             # Alert filtering, acknowledgement, and remediation console
        ├── ReportPreviewView.tsx       # Diagnostic report configuration and preview workspace
        └── ThresholdSettingsView.tsx   # Alert threshold policy editor
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation & Development

```bash
# Install dependencies
npm install

# Start the development server on port 3000
npm run dev
```

### Build & Type Check

```bash
# Run TypeScript type checking
npm run lint

# Build for production
npm run build
```

## Deploying to Vercel

`vercel.json` is preconfigured for Vite static deployment (`dist/` output with SPA routing).

### Option A: Via GitHub (Recommended)
1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), click **Add New → Project**, and import your repository.
3. Keep the detected Vite settings (`Build Command: npm run build`, `Output Directory: dist`) and click **Deploy**.
4. Vercel will assign a clean URL such as `https://meshscope-analyzer.vercel.app`. You can rename the project or attach a custom domain under **Settings → Domains**.

### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

