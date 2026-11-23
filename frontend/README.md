# NexusFlow - Frontend (Week 1 & Week 2: Visual Rule Builder & Logic Engine)

NexusFlow's frontend provides an intuitive drag-and-drop workflow canvas for configuring IoT stream processing rules without writing code.
- **Week 1**: Visual React Flow canvas, node palette, draggable blocks, and telemetry storage explorer.
- **Week 2**: Custom **Data Source**, **Math Operation**, and **Action Trigger** nodes, graph JSON serialization, live backend DAG validation, interactive simulation runner, and cloud workflow saving/loading.

---

## 🛠️ Tech Stack

- **Framework**: React 18+
- **Build Tool**: Vite 6+
- **Visual Graph Builder**: React Flow (`reactflow` 11.11+)
- **Icons**: Lucide React
- **HTTP Client**: Axios (configured with Vite `/api` proxy to backend)
- **Styling**: Industrial Dark Theme CSS with reactive SVG handles

---

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx               # Navigation bar, week badge, health status
│   │   ├── Sidebar.jsx              # Draggable node palette with 5 node categories
│   │   └── CustomNodes/
│   │       ├── SensorNode.jsx       # Data Source node (Turbine, Boiler, Motor)
│   │       ├── FilterNode.jsx       # Stream filter node (Moving Average sliding window)
│   │       ├── MathNode.jsx         # Week 2: Math operation node (Multiply, Add, Offset, Divide)
│   │       ├── ConditionNode.jsx    # Logical condition node (>, >=, <, <=, ==)
│   │       └── ActionNode.jsx       # Action trigger node (SMS Alert, Webhook, Incident Log)
│   ├── pages/
│   │   ├── WorkflowBuilder.jsx      # Interactive canvas, DAG validator, simulator & inspector
│   │   ├── Telemetry.jsx            # Live telemetry storage & ingestion explorer
│   │   ├── Dashboard.jsx            # Week 3 placeholder
│   │   ├── Devices.jsx              # Device management placeholder
│   │   └── Alerts.jsx               # Alert log placeholder
│   ├── services/
│   │   ├── api.js                   # API client for telemetry & workflow endpoints
│   │   └── socket.js                # WebSocket service stub (Week 3)
│   ├── App.jsx                      # Main app shell & view switcher
│   ├── index.css                    # Design system & dark theme overrides
│   └── main.jsx                     # Vite React entrypoint
├── index.html                       # HTML template
├── package.json                     # Frontend dependencies
└── vite.config.js                   # Vite config with backend API proxy
```

---

## 🧩 Supported Visual Node Types (Week 2)

| Node Category | Canonical Type | Handles | Configurable Parameters |
|---------------|----------------|---------|-------------------------|
| **1. Data Sources** | `sensor` | Source (Right) | `deviceId` (e.g. `TURBINE_001`), `metric` (`temperature`, `pressure`, `vibration`, `humidity`), `location` |
| **2. Stream Filters** | `filter` | Target (Left), Source (Right) | `filterType` (`Moving Average`), `windowSize` (e.g. 3 or 5 readings) |
| **3. Math Operations** | `math` | Target (Left), Source (Right) | `operation` (`multiply`, `add`, `subtract`, `divide`), `operand` (number, e.g. `1.5` or `2`) |
| **4. Conditions** | `condition` | Target (Left), Source (Right) | `operator` (`>`, `>=`, `<`, `<=`, `==`, `!=`), `threshold` (number), `unit` |
| **5. Action Triggers** | `action` | Target (Left) | `actionType` (`SMS Alert`, `Webhook Alert`, `Incident Log`), `target` (phone/URL/destination) |

---

## 🎨 Interactive Features (Week 2)

1. **Draggable Node Palette**: Drag and drop any node from the 5 categories on the sidebar palette directly onto the canvas.
2. **DAG Validation (Backend-Verified)**: Click **"Validate Graph"** on the canvas toolbar to verify that the graph forms a valid Directed Acyclic Graph (DAG) with 0 circular loops, and view the computed topological execution order (Kahn's Algorithm).
3. **Interactive RxJS Simulation**: Click **"Run Simulation"** to compile the visual graph in the backend and run a stream of sample sensor readings through it. View node-by-node value transformations and dispatched alerts in the browser!
4. **Cloud Persistence (MongoDB)**: Click **"Save to Cloud"** to validate and persist the workflow into MongoDB. Click **"Load"** to browse and open previously saved workflows.
5. **Accurate JSON Graph Serialization**: Click the code icon (`< >`) to view the serialized React Flow JSON. Includes **"Copy to Clipboard"** and **"Download .json"**.
6. **JSON Workflow Import**: Click the upload icon (`↑`) to load any exported `.json` file back onto the canvas.
7. **Node Inspector Drawer**: Click any node on the canvas to inspect and edit its device ID, window size, math operation, threshold, or target recipient.

---

## 🧪 Steps Needed to Test the Week 1 Implementation

1. **Install and build**:
   ```powershell
   cd frontend
   npm install
   npm run build
   ```
2. **Start the frontend**:
   ```powershell
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
3. **Test canvas drag-and-drop**: Drag blocks from the left sidebar onto the canvas and connect them with edges.
4. **Test telemetry explorer**: Click the **"Telemetry Storage & Data"** tab to test single/batch ingestion into MongoDB Time-Series.

