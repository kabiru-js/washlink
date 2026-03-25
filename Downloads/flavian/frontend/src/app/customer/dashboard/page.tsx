'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, Grid, Skeleton, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

export default function CustomerDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/customer/requests');
                setRequests(res.data);
            } catch (err) {
                console.error('Failed to fetch requests', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    if (loading) return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">My Laundry</Typography>
            </Box>
            <Grid container spacing={3}>
                {[1, 2, 3].map((n) => (
                    <Grid item xs={12} md={6} key={n}>
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">My Laundry</Typography>
                <Button variant="contained" color="primary" onClick={() => router.push('/customer/request/new')}>
                    + New Request
                </Button>
            </Box>

            {requests.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">You haven't made any laundry requests yet.</Typography>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {requests.map((req) => (
                        <Grid item xs={12} md={6} key={req.id}>
                            <Card sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' } }} onClick={() => router.push(`/customer/request/${req.id}`)}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                                            {req.description}
                                        </Typography>
                                        <Chip label={req.status} color={req.status === 'PENDING' ? 'warning' : 'success'} size="small" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                        Bags: {req.bagCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Offers: {req.offers?.length || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
