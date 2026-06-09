require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const setupSocket = require('./socket/socketHandler');
const startEmailMonitorJob = require('./jobs/emailMonitor');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || origin.startsWith('http://localhost:') || origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

const io = new Server(server, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api', apiRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.set('io', io);

connectDB();
setupSocket(io);
startEmailMonitorJob();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Run: netstat -ano | findstr :${PORT} then taskkill /PID <pid> /F`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(() => {
    io.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.once('SIGUSR2', () => {
  server.close(() => {
    io.close();
    process.kill(process.pid, 'SIGUSR2');
  });
});
