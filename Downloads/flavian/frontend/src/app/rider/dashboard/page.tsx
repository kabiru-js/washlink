'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Card, CardContent, Box, Button, Chip, Skeleton } from '@mui/material';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

export default function RiderDashboard() {
    const { user, token } = useAuth();
    const { socket } = useSocket();
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || user?.role !== 'RIDER') {
            router.push('/login');
            return;
        }
        fetchRequests();

        if (socket) {
            socket.on('order_status_updated', (updatedOrder) => {
                setRequests((prev) => prev.map(req => req.id === updatedOrder.id ? updatedOrder : req));
            });
            return () => {
                socket.off('order_status_updated');
            };
        }
    }, [token, user, socket]);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/rider/requests');
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching rider requests', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" fontWeight="bold" mb={4}>Rider Dashboard</Typography>
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
        </Container>
    );

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">Rider Dashboard</Typography>
                <Button variant="outlined" onClick={() => router.push('/rider/profile')}>Profile</Button>
            </Box>

            <Typography variant="h6" mb={2}>Assigned Deliveries</Typography>

            {requests.length === 0 ? (
                <Typography color="text.secondary">No assigned requests right now.</Typography>
            ) : (
                requests.map((req) => (
                    <Card key={req.id} sx={{ mb: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Chip label={req.status} color={req.status === 'COMPLETED' ? 'success' : req.status === 'PICKED_UP' || req.status === 'DELIVERING' ? 'warning' : 'primary'} size="small" sx={{ mb: 1 }} />
                                    <Typography variant="subtitle1" fontWeight="bold">{req.description}</Typography>
                                    <Typography variant="body2" color="text.secondary">Bags: {req.bagCount}</Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>Pickup: {req.pickupAddress}</Typography>
                                </Box>
                                <Button variant="contained" onClick={() => router.push(`/rider/request/${req.id}`)}>
                                    Manage
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))
            )}
        </Container>
    );
}
