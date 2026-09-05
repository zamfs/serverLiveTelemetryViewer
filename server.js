const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require("socket.io");

const io = new Server(http, {
    cors: { 
            origin: [
                "http://127.0.0.1:5500", // local tests
                "http://localhost:5500",
                "https://livetelemetryviewer.onrender.com"
            ], 
            methods: ["GET", "POST"] 
        }
});

app.use(express.json());

//Uses RAM to keep cars active
const gridState = {};

app.get('/', (req, res) => {
    res.send('Server ONLINE');
})

// route to send data (POST)
app.post('/telemetry', (req, res) => {
    console.log("🔴 Data received from Python:", req.body ? "Sim (Pacote OK)" : "Vazio");

    io.emit('telemetry_update', req.body);
    res.sendStatus(200);
});

// Log de conexão para sabermos que funcionou
io.on('connection', (socket) => {
    console.log(`🟢 New client connection to Socket! ID: ${socket.id}`);

    //sends the list of active cars to browser(lobby)
    socket.emit('grid_atual', Object.values(gridState));

    socket.on('telemetry_from_bridge', (data) => {
        

        if (data && data.car) {
            const track = data.track?.name || 'unknown_track';
            const carModel = data.car?.model || 'unknown_car';
            const driverName = data.car?.driverName || 'Driver';

            //new id
            const sessionKey = `${socket.id}_${track}_${carModel}`;

            gridState[sessionKey] = {
                sessionKey: sessionKey,
                socketId: socket.id,
                trackName: track,
                carModel: carModel,
                driverName: driverName,
                carId: data.car?.id ?? 0, 
                ...data,
                lastUpdate: Date.now()
            };

                //Refresh the cars list
                io.emit('grid_atual', Object.values(gridState));

                io.emit('telemetry_update', {
                    sessionKey: sessionKey,
                    ...data
                });
                
            }
        });

        socket.on('disconnect', () => {
            Object.keys(gridState).forEach(key => {
                if (gridState[key].socketId === socket.id) {
                    delete gridState[key];
                }
            });
            io.emit('grid_atual', Object.values(gridState));
            console.log(`🔴 Client disconnected: ${socket.id}`);
        });
        console.log(`💻 Browser connected! ID: ${socket.id}`);
    });


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Server running in port: ${PORT}`);
});