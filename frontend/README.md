# NexusFlow - Frontend (Week 1: Visual Graph Builder)

NexusFlow's frontend provides an intuitive drag-and-drop workflow canvas for configuring IoT stream processing rules without writing code. In **Week 1**, the foundation is established using **React**, **React Flow**, and **Vite**.

---

## 🛠️ Tech Stack

- **Framework**: React 18+
- **Build Tool**: Vite 6+
- **Visual Graph Builder**: React Flow (`reactflow` 11.11+)
- **Icons**: Lucide React
- **HTTP Client**: Axios (configured with Vite `/api` proxy)
- **Styling**: Industrial Dark Theme CSS with reactive SVG handles

---

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx               # Navigation bar, live health indicator & quick actions
│   │   ├── Sidebar.jsx              # Draggable node palette with categories
│   │   └── CustomNodes/
│   │       ├── SensorNode.jsx       # Data source node (e.g., Turbine Sensor)
│   │       ├── FilterNode.jsx       # Stream filter node (e.g., Moving Average)
│   │       ├── ConditionNode.jsx    # Logical condition node (e.g., Temp > 80°C)
│   │       └── ActionNode.jsx       # Trigger action node (e.g., SMS Alert)
│   ├── pages/
│   │   ├── WorkflowBuilder.jsx      # React Flow interactive canvas & inspector
│   │   ├── Telemetry.jsx            # Live telemetry storage & ingestion explorer
│   │   ├── Dashboard.jsx            # Week 3 placeholder
│   │   ├── Devices.jsx              # Device management placeholder
│   │   └── Alerts.jsx               # Alert log placeholder
│   ├── services/
│   │   ├── api.js                   # API client for backend telemetry endpoints
│   │   └── socket.js                # WebSocket service stub (Week 3)
│   ├── App.jsx                      # Main app shell & view switcher
│   ├── index.css                    # Design system & dark theme overrides
│   └── main.jsx                     # Vite React entrypoint
├── index.html                       # HTML template
├── package.json                     # Frontend dependencies
└── vite.config.js                   # Vite config with backend API proxy
```

---

## 🧩 Week 1 Custom Node Types

The visual builder supports 4 core node types with custom handles and status badges:

| Node Type | Purpose | Handles | Example Configuration |
|-----------|---------|---------|-----------------------|
| **Sensor Node** | Telemetry source | Source (Right) | Device: `TURBINE_001`, Metric: `temperature` |
| **Filter Node** | Stream transformation | Target (Left), Source (Right) | Type: `Moving Average`, Window: `5` readings |
| **Condition Node** | Threshold comparison | Target (Left), Source (Right) | Rule: `value > 80°C` |
| **Action Node** | Notification / dispatch | Target (Left) | Action: `SMS Alert`, Target: `+1 (555) 019-2831` |

---

## 🎨 Interactive Features

1. **Drag-and-Drop Palette**: Drag any block from the left sidebar palette directly onto the React Flow canvas.
2. **Visual Workflow Canvas**: Pan, zoom, select nodes, and draw animated connection lines between handles.
3. **Preloaded Workflow**: Automatically displays the classic NexusFlow pipeline:  
   `Turbine Sensor` &rarr; `Moving Average (5)` &rarr; `Condition (>80°C)` &rarr; `SMS Alert`.
4. **Node Inspector**: Click any node on the canvas to open a configuration panel to edit device ID, metric, window size, threshold, or destination.
5. **JSON Graph Serialization**: Click **"Export JSON"** to view and copy the serialized graph payload (ready for Week 2 stream compilation).
6. **Telemetry Storage Explorer**: Switch to the **"Telemetry Storage & Data"** tab to test single/batch ingestion and inspect stored readings in MongoDB Time-Series.

---

## 🧪 Steps Needed to Test the Week 1 Implementation

Follow these steps to test the Week 1 frontend and its integration with the backend:

### Step 1: Install Dependencies
Open a terminal in the `frontend/` directory:
```powershell
cd frontend
npm install
```

### Step 2: Build the Frontend
Verify that the project compiles cleanly:
```powershell
npm run build
```
**Expected Output**: `built in ...s` with zero errors.

### Step 3: Start the Vite Development Server
Run the dev server:
```powershell
npm run dev
```
Open `http://localhost:3000` in your browser.

### Step 4: Test Visual Workflow Builder (Canvas & Drag-and-Drop)
1. **View Default Workflow**: Verify that the preloaded 4-node pipeline is displayed (`Turbine Sensor` &rarr; `Moving Average` &rarr; `Condition` &rarr; `SMS Alert`).
2. **Drag and Drop**: From the left sidebar palette under "1. Data Sources", drag a `Boiler Sensor` block onto an empty spot on the canvas.
3. **Connect Nodes**: Click and drag from the blue handle on the right of the `Boiler Sensor` to the purple handle on the left of a filter node.
4. **Inspect & Edit Node**: Click on the `Condition` node. In the inspector drawer on the right, change the threshold from `80` to `90`. Notice the node update in real time.
5. **Export Graph JSON**: Click the **"Export JSON"** button in the header. Verify that the modal opens with the valid JSON representation of nodes, positions, and edges. Click **"Copy to Clipboard"**.

### Step 5: Test Telemetry Storage & Ingestion Explorer
1. Ensure the backend server is running on `http://localhost:5000` (check the navbar status badge: `MongoDB Time-Series OK`).
2. Click the **"Telemetry Storage & Data"** tab in the navbar.
3. Under **Telemetry Ingestion Tester**, click **"Ingest Single Reading"**. Verify that a green success message appears with the new reading ID.
4. Click **"Batch Ingest (10 Readings)"**. Verify that 10 readings are saved and immediately appear in the **Time-Series Telemetry Stream** table.
5. In the backend terminal, start the mock sensor:
   ```powershell
   npm run simulate
   ```
   Click **"Refresh"** on the frontend table to see continuous sensor readings populating the MongoDB Time-Series collection!
