import { Server } from 'socket.io';
import { AuthenticatedSocket } from './index';
import { prisma } from '../utils/db';
import { createAndEmitNotification } from '../utils/notifications';
type RequestStatus = string;

const vendorAllowedStatuses = new Set(['RECEIVED', 'PROCESSING', 'READY']);
const deliveryAllowedStatuses = new Set(['IN_TRANSIT', 'DELIVERING', 'DELIVERED', 'COMPLETED']);

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

            if (request.paymentStatus !== 'CONFIRMED') {
                return socket.emit('error', { message: 'Payment must be confirmed before status updates' });
            }

            // Allow vendors who are matched or admins, etc.
            // Basic check: Ensure it's the matched vendor
            if (socket.user?.role === 'VENDOR' && request.selectedVendorId !== userId) {
                return socket.emit('error', { message: 'Unauthorized. You are not the assigned vendor.' });
            }

            if (socket.user?.role === 'VENDOR' && !vendorAllowedStatuses.has(status)) {
                return socket.emit('error', { message: 'Vendors can only update status to RECEIVED, PROCESSING or READY' });
            }

            if (socket.user?.role === 'RIDER') {
                if (request.riderAssignmentStage === 'PICKUP' && status !== 'PICKED_UP') {
                    return socket.emit('error', { message: 'Pickup rider can only set PICKED_UP' });
                }
                if (request.riderAssignmentStage === 'DELIVERY' && !deliveryAllowedStatuses.has(status)) {
                    return socket.emit('error', { message: 'Delivery rider can only set IN_TRANSIT, DELIVERING, DELIVERED or COMPLETED' });
                }
            }

            // Update in DB
            const updatedRequest = await prisma.laundryRequest.update({
                where: { id: requestId },
                data: { status },
            });

            // Broadcast order update to the chat room
            io.to(`request_${requestId}`).emit('order_status_updated', updatedRequest);

            await createAndEmitNotification(io, {
                userId: updatedRequest.customerId,
                type: 'ORDER_STATUS_UPDATE',
                title: 'Order Status Updated',
                message: `Your order status was updated to ${status}`,
                requestId,
                data: { status },
            });

        } catch (error) {
            console.error('Error updating order status:', error);
            socket.emit('error', { message: 'Failed to update order status' });
        }
    });
};
