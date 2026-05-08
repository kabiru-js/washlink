import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';

export const createRequest = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { description, bagCount, notes, images, pickupLat, pickupLng, pickupAddress, initialPriceOffer } = req.body;

        const request = await prisma.laundryRequest.create({
            data: {
                customerId: userId,
                description,
                bagCount,
                notes,
                images: JSON.stringify(images || []),
                pickupLat,
                pickupLng,
                pickupAddress,
                initialPriceOffer,
            },
        });

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const cancelRequest = async (req: AuthRequest, res: Response) => {
    try {
        const requestId = req.params.id;
        const userId = req.user!.userId;

        const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.customerId !== userId) return res.status(403).json({ error: 'Unauthorized' });

        // Only allow cancel if not yet picked up
        const nonCancellable = ['PICKED_UP', 'WASHING', 'DELIVERING', 'COMPLETED'];
        if (nonCancellable.includes(request.status)) {
            return res.status(400).json({ error: 'Cannot cancel request after pickup' });
        }

        const updated = await prisma.laundryRequest.update({
            where: { id: requestId },
            data: { status: 'CANCELLED' }
        });

        // Broadcast cancellation
        const io = (req.app as any).get('io');
        io.emit('order_status_updated', { requestId, status: 'CANCELLED' });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getMyRequests = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const requests = await prisma.laundryRequest.findMany({
            where: { customerId: userId },
            include: {
                offers: {
                    include: { vendor: { select: { id: true, name: true, vendorProfileVendor: true } } }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const acceptOffer = async (req: AuthRequest, res: Response) => {
    return res.status(400).json({
        error: 'Vendor selection is handled by admin dispatch',
    });
};

export const rejectOffer = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { offerId } = req.params;

        const offer = await prisma.vendorOffer.findUnique({
            where: { id: offerId },
            include: { request: true },
        });

        if (!offer || offer.request.customerId !== userId) {
            return res.status(404).json({ error: 'Offer not found or unauthorized' });
        }

        await prisma.vendorOffer.update({
            where: { id: offerId },
            data: { status: 'REJECTED' },
        });

        res.json({ message: 'Offer rejected successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const submitPayment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const requestId = req.params.id;
        const { paymentMethod, paymentReference, paymentProofUrl } = req.body;

        const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.customerId !== userId) return res.status(403).json({ error: 'Unauthorized' });

        if (!paymentMethod) {
            return res.status(400).json({ error: 'paymentMethod is required' });
        }

        const updated = await prisma.laundryRequest.update({
            where: { id: requestId },
            data: {
                paymentMethod,
                paymentReference: paymentReference || null,
                paymentProofUrl: paymentProofUrl || null,
                paymentStatus: 'SUBMITTED',
                paymentSubmittedAt: new Date(),
            },
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
