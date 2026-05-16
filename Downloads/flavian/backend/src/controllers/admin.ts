import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/db';
import { haversineKm } from '../utils/geo';
import { createAndEmitNotification } from '../utils/notifications';

const operationalStatuses = new Set([
  'ACCEPTED',
  'PICKED_UP',
  'RECEIVED',
  'PROCESSING',
  'READY',
  'WASHING',
  'DELIVERING',
  'IN_TRANSIT',
  'COMPLETED',
]);

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
              'RECEIVED',
              'PROCESSING',
              'READY',
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
        assignedRider: { select: { id: true, name: true, phone: true } },
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
    const io = (req.app as any).get('io');
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

    if (operationalStatuses.has(status) && request.paymentStatus !== 'CONFIRMED') {
      return res.status(400).json({
        error: 'Payment must be confirmed before moving request into operational statuses',
      });
    }

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: { status },
    });

    await createAndEmitNotification(io, {
      userId: updated.customerId,
      type: 'ORDER_STATUS_UPDATE',
      title: 'Order Status Updated',
      message: `Admin updated your order status to ${status}`,
      requestId,
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
        assignedRider: {
          select: { id: true, name: true, phone: true, vehicleType: true },
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

export const confirmRequestPayment = async (req: AuthRequest, res: Response) => {
  try {
    const io = (req.app as any).get('io');
    const requestId = (req as any).params.requestId as string;
    const adminId = req.user!.userId;

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.paymentStatus === 'CONFIRMED') {
      return res.status(400).json({ error: 'Payment already confirmed' });
    }

    if (request.paymentStatus !== 'SUBMITTED') {
      return res.status(400).json({ error: 'Customer payment has not been submitted yet' });
    }

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: {
        paymentStatus: 'CONFIRMED',
        paymentConfirmedAt: new Date(),
        paymentConfirmedByAdminId: adminId,
      },
    });

    await createAndEmitNotification(io, {
      userId: updated.customerId,
      type: 'PAYMENT_CONFIRMED',
      title: 'Payment Confirmed',
      message: 'Your payment has been confirmed by admin.',
      requestId,
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignNearestVendor = async (req: AuthRequest, res: Response) => {
  try {
    const io = (req.app as any).get('io');
    const requestId = (req as any).params.requestId as string;

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.paymentStatus !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Payment must be confirmed before assigning a vendor' });
    }

    const vendors = await prisma.vendorProfile.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (vendors.length === 0) {
      return res.status(404).json({ error: 'No active vendors available' });
    }

    const scored = vendors
      .map(v => {
        const distanceKm = haversineKm(
          request.pickupLat,
          request.pickupLng,
          v.locationLat,
          v.locationLng,
        );
        return { vendor: v, distanceKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const inRadius = scored.filter(entry => entry.distanceKm <= entry.vendor.radiusKm);
    const best = (inRadius[0] || scored[0]);
    if (!best) {
      return res.status(404).json({ error: 'No active vendor found within service radius' });
    }

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: {
        selectedVendorId: best.vendor.userId,
        status: 'ACCEPTED',
        vendorAssignedAt: new Date(),
      },
    });

    await Promise.all([
      createAndEmitNotification(io, {
        userId: updated.customerId,
        type: 'VENDOR_ASSIGNED',
        title: 'Vendor Assigned',
        message: `${best.vendor.user.name} has been assigned to your request.`,
        requestId,
      }),
      createAndEmitNotification(io, {
        userId: best.vendor.userId,
        type: 'NEW_ASSIGNMENT',
        title: 'New Laundry Assignment',
        message: 'You have been assigned a new request.',
        requestId,
      }),
    ]);

    res.json({
      request: updated,
      assignedVendor: {
        id: best.vendor.user.id,
        name: best.vendor.user.name,
        email: best.vendor.user.email,
        phone: best.vendor.user.phone,
      },
      distanceKm: best.distanceKm,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignNearestRiderForPickup = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const io = (req.app as any).get('io');
    const requestId = (req as any).params.requestId as string;

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.paymentStatus !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Payment must be confirmed before rider assignment' });
    }

    if (!request.selectedVendorId) {
      return res.status(400).json({ error: 'Assign a vendor before assigning pickup rider' });
    }

    const riders = await prisma.riderProfile.findMany({
      where: { isActive: true },
    });

    if (riders.length === 0) {
      return res.status(404).json({ error: 'No active riders available' });
    }

    const scored = riders
      .map(r => {
        const distanceKm = haversineKm(
          request.pickupLat,
          request.pickupLng,
          r.locationLat,
          r.locationLng,
        );
        return { rider: r, distanceKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const inRadius = scored.filter(entry => entry.distanceKm <= entry.rider.radiusKm);
    const best = (inRadius[0] || scored[0]);
    if (!best) {
      return res.status(404).json({ error: 'No active rider found within pickup radius' });
    }

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: {
        assignedRiderId: best.rider.id,
        riderAssignmentStage: 'PICKUP',
        pickupRiderAssignedAt: new Date(),
      },
    });

    await Promise.all([
      createAndEmitNotification(io, {
        userId: updated.customerId,
        type: 'RIDER_ASSIGNED',
        title: 'Pickup Rider Assigned',
        message: 'A pickup rider has been assigned to your order.',
        requestId,
      }),
      createAndEmitNotification(io, {
        userId: best.rider.userId,
        type: 'NEW_ASSIGNMENT',
        title: 'New Pickup Assignment',
        message: 'You have been assigned a pickup request.',
        requestId,
      }),
    ]);

    res.json({ request: updated, assignedRider: best.rider, distanceKm: best.distanceKm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignNearestRiderForDelivery = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const io = (req.app as any).get('io');
    const requestId = (req as any).params.requestId as string;

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.paymentStatus !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Payment must be confirmed before rider assignment' });
    }

    if (request.status !== 'READY') {
      return res.status(400).json({ error: 'Delivery rider can only be assigned when request is READY' });
    }

    const vendorProfile = request.selectedVendorId
      ? await prisma.vendorProfile.findUnique({ where: { userId: request.selectedVendorId } })
      : null;

    const originLat = vendorProfile?.locationLat ?? request.pickupLat;
    const originLng = vendorProfile?.locationLng ?? request.pickupLng;

    const riders = await prisma.riderProfile.findMany({ where: { isActive: true } });
    if (riders.length === 0) {
      return res.status(404).json({ error: 'No active riders available' });
    }

    const scored = riders
      .map(r => {
        const distanceKm = haversineKm(originLat, originLng, r.locationLat, r.locationLng);
        return { rider: r, distanceKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const inRadius = scored.filter(entry => entry.distanceKm <= entry.rider.radiusKm);
    const best = (inRadius[0] || scored[0]);
    if (!best) {
      return res.status(404).json({ error: 'No active rider found within delivery radius' });
    }

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: {
        assignedRiderId: best.rider.id,
        riderAssignmentStage: 'DELIVERY',
        deliveryRiderAssignedAt: new Date(),
      },
    });

    await Promise.all([
      createAndEmitNotification(io, {
        userId: updated.customerId,
        type: 'RIDER_ASSIGNED',
        title: 'Delivery Rider Assigned',
        message: 'A delivery rider has been assigned to your order.',
        requestId,
      }),
      createAndEmitNotification(io, {
        userId: best.rider.userId,
        type: 'NEW_ASSIGNMENT',
        title: 'New Delivery Assignment',
        message: 'You have been assigned a delivery request.',
        requestId,
      }),
    ]);

    res.json({ request: updated, assignedRider: best.rider, distanceKm: best.distanceKm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvailableVendors = async (req: AuthRequest, res: Response) => {
  try {
    const requestId = (req as any).query.requestId as string;

    if (!requestId) {
      return res.status(400).json({ error: 'requestId query parameter required' });
    }

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const vendors = await prisma.vendorProfile.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    const scored = vendors.map(v => {
      const distanceKm = haversineKm(
        request.pickupLat,
        request.pickupLng,
        v.locationLat,
        v.locationLng,
      );
      const inRadius = distanceKm <= v.radiusKm;
      return {
        vendor: {
          id: v.user.id,
          name: v.user.name,
          email: v.user.email,
          phone: v.user.phone,
        },
        distanceKm,
        inRadius,
      };
    });

    res.json(scored.sort((a, b) => a.distanceKm - b.distanceKm));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignManualVendor = async (req: AuthRequest, res: Response) => {
  try {
    const io = (req.app as any).get('io');
    const requestId = (req as any).params.requestId as string;
    const { vendorUserId } = (req as any).body as { vendorUserId?: string };

    if (!vendorUserId) {
      return res.status(400).json({ error: 'vendorUserId is required' });
    }

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.paymentStatus !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Payment must be confirmed before assigning a vendor' });
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: vendorUserId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!vendor || !vendor.isActive) {
      return res.status(404).json({ error: 'Vendor not found or not active' });
    }

    const distanceKm = haversineKm(
      request.pickupLat,
      request.pickupLng,
      vendor.locationLat,
      vendor.locationLng,
    );

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: {
        selectedVendorId: vendorUserId,
        status: 'ACCEPTED',
        vendorAssignedAt: new Date(),
      },
    });

    await Promise.all([
      createAndEmitNotification(io, {
        userId: updated.customerId,
        type: 'VENDOR_ASSIGNED',
        title: 'Vendor Assigned',
        message: `${vendor.user.name} has been assigned to your request.`,
        requestId,
      }),
      createAndEmitNotification(io, {
        userId: vendorUserId,
        type: 'NEW_ASSIGNMENT',
        title: 'New Laundry Assignment',
        message: 'You have been assigned a new request.',
        requestId,
      }),
    ]);

    res.json({
      request: updated,
      assignedVendor: {
        id: vendor.user.id,
        name: vendor.user.name,
        email: vendor.user.email,
        phone: vendor.user.phone,
      },
      distanceKm,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvailableRiders = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId, stage } = (req as any).query as { requestId?: string; stage?: string };

    if (!requestId || !stage) {
      return res.status(400).json({ error: 'requestId and stage query parameters required' });
    }

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    let originLat = request.pickupLat;
    let originLng = request.pickupLng;

    if (stage === 'DELIVERY' && request.selectedVendorId) {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: request.selectedVendorId },
      });
      if (vendorProfile) {
        originLat = vendorProfile.locationLat;
        originLng = vendorProfile.locationLng;
      }
    }

    const riders = await prisma.riderProfile.findMany({
      where: { isActive: true },
    });

    const scored = riders.map(r => {
      const distanceKm = haversineKm(originLat, originLng, r.locationLat, r.locationLng);
      const inRadius = distanceKm <= r.radiusKm;
      return {
        rider: {
          id: r.userId,
          name: r.name,
          phone: r.phone,
          vehicleType: r.vehicleType,
        },
        distanceKm,
        inRadius,
      };
    });

    res.json(scored.sort((a, b) => a.distanceKm - b.distanceKm));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignManualRiderForPickup = async (req: AuthRequest, res: Response) => {
  try {
    const io = (req.app as any).get('io');
    const requestId = (req as any).params.requestId as string;
    const { riderUserId } = (req as any).body as { riderUserId?: string };

    if (!riderUserId) {
      return res.status(400).json({ error: 'riderUserId is required' });
    }

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.paymentStatus !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Payment must be confirmed before rider assignment' });
    }

    if (!request.selectedVendorId) {
      return res.status(400).json({ error: 'Assign a vendor before assigning pickup rider' });
    }

    const rider = await prisma.riderProfile.findUnique({
      where: { userId: riderUserId },
    });

    if (!rider || !rider.isActive) {
      return res.status(404).json({ error: 'Rider not found or not active' });
    }

    const distanceKm = haversineKm(
      request.pickupLat,
      request.pickupLng,
      rider.locationLat,
      rider.locationLng,
    );

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: {
        assignedRiderId: rider.id,
        riderAssignmentStage: 'PICKUP',
        pickupRiderAssignedAt: new Date(),
      },
    });

    await Promise.all([
      createAndEmitNotification(io, {
        userId: updated.customerId,
        type: 'RIDER_ASSIGNED',
        title: 'Pickup Rider Assigned',
        message: 'A pickup rider has been assigned to your order.',
        requestId,
      }),
      createAndEmitNotification(io, {
        userId: rider.userId,
        type: 'NEW_ASSIGNMENT',
        title: 'New Pickup Assignment',
        message: 'You have been assigned a pickup request.',
        requestId,
      }),
    ]);

    res.json({
      request: updated,
      assignedRider: {
        id: rider.userId,
        name: rider.name,
        phone: rider.phone,
        vehicleType: rider.vehicleType,
      },
      distanceKm,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignManualRiderForDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const io = (req.app as any).get('io');
    const requestId = (req as any).params.requestId as string;
    const { riderUserId } = (req as any).body as { riderUserId?: string };

    if (!riderUserId) {
      return res.status(400).json({ error: 'riderUserId is required' });
    }

    const request = await prisma.laundryRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.paymentStatus !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Payment must be confirmed before rider assignment' });
    }

    if (request.status !== 'READY') {
      return res.status(400).json({ error: 'Delivery rider can only be assigned when request is READY' });
    }

    const rider = await prisma.riderProfile.findUnique({
      where: { userId: riderUserId },
    });

    if (!rider || !rider.isActive) {
      return res.status(404).json({ error: 'Rider not found or not active' });
    }

    const vendorProfile = request.selectedVendorId
      ? await prisma.vendorProfile.findUnique({ where: { userId: request.selectedVendorId } })
      : null;

    const originLat = vendorProfile?.locationLat ?? request.pickupLat;
    const originLng = vendorProfile?.locationLng ?? request.pickupLng;

    const distanceKm = haversineKm(originLat, originLng, rider.locationLat, rider.locationLng);

    const updated = await prisma.laundryRequest.update({
      where: { id: requestId },
      data: {
        assignedRiderId: rider.id,
        riderAssignmentStage: 'DELIVERY',
        deliveryRiderAssignedAt: new Date(),
      },
    });

    await Promise.all([
      createAndEmitNotification(io, {
        userId: updated.customerId,
        type: 'RIDER_ASSIGNED',
        title: 'Delivery Rider Assigned',
        message: 'A delivery rider has been assigned to your order.',
        requestId,
      }),
      createAndEmitNotification(io, {
        userId: rider.userId,
        type: 'NEW_ASSIGNMENT',
        title: 'New Delivery Assignment',
        message: 'You have been assigned a delivery request.',
        requestId,
      }),
    ]);

    res.json({
      request: updated,
      assignedRider: {
        id: rider.userId,
        name: rider.name,
        phone: rider.phone,
        vehicleType: rider.vehicleType,
      },
      distanceKm,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
