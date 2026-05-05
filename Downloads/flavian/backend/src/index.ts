import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customer';
import vendorRoutes from './routes/vendor';
import chatRoutes from './routes/chat';
import riderRoutes from './routes/rider';
import adminRoutes from './routes/admin';
import { setupSockets } from './sockets/index';
import { ensureAdminAccount } from './utils/adminBootstrap';
import { ensureDemoData } from './utils/demoBootstrap';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/admin', adminRoutes);
// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Setup Socket.IO Event Handlers
setupSockets(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await ensureAdminAccount();
    await ensureDemoData();
  } catch (error) {
    console.error('Failed to ensure admin account:', error);
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

void startServer();
