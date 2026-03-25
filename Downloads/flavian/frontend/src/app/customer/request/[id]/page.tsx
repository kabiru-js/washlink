'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, CircularProgress, Grid, Divider, Chip } from '@mui/material';
import api from '@/lib/axios';
import { useSocket } from '@/context/SocketContext';
import ChatBox from '@/components/ChatBox';
import ProgressTracker from '@/components/ProgressTracker';
import { useSnackbar } from '@/context/SnackbarContext';

export default function RequestDetailsPage({ params }: { params: { id: string } }) {
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { showToast } = useSnackbar();

    useEffect(() => {
        fetchRequest();

        if (socket) {
            socket.on('order_status_updated', (updatedRequest) => {
                if (updatedRequest.id === params.id) {
                    setRequest((prev: any) => ({ ...prev, status: updatedRequest.status }));
                    showToast(`Tracked order updated to ${updatedRequest.status}`, 'info');
                }
            });
        }

        return () => {
            if (socket) socket.off('order_status_updated');
        };
    }, [params.id, socket]);

    const fetchRequest = async () => {
        try {
            // In MVP, we fetch requests from the customer endpoint again to find the specific one by id.
            // Wait, there is no GET /api/customer/request/:id. I didn't make one!
            // Let's filter the getMyRequests list or create a quick GET endpoint backend if required.
            // Since we don't have it, we'll fetch all and filter.
            const res = await api.get('/customer/requests');
            const reqDetails = res.data.find((r: any) => r.id === params.id);
            setRequest(reqDetails);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const cancelRequest = async () => {
        if (!window.confirm('Are you sure you want to cancel this request?')) return;
        try {
            await api.post(`/customer/requests/${params.id}/cancel`);
            showToast('Order cancelled successfully', 'success');
            fetchRequest();
        } catch (err) {
            showToast('Failed to cancel order', 'error');
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
    if (!request) return <Typography>Request not found</Typography>;

    const canCancel = ['PENDING', 'ACCEPTED'].includes(request.status);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">Order Details</Typography>
                {canCancel && (
                    <Button variant="outlined" color="error" sx={{ borderRadius: 0 }} onClick={cancelRequest}>
                        Cancel Order
                    </Button>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Left Column: Request & Offers */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ p: 3, mb: 3, borderRadius: 0 }}>
                        <Box display="flex" justifyContent="space-between" mb={2}>
                            <Typography variant="h6" fontWeight="bold">{request.description}</Typography>
                            <Chip label={request.status} color={request.status === 'CANCELLED' ? 'default' : 'primary'} sx={{ borderRadius: 1 }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">Bags: {request.bagCount}</Typography>
                        <Typography variant="body1" fontWeight="bold" mt={1}>Pickup: {request.pickupAddress}</Typography>
                        {request.notes && <Typography variant="body2" color="text.secondary" mt={1}>Notes: {request.notes}</Typography>}
                        {request.finalPrice && <Typography variant="h6" fontWeight="800" mt={2} color="success.main">Agreed Price: ${request.finalPrice}</Typography>}
                    </Card>

                    {request.status === 'PENDING' && (
                        <Box>
                            <Typography variant="h6" fontWeight="bold" mb={2}>Vendor Offers ({request.offers?.length || 0})</Typography>
                            {request.offers?.map((offer: any) => (
                                <Card key={offer.id} sx={{ mb: 2, p: 2, borderLeft: '4px solid #0066cc', borderRadius: 0 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {offer.vendor.vendorProfileVendor?.businessName || offer.vendor.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">ETA: {offer.etaHours} hours</Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography variant="h6" color="primary" fontWeight="bold">${offer.proposedPrice}</Typography>
                                            {offer.status === 'PENDING' && (
                                                <Button variant="contained" color="success" size="small" sx={{ mt: 1, borderRadius: 0 }} onClick={() => acceptOffer(offer.id)}>
                                                    Accept
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                </Card>
                            ))}
                        </Box>
                    )}

                    {['ACCEPTED', 'PICKED_UP', 'WASHING', 'DELIVERING'].includes(request.status) && (
                        <Box mt={3}>
                            <Typography variant="h6" fontWeight="bold" mb={2}>Status Tracker</Typography>
                            <Card sx={{ p: 4, borderRadius: 0 }}>
                                <ProgressTracker status={request.status} />
                            </Card>
                        </Box>
                    )}
                </Grid>

                {/* Right Column: Map & Chat */}
                <Grid item xs={12} md={5}>
                    {/* Mini Map Placeholder */}
                    <Card sx={{ height: 200, mb: 3, borderRadius: 0, bgcolor: '#eee', position: 'relative', overflow: 'hidden' }}>
                         <Box sx={{ 
                            position: 'absolute', 
                            top: 0, left: 0, width: '100%', height: '100%', 
                            backgroundImage: 'url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-122.4194,37.7749,14,0/400x200?access_token=none")',
                            backgroundSize: 'cover',
                            opacity: 0.6
                        }} />
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                             <Box sx={{ width: 12, height: 12, bgcolor: '#0066cc', borderRadius: '50%', border: '2px solid white', mx: 'auto' }} />
                             <Typography variant="caption" sx={{ bgcolor: 'white', px: 1, mt: 0.5, display: 'block' }}>Pickup Point</Typography>
                        </Box>
                    </Card>

                    {request.status !== 'PENDING' && request.status !== 'CANCELLED' && request.selectedVendorId ? (
                        <ChatBox requestId={request.id} receiverId={request.selectedVendorId} />
                    ) : (
                        <Card sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0, border: '1px dashed #ccc' }}>
                            <Typography color="text.secondary">
                                {request.status === 'CANCELLED' ? 'Order was cancelled.' : 'Chat will open once an offer is accepted.'}
                            </Typography>
                        </Card>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
