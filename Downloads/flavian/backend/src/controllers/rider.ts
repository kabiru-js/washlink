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
        const { phone, vehicleType } = req.body;

        const profile = await prisma.riderProfile.update({
            where: { userId },
            data: {
                ...(phone && { phone }),
                ...(vehicleType && { vehicleType })
            }
        });

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
