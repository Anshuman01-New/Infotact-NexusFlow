# NexusFlow: Visual IoT Telemetry & Rule Engine

NexusFlow is a visual, no-code rule engine for Internet of Things (IoT) telemetry. It allows factory floor managers and operators to create dynamic stream-processing rules by dragging and connecting blocks on a visual canvas instead of requiring developers to hardcode business logic.

---

## 🚀 4-Week Development Plan & Status

- **Week 1: Establish the Foundation** ✅ *(Completed)*
  - **Backend**: Node.js & Express server, MongoDB connection, native Time-Series collection (`telemetries`), ingestion endpoints (`/api/telemetry`, `/api/telemetry/batch`), query APIs, automated storage tests, and mock sensor simulator.
  - **Frontend**: Vite + React, React Flow integration, custom node types (Sensor, Filter, Condition, Action), draggable sidebar palette, interactive canvas, node inspector, JSON graph serialization, and live telemetry storage explorer.
  - **Result**: Mock readings can be stored into MongoDB Time-Series collections, and basic visual workflows can be constructed and serialized.

- **Week 2: Build the Logic Engine** ✅ *(Completed)*
  - **Backend**: Graph parser, DAG cycle detection, topological execution sorting (Kahn's algorithm), dynamic RxJS pipeline compiler (`Sensor` &rarr; `Moving Average / Math Operation` &rarr; `Condition` &rarr; `Action Trigger`), and in-memory rule engine dispatcher.
  - **Frontend**: Custom Data Source, Math Operation, and Action Trigger nodes, backend DAG graph validation integration, interactive in-browser simulation runner, MongoDB cloud workflow persistence, and JSON download/import.
  - **Mid-Project Demonstrations**: 
    - MongoDB Time-Series collections benchmarked at **>5,000 writes/second** with ~9.9 bytes/reading footprint.
    - Accurate frontend serialization of complex visual graphs into valid JSON with bidirectional import/export.

- **Week 3: Real-Time Execution** ⏳ *(Upcoming)*
  - Live pipeline execution with incoming telemetry, Socket.IO real-time event push, and live Recharts telemetry dashboard.

- **Week 4: Alerts & Final Polish** ⏳ *(Upcoming)*
  - Webhook & mock SMS dispatching, visual wire glow effects, cooldown deduplication, and final integration.

---

## 🏃 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ or v22+)
- **MongoDB** (v6.0+ or v8.0+) running locally on port 27017

### 2. Backend Setup & Automated Verification
```powershell
cd backend
npm install
npm run test:compiler    # Runs Week 2 Logic Engine & RxJS Compiler test suite (17 checks)
npm run test:storage     # Runs Week 1 Time-Series storage verification
npm run benchmark        # Runs Mid-Project Review 5,000 writes/sec benchmark
npm run dev              # Starts backend on http://localhost:5000
```

### 3. Frontend Setup & Run
In a new terminal:
```powershell
cd frontend
npm install
npm run dev              # Starts frontend on http://localhost:3000
```

### 4. Run Mock Sensor Simulator
In a separate terminal:
```powershell
cd backend
npm run simulate         # Streams simulated sensor readings into the ingestion API
```

---

## 📖 Subproject Documentation & Testing Guides
- [Backend Documentation & Testing Guide (Week 1 & 2)](file:///backend/README.md)
- [Frontend Documentation & Testing Guide (Week 1 & 2)](file:///frontend/README.md)
