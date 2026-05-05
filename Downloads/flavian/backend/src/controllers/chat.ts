import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user!.userId;

    // Support channel policy: customer and admin can access this chat.
    const request = await prisma.laundryRequest.findUnique({
      where: { id: requestId },
      include: {
        customer: true,
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.customerId !== userId && req.user!.role !== 'ADMIN') {
      return res
        .status(403)
        .json({ error: 'Not authorized to view this chat' });
    }

    const messages = await prisma.message.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
