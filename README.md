# Server Live Telemetry v0.2
## Online Intermediary Server

Welcome to the **Transmissor Live Telemetry** repository. This project now acts as the **online intermediary server** responsible for receiving, processing, and distributing real-time telemetry data from **Assetto Corsa**.

As the project's architecture has evolved, the local data capture is now handled by a separate client code. This repository focuses exclusively on managing WebSocket connections and routing data packets in the cloud or local network.

### 🚀 Key Features

*   **Real-Time Communication:** Uses Node.js and Socket.io for ultra-low latency bidirectional communication between the data source and the visualization dashboard.
*   **Stint and Driver Management:** Advanced data segregation. If multiple drivers are sharing the same car, the system isolates lap times and statistics for each one. *Stints* are not mixed, ensuring an accurate visualization of individual performance (currently in process).
*   **Ephemeral Storage (24h Retention):** For optimization and cleanliness, the system does not save data permanently. All session times and histories are automatically deleted after 24 hours (currently in process).
*   **AC1 Protocols:** Packet structure designed and mapped specifically for Assetto Corsa 1.

### ⚙️ Technologies Used

*   **Node.js**: Server engine and runtime environment.
*   **Socket.io**: Primary library for managing WebSocket rooms and connections.
*   **JavaScript**: Routing logic, 24h retention control, and session state management.