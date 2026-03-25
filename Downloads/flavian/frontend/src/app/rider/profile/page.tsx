'use client';

import React, { useState } from 'react';
import { Container, Typography, Card, CardContent, TextField, Button, Box } from '@mui/material';
import api from '@/lib/axios';

export default function RiderProfile() {
    const [phone, setPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [message, setMessage] = useState('');

    const handleSave = async () => {
        try {
            await api.put('/rider/profile', { phone, vehicleType });
            setMessage('Profile updated successfully!');
        } catch (error) {
            console.error(error);
            setMessage('Failed to update profile.');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" mb={3}>Rider Profile</Typography>
                    
                    <TextField 
                        fullWidth 
                        label="Phone Number" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        margin="normal" 
                    />
                    <TextField 
                        fullWidth 
                        label="Vehicle Type (e.g. Car, Bike, Van)" 
                        value={vehicleType} 
                        onChange={(e) => setVehicleType(e.target.value)} 
                        margin="normal" 
                    />

                    {message && <Typography color={message.includes('success') ? 'success.main' : 'error'} mt={2}>{message}</Typography>}

                    <Box mt={3}>
                        <Button variant="contained" onClick={handleSave} fullWidth>Save Profile</Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}
