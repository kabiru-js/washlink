import bcrypt from 'bcrypt';
import { prisma } from './db';

export const ensureAdminAccount = async () => {
    const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true, email: true },
    });

    if (existingAdmin) {
        return;
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
        console.warn('No ADMIN_EMAIL / ADMIN_PASSWORD provided; skipping admin bootstrap for production.');
        return;
    }

    const adminName = process.env.ADMIN_NAME || 'WashLink Admin';
    const adminPhone = process.env.ADMIN_PHONE || null;

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
        data: {
            email: adminEmail,
            passwordHash,
            name: adminName,
            role: 'ADMIN',
            phone: adminPhone,
        },
    });
};
