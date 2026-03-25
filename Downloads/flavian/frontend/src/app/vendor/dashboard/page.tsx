'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Skeleton, Chip } from '@mui/material';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function VendorDashboard() {
    const [requests, setRequests] = useState<any[]>([]);
    const [myOffers, setMyOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [offerModalOpen, setOfferModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [price, setPrice] = useState('');
    const [eta, setEta] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [nearbyRes, offersRes] = await Promise.all([
                api.get('/vendor/requests/nearby'),
                api.get('/vendor/offers')
            ]);
            setRequests(nearbyRes.data);
            setMyOffers(offersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (id: string) => {
        setSelectedRequestId(id);
        setOfferModalOpen(true);
    };

    const handleSendOffer = async () => {
        try {
            await api.post('/vendor/offers', {
                requestId: selectedRequestId,
                proposedPrice: Number(price),
                etaHours: Number(eta)
            });
            setOfferModalOpen(false);
            setPrice('');
            setEta('');
            fetchData(); // Refresh list to show offer
        } catch (err) {
            console.error(err);
            alert('Failed to send offer');
        }
    };

    if (loading) return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" mb={4}>Vendor Dashboard</Typography>
            <Typography variant="h6" fontWeight="bold" mb={2}>Nearby Laundry Requests</Typography>
            <Grid container spacing={3} mb={5}>
                {[1, 2].map((n) => (
                    <Grid item xs={12} md={6} key={n}>
                        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" mb={4}>Vendor Dashboard</Typography>

            <Typography variant="h6" fontWeight="bold" mb={2}>Nearby Laundry Requests</Typography>
            {requests.length === 0 ? (
                <Typography color="text.secondary">No new requests in your area.</Typography>
            ) : (
                <Grid container spacing={3} mb={5}>
                    {requests.map((req) => (
                        <Grid item xs={12} md={6} key={req.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <CardContent>
                                    <Typography variant="h6">{req.description}</Typography>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="body2" color="text.secondary">Distance: ~1.2 km away</Typography>
                                        <Typography variant="caption" sx={{ color: 'orange', fontWeight: 'bold' }}>⭐ Premium Customer</Typography>
                                    </Box>
                                    <Typography variant="body1">Bags: {req.bagCount}</Typography>
                                    {req.notes && <Typography variant="body2">Notes: {req.notes}</Typography>}
                                </CardContent>
                                <Box p={2} pt={0}>
                                    {myOffers.find(o => o.requestId === req.id) ? (
                                        <Button variant="outlined" fullWidth disabled>Offer Submitted</Button>
                                    ) : (
                                        <Button variant="contained" color="primary" fullWidth onClick={() => handleOpenModal(req.id)}>
                                            Send Offer
                                        </Button>
                                    )}
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Typography variant="h6" fontWeight="bold" mb={2}>My Active Jobs & Offers</Typography>
            <Grid container spacing={3}>
                {myOffers.map((offer) => (
                    <Grid item xs={12} md={4} key={offer.id}>
                        <Card sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' } }} onClick={() => router.push(`/vendor/request/${offer.requestId}`)}>
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold">Request ID: {offer.requestId.substring(0, 8)}</Typography>
                                <Typography variant="body2">My Offer: ${offer.proposedPrice}</Typography>
                                <Typography variant="body2" color={offer.status === 'ACCEPTED' ? 'success.main' : 'text.secondary'} fontWeight={offer.status === 'ACCEPTED' ? 'bold' : 'normal'}>
                                    Status: {offer.status}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={offerModalOpen} onClose={() => setOfferModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Send an Offer</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Proposed Price ($)"
                        type="number"
                        fullWidth
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Estimated Time (Hours)"
                        type="number"
                        fullWidth
                        value={eta}
                        onChange={(e) => setEta(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOfferModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSendOffer} variant="contained" disabled={!price || !eta}>Submit Offer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
