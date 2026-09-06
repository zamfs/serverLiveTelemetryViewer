# Server Live Telemetry v0.3

## Online Intermediary Server

Welcome to the **Transmissor Live Telemetry** repository. This project acts as the **online intermediary server** responsible for receiving, processing, and distributing real-time telemetry data from **Assetto Corsa**.

The local data capture is handled by a separate client code. This repository focuses on managing WebSocket connections, maintaining live session state, and routing telemetry data between the bridge and visualization dashboard.

### Key Features

* **Real-Time Communication:** Uses Node.js and Socket.io for low-latency bidirectional communication between the data source and visualization dashboard.

* **Live Grid Management:** Maintains the state of active cars in memory, including track, car model, driver, and connection status.

* **Stint and Lap Management:** Automatically detects pit exits and organizes laps into separate stints. Completed laps are stored with lap time, fuel consumption, and tyre compound.

* **Activity Detection:** Cars are marked as offline after 5 seconds without telemetry updates and automatically marked as active when data resumes.

* **Automatic Session Cleanup:** Inactive sessions are removed from memory after 1 hour without telemetry updates.

* **In-Memory Storage:** Live session data is temporarily stored in RAM for fast access without requiring a database.

* **AC1 Protocols:** Packet structure and telemetry processing are designed specifically for Assetto Corsa 1.

### Technologies Used

* **Node.js**: Server engine and runtime environment.

* **Express.js**: HTTP server and API route handling.

* **Socket.io**: Primary library for managing WebSocket connections and real-time data transmission.

* **JavaScript**: Session state management, grid management, stint and lap processing, and activity monitoring.
