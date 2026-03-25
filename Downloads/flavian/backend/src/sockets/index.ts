import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';
import { registerChatHandlers } from './chatHandlers';
import { registerOrderHandlers } from './orderHandlers';

export interface AuthenticatedSocket extends Socket {
    user?: {
        userId: string;
        role: string;
    };
}

export const setupSockets = (io: Server) => {
    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string; role: string };
            socket.user = decoded;

            // Join a personal room for direct notifications
            socket.join(`user_${decoded.userId}`);

            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.user?.userId} (Socket: ${socket.id})`);

        registerChatHandlers(io, socket);
        registerOrderHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user?.userId}`);
        });
    });
};
