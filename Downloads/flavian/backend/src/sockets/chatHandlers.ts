import { Server } from 'socket.io';
import { AuthenticatedSocket } from './index';
import { prisma } from '../utils/db';

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
    // Join a specific chat room for an order
    socket.on('join_chat', async ({ requestId }: { requestId: string }) => {
        // Basic authorization check could be added here
        socket.join(`request_${requestId}`);
        console.log(`User ${socket.user?.userId} joined chat for request ${requestId}`);
    });

    socket.on('send_message', async (data: { requestId: string; receiverId: string; content: string }) => {
        try {
            const { requestId, receiverId, content } = data;
            const senderId = socket.user!.userId;

            // Ensure request exists
            const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
            if (!request) {
                socket.emit('error', { message: 'Invalid request ID for chat' });
                return;
            }

            // Save message to DB
            const message = await prisma.message.create({
                data: {
                    requestId,
                    senderId,
                    content,
                },
            });

            // Broadcast to the specific request chat room
            io.to(`request_${requestId}`).emit('new_message', message);

            // Also send a notification to the receiver's personal room
            io.to(`user_${receiverId}`).emit('notification', {
                type: 'NEW_MESSAGE',
                message: 'You received a new message',
                requestId,
                data: message,
            });

        } catch (error) {
            console.error('Error handling send_message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
};
