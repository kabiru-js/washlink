import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      role,
      phone,
      businessName,
      services,
      basePrice,
      lat,
      lng,
      radius,
    } = req.body;
    const avatarUrl = req.file ? (req.file as any).path : req.body.avatarUrl;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 8)
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters long' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole =
      role === 'VENDOR' ? 'VENDOR' : role === 'RIDER' ? 'RIDER' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: userRole,
        phone,
        avatarUrl,
      },
    });

    if (userRole === 'VENDOR') {
      await prisma.vendorProfile.create({
        data: {
          userId: user.id,
          businessName: businessName || `${name}'s Services`,
          services: JSON.stringify(services || ['WASH']),
          basePrice: basePrice || 0,
          locationLat: lat || 0.0,
          locationLng: lng || 0.0,
          radiusKm: radius || 10.0,
        },
      });
    }

    if (userRole === 'RIDER') {
      await prisma.riderProfile.create({
        data: {
          userId: user.id,
          name: name,
          phone: phone || null,
          vehicleType: req.body.vehicleType || null,
          locationLat: req.body.lat || 0.0,
          locationLng: req.body.lng || 0.0,
          radiusKm: req.body.radius || 10.0,
        },
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res
      .status(201)
      .json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        phone: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAdminContact = async (_req: AuthRequest, res: Response) => {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!admin) {
      return res.status(404).json({ error: 'No admin account found' });
    }

    res.json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
