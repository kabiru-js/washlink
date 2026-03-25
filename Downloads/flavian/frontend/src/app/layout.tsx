import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { ThemeRegistry } from '@/components/ThemeRegistry';
import { SnackbarProvider } from '@/context/SnackbarContext';

export const metadata: Metadata = {
    title: 'WashLink',
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
                                {children}
                            </SocketProvider>
                        </AuthProvider>
                    </SnackbarProvider>
                </ThemeRegistry>
            </body>
        </html>
    );
}
