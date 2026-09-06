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

const ONE_HOUR_MS = 3600000;
const FIVE_SECONDS_MS = 5000;

//cleaning loop (each 5 seconds)
setInterval(() => {
    const now = Date.now();
    let gridChanged = false;

    Object.keys(gridState).forEach(key => {
        const idleTime = now - gridState[key].lastUpdate;

        if (idleTime > ONE_HOUR_MS) {
            delete gridState[key];
            gridChanged = true;
        } else if (idleTime > FIVE_SECONDS_MS && gridState[key].isActive) {
            gridState[key].isActive = false;
            gridChanged = true;
        }
    });

    if (gridChanged) {
        io.emit('grid_atual', Object.values(gridState));
    }
}, 5000);

app.get('/', (req, res) => {
    res.send('Server ONLINE');
})

// route to send data (POST)
app.post('/telemetry', (req, res) => {
    console.log("🔴 Data received from Python:", req.body ? "Yes (OK)" : "Empty");

    io.emit('telemetry_update', req.body);
    res.sendStatus(200);
});


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

            let needsRefresh = false;

            if (!gridState[sessionKey]) {
                gridState[sessionKey] = {
                    sessionKey: sessionKey,
                    socketId: socket.id,
                    trackName: track,
                    carModel: carModel,
                    driverName: driverName,
                    isActive: true,
                    stints: [{
                        stintId: 1,
                        laps: []
                    }],
                    activeStintIndex: 0,
                    lastUpdate: Date.now(),
                    lastPitStatus: data.car.isInPit,
                    lastLapCount: data.lap.current_lap
                };
                needsRefresh = true;
            } else {
                //if the car was offilne, but came back.
                if (!gridState[sessionKey].isActive) {
                    needsRefresh = true;
                }
                gridState[sessionKey].isActive = true;
                gridState[sessionKey].lastUpdate = Date.now();
            }

            if (needsRefresh) {
                //Refresh the cars list
                io.emit('grid_atual', Object.values(gridState));
            }

            //Stints and laps logic
            const session = gridState[sessionKey];
            const currentPitStatus = data.car.isInPit;
            const currentLapCount = data.lap.current_lap;

            if(session.lastPitStatus === true && currentPitStatus === false) {
                const lastStint = session.stints[session.stints.length - 1];

                if (!lastStint || lastStint.laps.length > 0){
                    const newStintId = session.stints.length + 1;
                    session.stints.push({
                        stintId: newStintId,
                        laps: []
                    });
                    session.activeStintIndex = session.stints.length - 1;
                    console.log(`${driverName} left the pits! Stint ${newStintId} started...`);   
                } else {
                    session.activeStintIndex = session.stints.length - 1;
                    console.log(`${driverName} left the pits again, reusing empty Stint ${lastStint.stintId}...`);
                    
                }

            }

            if (currentLapCount > session.lastLapCount) {
                if(data.lap.i_last_time > 0) {
                    session.stints[session.activeStintIndex].laps.push({
                        lapNumber: session.lastLapCount,
                        lapTime: data.lap.last_time,
                        lapTimeMs: data.lap.i_last_time,
                        fuelConsumed: data.fuel.consumption_per_lap,
                        tyreCompound: data.tyres.tyre_compound
                    });
                    console.log(`${driverName} finished a lap! Time ${data.lap.last_time}`);
                }
            }

            //Update the memory for the next package
            session.lastPitStatus = currentPitStatus;
            session.lastLapCount = currentLapCount;

            //sends the live JSON
            io.emit('telemetry_update', {
                sessionKey: sessionKey,
                stints: session.stints,
                ...data
            });
        }
    });

        socket.on('disconnect', () => {
            let gridChanged = false;

            Object.keys(gridState).forEach(key => {
                if (gridState[key].socketId === socket.id) {
                    gridState[key].isActive = false;
                    gridChanged = true;
                }
            });

            if (gridChanged) {
                io.emit('grid_atual', Object.values(gridState));
            }
            console.log(`🔴 Client disconnected: ${socket.id}`);
        });

        console.log(`💻 Browser connected! ID: ${socket.id}`);
    });


const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Server running in port: ${PORT}`);
});