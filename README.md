# 1. NexusFlow - Project Overview (Simple Explanation)

**NexusFlow** is a visual, no-code rule engine designed for Internet of Things (IoT) telemetry data. It allows non-technical users, such as factory managers, to create and manage automation rules using a drag-and-drop interface instead of writing code.

In a factory environment, machines such as turbines, motors, boilers, and cooling systems continuously generate sensor data. These sensors monitor values like:

- Temperature
- Pressure
- Speed
- Vibration
- Humidity

NexusFlow receives this telemetry data, stores it, processes it, and evaluates it against user-defined workflows.

For example, a factory manager may want to receive an alert whenever a turbine's average temperature exceeds **80°C**. Instead of asking a developer to implement the logic, the manager can visually create the following workflow:

**Sensor → Moving Average Filter → Condition → SMS Alert**

The backend interprets this workflow and automatically executes it whenever new sensor readings arrive.

## Core Idea

Rather than modifying application code every time a business rule changes, users can create, update, and manage rules visually by connecting workflow nodes.

## Example Workflow

| Step | Node | Purpose |
|--------|--------|---------|
| 1 | Turbine Sensor | Continuously generates temperature readings. |
| 2 | Moving Average Filter | Calculates the average of recent readings. |
| 3 | Condition | Checks whether the average exceeds a specified threshold. |
| 4 | SMS Alert | Sends a notification when the condition evaluates to true. |

---

# 2. Problems NexusFlow Solves

## Problem 1: Hardcoded Business Logic

Traditional applications often contain business rules directly in the source code.

Example:

```java
if (temperature > 80) {
    sendAlert();
}
```

If a manager later decides that the threshold should be **90°C** instead of **80°C**, a developer must typically:

1. Modify the code.
2. Rebuild the application.
3. Redeploy the application.

This process is slow and creates dependency on developers for simple business-rule changes.

### NexusFlow Solution

NexusFlow provides a visual rule editor where users can modify thresholds, conditions, and workflows without changing application code or performing redeployments.

---

## Problem 2: High-Volume Sensor Data

IoT systems generate large amounts of telemetry data continuously.

For example:

- 100 machines
- 10 readings per second from each machine

Result:

```text
100 × 10 = 1,000 readings per second
```

The system must be capable of:

- Receiving incoming sensor data efficiently
- Storing telemetry data reliably
- Processing data in real time
- Evaluating rules continuously
- Presenting meaningful insights to users

### Important Architectural Distinction

Telemetry storage and rule processing are separate responsibilities:

- **MongoDB** stores sensor readings and historical telemetry data.
- **RxJS Rule Engine** processes incoming data streams and evaluates user-defined workflows and conditions.

This separation allows NexusFlow to handle large-scale telemetry storage while simultaneously performing real-time rule execution.