---

## 🧪 Steps Needed to Test the Week 2 Implementation

Follow these steps in your browser (`http://localhost:3000`) with both frontend and backend running:

### Step 1: Test Custom Math Operation Node
1. In the left sidebar palette under **"3. Math Operations"**, drag a **"Multiply (× 1.5)"** block onto the canvas.
2. Click on the node to open the **Node Inspector** drawer on the right.
3. Change the operation to `multiply` and operand to `2` (or choose `Add / Offset`).
4. Connect the output of a **Turbine Sensor** into the left handle of the Math node, and the output of the Math node into a **Condition** node.

### Step 2: Test Graph Validation (DAG Verification & Cycle Detection)
1. On the top canvas toolbar, click **"Validate Graph"**.
2. **Valid Graph Test**:
   - For a standard pipeline (`Sensor` &rarr; `Filter / Math` &rarr; `Condition` &rarr; `Action`), verify that a green modal appears showing:
     - `Graph Structure Valid (DAG)`
     - Topological Execution Order (e.g., `node-1 ➔ node-2 ➔ node-3 ➔ node-4`).
3. **Cycle Detection Test**:
   - Draw an edge from the output of the `Condition` node backward into the input of the `Sensor` or `Filter` node (creating a circular loop).
   - Click **"Validate Graph"**.
   - Verify that the modal flags the error: `Cycle detected in workflow graph! Workflows must be a Directed Acyclic Graph (DAG) without circular loops.`
   - Delete the loop edge to restore validity.

### Step 3: Test Interactive RxJS Simulation Runner
1. With a valid workflow on the canvas (e.g. `Turbine Sensor (temperature)` &rarr; `Moving Average (3)` &rarr; `Condition (>80°C)` &rarr; `SMS Alert`), click **"Run Simulation"**.
2. Verify that the simulation runs against mock readings (72°C, 76.5°C, 84°C, 92.5°C):
   - Check the **Readings Evaluated** count (`4`).
   - Check the **Dispatched Alerts** count (`1`).
   - Inspect the **Node Step Traces** showing each transformation step (Sensor &rarr; MovingAvg &rarr; Condition &rarr; Dispatched Alert).

### Step 4: Test Cloud Saving and Loading to MongoDB
1. Enter a custom workflow name in the header input (e.g., `"Assembly Line Turbine Alert"`).
2. Click **"Save to Cloud"**.
3. Verify that a green toast notification confirms: `Saved & Deployed 'Assembly Line Turbine Alert' to MongoDB!`.
4. Clear the canvas by selecting and deleting nodes, or refresh the page.
5. Click **"Load"** on the toolbar. Click on your saved workflow in the list to reload all nodes and connections back onto the canvas.

### Step 5: Test JSON Serialization, Download & Import
1. Click the code icon (`< >`) in the toolbar to open the **Serialized Graph JSON** viewer.
2. Verify that all nodes, handles, positions, and edges are accurately serialized.
3. Click **"Download .json"** to save the workflow file to your computer.
4. Click the upload icon (`↑`) on the toolbar and select the downloaded file to verify that the workflow imports accurately.
