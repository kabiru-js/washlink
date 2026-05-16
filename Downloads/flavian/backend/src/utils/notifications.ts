import { Server } from 'socket.io';

interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  requestId?: string;
  data?: unknown;
}

export const createAndEmitNotification = async (
  io: Server,
  input: NotificationInput,
) => {
  const notification = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    requestId: input.requestId ?? null,
    data: input.data ?? null,
    readAt: null,
    createdAt: new Date().toISOString(),
  };

  io.to(`user_${input.userId}`).emit('notification', notification);
  return notification;
};
