import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { businessName, services, basePrice, lat, lng, radius, isActive } = req.body;

        const profile = await prisma.vendorProfile.update({
            where: { userId },
            data: {
                ...(businessName && { businessName }),
                ...(services && { services: JSON.stringify(services) }),
                ...(basePrice !== undefined && { basePrice }),
                ...(lat !== undefined && { locationLat: lat }),
                ...(lng !== undefined && { locationLng: lng }),
                ...(radius !== undefined && { radiusKm: radius }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getNearbyRequests = async (req: AuthRequest, res: Response) => {
    try {
        // For MVP, we will just return all PENDING requests.
        // A proper implementation would filter by vendor location and radius using Haversine formula or PostGIS.
        const requests = await prisma.laundryRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                customer: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const submitOffer = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { requestId, proposedPrice, etaHours } = req.body;

        const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
        if (!request || request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request not available for offers' });
        }

        const offer = await prisma.vendorOffer.create({
            data: {
                requestId,
                vendorId: userId,
                proposedPrice,
                etaHours,
            },
        });

        res.status(201).json(offer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyOffers = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const offers = await prisma.vendorOffer.findMany({
            where: { vendorId: userId },
            include: {
                request: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(offers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const autoAssignRider = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { requestId } = req.params;

        const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
        if (!request || request.selectedVendorId !== userId) {
            return res.status(403).json({ error: 'Unauthorized.' });
        }

        const riders = await prisma.riderProfile.findMany({ where: { isActive: true }, take: 1 });
        if (riders.length === 0) {
            return res.status(404).json({ error: 'No riders available on the platform yet' });
        }

        const updated = await prisma.laundryRequest.update({
            where: { id: requestId },
            data: { assignedRiderId: riders[0].id }
        });

        res.json({ message: 'Rider auto-assigned successfully', request: updated, rider: riders[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
