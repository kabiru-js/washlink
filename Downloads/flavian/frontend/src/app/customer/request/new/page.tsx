'use client';

import React, { useState } from 'react';
import { Box, Card, Typography, TextField, Button, CircularProgress, Grid, Divider } from '@mui/material';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function CreateRequestPage() {
    const [description, setDescription] = useState('');
    const [bagCount, setBagCount] = useState(1);
    const [notes, setNotes] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [initialPriceOffer, setInitialPriceOffer] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/customer/requests', {
                description,
                bagCount: Number(bagCount),
                notes,
                pickupAddress,
                pickupLat: 37.7749, // Placeholder for SF
                pickupLng: -122.4194,
                initialPriceOffer: initialPriceOffer ? Number(initialPriceOffer) : null,
            });
            router.push(`/customer/request/${res.data.id}`);
        } catch (err) {
            console.error('Failed to create request', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" mb={1} sx={{ letterSpacing: '-1px' }}>
                New Laundry Request
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
                Provide your details and we'll connect you with local professionals.
            </Typography>

            <Grid container spacing={4}>
                {/* Form Section */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ p: 4, borderRadius: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <form onSubmit={handleSubmit}>
                            <Typography variant="h6" fontWeight="bold" mb={2}>Service Details</Typography>
                            <TextField 
                                fullWidth 
                                label="What needs washing?" 
                                placeholder="e.g. 2 loads of darks, 1 dry clean suit" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                margin="normal" 
                                required 
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField 
                                        fullWidth 
                                        label="Number of Bags" 
                                        type="number" 
                                        inputProps={{ min: 1 }} 
                                        value={bagCount} 
                                        onChange={(e) => setBagCount(Number(e.target.value))} 
                                        margin="normal" 
                                        required 
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField 
                                        fullWidth 
                                        label="Initial Offer ($)" 
                                        type="number" 
                                        value={initialPriceOffer} 
                                        onChange={(e) => setInitialPriceOffer(Number(e.target.value))} 
                                        margin="normal" 
                                    />
                                </Grid>
                            </Grid>
                            
                            <Divider sx={{ my: 3 }} />
                            
                            <Typography variant="h6" fontWeight="bold" mb={2}>Pickup Information</Typography>
                            <TextField 
                                fullWidth 
                                label="Confirmed Pickup Address" 
                                placeholder="Start typing your address..."
                                value={pickupAddress} 
                                onChange={(e) => setPickupAddress(e.target.value)} 
                                margin="normal" 
                                required 
                            />
                            
                            <TextField 
                                fullWidth 
                                label="Additional Notes for Rider" 
                                multiline 
                                rows={3} 
                                value={notes} 
                                onChange={(e) => setNotes(e.target.value)} 
                                margin="normal" 
                            />

                            <Button 
                                type="submit" 
                                fullWidth 
                                variant="contained" 
                                size="large" 
                                sx={{ mt: 4, py: 1.8, bgcolor: 'black', borderRadius: 0, '&:hover': { bgcolor: '#222' } }} 
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Request Pickup'}
                            </Button>
                        </form>
                    </Card>
                </Grid>

                {/* Map Placeholder Section */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ 
                        height: '100%', 
                        minHeight: 400, 
                        bgcolor: '#f1f1f1', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        position: 'relative',
                        borderRadius: 0,
                        overflow: 'hidden',
                        border: '1px solid #ddd'
                    }}>
                        {/* Simulated Map Visual */}
                        <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            width: '100%', 
                            height: '100%', 
                            backgroundImage: 'url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-122.4194,37.7749,12,0/500x500?access_token=none")',
                            backgroundSize: 'cover',
                            opacity: 0.4
                        }} />
                        
                        <Box sx={{ zIndex: 1, textAlign: 'center', p: 4, bgcolor: 'rgba(255,255,255,0.9)', m: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                            <Typography variant="h6" fontWeight="bold" mb={1}>Live Map</Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Google Maps Autocomplete will display locations here for the final release.
                            </Typography>
                            <Button 
                                variant="outlined" 
                                color="inherit" 
                                size="small" 
                                sx={{ borderRadius: 0, border: '1px solid black' }}
                            >
                                Use Current Location
                            </Button>
                        </Box>

                        <Box sx={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            width: 20,
                            height: 20,
                            bgcolor: '#0066cc',
                            borderRadius: '50%',
                            border: '4px solid white',
                            boxShadow: '0 0 0 10px rgba(0,102,204,0.1)',
                            zIndex: 2
                        }} />
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
