import { Server } from 'socket.io';
import { AuthenticatedSocket } from './index';
import { prisma } from '../utils/db';
type RequestStatus = string;

export const registerOrderHandlers = (io: Server, socket: AuthenticatedSocket) => {
    // Only vendors (or maybe customers cancelling) should update order status
    socket.on('update_order_status', async (data: { requestId: string; status: RequestStatus }) => {
        try {
            const { requestId, status } = data;
            const userId = socket.user!.userId;

            const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
            if (!request) {
                return socket.emit('error', { message: 'Request not found' });
            }

            // Allow vendors who are matched or admins, etc.
            // Basic check: Ensure it's the matched vendor
            if (socket.user?.role === 'VENDOR' && request.selectedVendorId !== userId) {
                return socket.emit('error', { message: 'Unauthorized. You are not the assigned vendor.' });
            }

            // Update in DB
            const updatedRequest = await prisma.laundryRequest.update({
                where: { id: requestId },
                data: { status },
            });

            // Broadcast order update to the chat room
            io.to(`request_${requestId}`).emit('order_status_updated', updatedRequest);

            // Notify the customer directly
            io.to(`user_${updatedRequest.customerId}`).emit('notification', {
                type: 'ORDER_STATUS_UPDATE',
                message: `Your order status was updated to ${status}`,
                requestId,
                data: updatedRequest,
            });

        } catch (error) {
            console.error('Error updating order status:', error);
            socket.emit('error', { message: 'Failed to update order status' });
        }
    });
};
