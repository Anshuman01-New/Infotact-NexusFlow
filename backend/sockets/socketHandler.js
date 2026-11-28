const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', //All origins are allowed to connect to the socket server
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] 🔌 Client connected: ${socket.id}`);

    // Allow client to subscribe to specific device telemetry if desired
    socket.on('subscribe:device', (deviceId) => {
      socket.join(`device:${deviceId}`);
      console.log(`[Socket.IO] Client ${socket.id} subscribed to device:${deviceId}`);
    });

    socket.on('unsubscribe:device', (deviceId) => {
      socket.leave(`device:${deviceId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] ❌ Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function broadcastTelemetry(reading) {
  if (!io) return;
  io.emit('telemetry:new', reading);

  const deviceId = reading.deviceId || (reading.metadata && reading.metadata.deviceId);
  if (deviceId) {
    io.to(`device:${deviceId}`).emit('telemetry:device', reading);
  }
}

function broadcastAlert(alert) {
  if (!io) return;
  io.emit('alert:new', alert);
}

function broadcastPipelineStep(stepData) {
  if (!io) return;
  io.emit('pipeline:step', stepData);
}

function broadcastEngineStatus(status) {
  if (!io) return;
  io.emit('engine:status', status);
}

module.exports = {
  initSocket,
  getIO,
  broadcastTelemetry,
  broadcastAlert,
  broadcastPipelineStep,
  broadcastEngineStatus
};
