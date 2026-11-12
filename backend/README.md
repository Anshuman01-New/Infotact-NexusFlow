# NexusFlow Backend

Backend service for the NexusFlow Visual IoT Telemetry & Rule Engine.

The backend receives telemetry, stores time-series data, compiles visual workflows into executable RxJS streams, evaluates rules, and generates alerts.

---

## Features

### Telemetry Ingestion
- REST APIs
- High-frequency data ingestion
- Device telemetry collection

### Time-Series Storage
- MongoDB Time-Series collections
- Historical telemetry retrieval
- Optimized storage

### Workflow Execution
- Graph validation
- Workflow compilation
- Dynamic RxJS pipeline generation

### Real-Time Communication
- WebSocket support
- Live telemetry updates
- Alert broadcasting

### Notification Engine
- Webhook notifications
- Mock SMS alerts
- Event generation

---

## Tech Stack

- Node.js
- Express.js
- MongoDB
- RxJS
- Socket.IO