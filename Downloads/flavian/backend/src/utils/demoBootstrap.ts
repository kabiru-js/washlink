import bcrypt from 'bcrypt';
import { prisma } from './db';

const hashPassword = async (password: string) => bcrypt.hash(password, 10);

const upsertUser = async (
  email: string,
  name: string,
  role: string,
  password: string,
  phone?: string,
) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return existing;
  }

  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash,
      phone,
    },
  });
};

export const ensureDemoData = async () => {
  const shouldSeed = process.env.MOCK_SEED === 'true';
  if (!shouldSeed) return;

  const admin = await upsertUser(
    'admin@washlink.local',
    'WashLink Admin',
    'ADMIN',
    'ChangeMe123!',
  );
  const customer = await upsertUser(
    'customer@washlink.local',
    'Demo Customer',
    'CUSTOMER',
    'Customer123!',
    '+1-555-0001',
  );
  const vendor = await upsertUser(
    'vendor@washlink.local',
    'Demo Vendor',
    'VENDOR',
    'Vendor123!',
    '+1-555-0002',
  );
  const rider = await upsertUser(
    'rider@washlink.local',
    'Demo Rider',
    'RIDER',
    'Rider123!',
    '+1-555-0003',
  );

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: vendor.id },
  });
  if (!vendorProfile) {
    await prisma.vendorProfile.create({
      data: {
        userId: vendor.id,
        businessName: 'Sparkle Laundry Co.',
        services: JSON.stringify(['WASH', 'DRY_CLEAN']),
        basePrice: 15,
        locationLat: 37.7749,
        locationLng: -122.4194,
        radiusKm: 15,
      },
    });
  }

  const riderProfile = await prisma.riderProfile.findUnique({
    where: { userId: rider.id },
  });
  if (!riderProfile) {
    await prisma.riderProfile.create({
      data: {
        userId: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicleType: 'Bike',
      },
    });
  }

  const pendingRequest = await prisma.laundryRequest.findFirst({
    where: {
      customerId: customer.id,
      description: 'Weekly laundry bag pickup',
    },
  });

  if (!pendingRequest) {
    const createdPending = await prisma.laundryRequest.create({
      data: {
        customerId: customer.id,
        description: 'Weekly laundry bag pickup',
        bagCount: 2,
        notes: 'Please ring the bell at gate A.',
        images: JSON.stringify([]),
        pickupLat: 37.7749,
        pickupLng: -122.4194,
        pickupAddress: '123 Market St, San Francisco, CA',
        initialPriceOffer: 20,
        status: 'PENDING',
      },
    });

    await prisma.vendorOffer.create({
      data: {
        requestId: createdPending.id,
        vendorId: vendor.id,
        proposedPrice: 24,
        etaHours: 4,
        status: 'PENDING',
      },
    });
  }

  const acceptedRequest = await prisma.laundryRequest.findFirst({
    where: {
      customerId: customer.id,
      description: 'Express office shirts wash',
    },
    include: { messages: true },
  });

  if (!acceptedRequest) {
    const riderProfileRow = await prisma.riderProfile.findUnique({
      where: { userId: rider.id },
    });
    const createdAccepted = await prisma.laundryRequest.create({
      data: {
        customerId: customer.id,
        description: 'Express office shirts wash',
        bagCount: 1,
        notes: 'Need before tomorrow morning.',
        images: JSON.stringify([]),
        pickupLat: 37.781,
        pickupLng: -122.411,
        pickupAddress: '250 Howard St, San Francisco, CA',
        initialPriceOffer: 30,
        finalPrice: 35,
        status: 'DELIVERING',
        selectedVendorId: vendor.id,
        assignedRiderId: riderProfileRow?.id,
      },
    });

    await prisma.vendorOffer.create({
      data: {
        requestId: createdAccepted.id,
        vendorId: vendor.id,
        proposedPrice: 35,
        etaHours: 2,
        status: 'ACCEPTED',
      },
    });

    await prisma.message.createMany({
      data: [
        {
          requestId: createdAccepted.id,
          senderId: customer.id,
          content: 'Hi admin, is my order on schedule?',
        },
        {
          requestId: createdAccepted.id,
          senderId: admin.id,
          content:
            'Yes, your rider is currently on the way and delivery is active.',
        },
      ],
    });
  }
};
