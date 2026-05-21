import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { ThemeRegistry } from '@/components/ThemeRegistry';
import { SnackbarProvider } from '@/context/SnackbarContext';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationBell from '@/components/NotificationBell';

export const metadata: Metadata = {
    title: 'Laundry Bolt',
    description: 'Uber for Laundry',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <ThemeRegistry>
                    <SnackbarProvider>
                        <AuthProvider>
                            <SocketProvider>
                                <NotificationProvider>
                                    <NotificationBell />
                                    {children}
                                </NotificationProvider>
                            </SocketProvider>
                        </AuthProvider>
                    </SnackbarProvider>
                </ThemeRegistry>
            </body>
        </html>
    );
}
