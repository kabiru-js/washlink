'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, Skeleton, Chip } from '@mui/material';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function VendorDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const nearbyRes = await api.get('/vendor/requests/nearby');
            setRequests(nearbyRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" mb={4}>Vendor Dashboard</Typography>
            <Typography variant="h6" fontWeight="bold" mb={2}>My Assigned Jobs</Typography>
            <Grid container spacing={3}>
                {[1, 2, 3].map((n) => (
                    <Grid item xs={12} md={6} key={n}>
                        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" mb={1}>Vendor Dashboard</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
                View and manage jobs assigned by admin
            </Typography>

            <Typography variant="h6" fontWeight="bold" mb={3}>My Assigned Jobs</Typography>
            {requests.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography color="text.secondary">No assigned jobs at the moment. Check back soon!</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {requests.map((req) => (
                        <Grid item xs={12} md={6} key={req.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Typography variant="h6" fontWeight="bold">{req.description}</Typography>
                                        <Chip label={req.status} color="primary" size="small" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                        Customer: {req.customer?.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                        Bags: {req.bagCount}
                                    </Typography>
                                    {req.notes && (
                                        <Typography variant="body2" color="text.secondary" mb={2}>
                                            Notes: {req.notes}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" color="text.secondary">
                                        Pickup: {req.pickupAddress}
                                    </Typography>
                                </CardContent>
                                <Box p={2} pt={0}>
                                    <Button 
                                        variant="contained" 
                                        fullWidth 
                                        onClick={() => router.push(`/vendor/request/${req.id}`)}
                                        sx={{ borderRadius: 0 }}
                                    >
                                        View Job Details
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
