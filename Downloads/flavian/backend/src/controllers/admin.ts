import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';

export const getDashboardSummary = async (_req: AuthRequest, res: Response) => {
  try {
    const [users, pending, active, completed, cancelled] = await Promise.all([
      prisma.user.count(),
      prisma.laundryRequest.count({ where: { status: 'PENDING' } }),
      prisma.laundryRequest.count({
        where: {
          status: {
            in: [
              'ACCEPTED',
              'PICKED_UP',
              'WASHING',
              'DELIVERING',
              'IN_TRANSIT',
            ],
          },
        },
      }),
      prisma.laundryRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.laundryRequest.count({ where: { status: 'CANCELLED' } }),
    ]);

    const recentRequests = await prisma.laundryRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        selectedVendor: { select: { id: true, name: true, phone: true } },
        offers: { select: { id: true } },
      },
    });

    res.json({
      metrics: {
        users,
        pending,
        active,
        completed,
        cancelled,
      },
      recentRequests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRequestStatusByAdmin = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const requestId = (req as any).params.requestId as string;
    const { status } = (req as any).body as { status?: string };

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const request = await prisma.laundryRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRequestDetails = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = (req as any).params.requestId as string;

    const request = await prisma.laundryRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        selectedVendor: {
          select: { id: true, name: true, email: true, phone: true },
        },
        offers: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
                vendorProfileVendor: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        messages: {
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
