import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';

export const getAssignedRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const riderProfile = await prisma.riderProfile.findUnique({ where: { userId } });
        if (!riderProfile) return res.status(404).json({ error: 'Rider profile not found' });

        const requests = await prisma.laundryRequest.findMany({
            where: { assignedRiderId: riderProfile.id },
            include: {
                customer: { select: { name: true, phone: true } },
                selectedVendor: { select: { name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { requestId } = req.params;
        const { status } = req.body; 

        const riderProfile = await prisma.riderProfile.findUnique({ where: { userId } });
        if (!riderProfile) return res.status(404).json({ error: 'Rider profile not found' });

        const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
        if (!request || request.assignedRiderId !== riderProfile.id) {
            return res.status(403).json({ error: 'Unauthorized to update this request' });
        }

        if (request.paymentStatus !== 'CONFIRMED') {
            return res.status(400).json({ error: 'Payment must be confirmed before rider status updates' });
        }

        if (request.riderAssignmentStage === 'PICKUP') {
            if (status !== 'PICKED_UP') {
                return res.status(400).json({ error: 'Pickup rider can only set status to PICKED_UP' });
            }
        }

        if (request.riderAssignmentStage === 'DELIVERY') {
            const allowedDelivery = new Set(['IN_TRANSIT', 'DELIVERING', 'COMPLETED']);
            if (!allowedDelivery.has(status)) {
                return res.status(400).json({ error: 'Delivery rider can only set IN_TRANSIT, DELIVERING or COMPLETED' });
            }
        }

        const updatedRequest = await prisma.laundryRequest.update({
            where: { id: requestId },
            data: { status },
        });

        res.json(updatedRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { phone, vehicleType, lat, lng, radius, isActive } = req.body;

        const profile = await prisma.riderProfile.update({
            where: { userId },
            data: {
                ...(phone && { phone }),
                ...(vehicleType && { vehicleType }),
                ...(lat !== undefined && { locationLat: lat }),
                ...(lng !== undefined && { locationLng: lng }),
                ...(radius !== undefined && { radiusKm: radius }),
                ...(isActive !== undefined && { isActive }),
            }
        });

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
