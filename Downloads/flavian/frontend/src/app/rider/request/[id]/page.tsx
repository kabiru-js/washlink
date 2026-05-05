'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import ProgressTracker from '@/components/ProgressTracker';
import { useSnackbar } from '@/context/SnackbarContext';

export default function RiderRequestDetails() {
  const { id } = useParams() as { id: string };
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useSnackbar();

  useEffect(() => {
    if (!token || user?.role !== 'RIDER') {
      router.push('/login');
      return;
    }

    const fetchRequest = async () => {
      try {
        // Fetch all assigned and find this one
        const res = await api.get('/rider/requests');
        const reqData = res.data.find((r: any) => r.id === id);
        if (reqData) {
          setRequest(reqData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();

    if (socket) {
      socket.on('order_status_updated', updatedOrder => {
        if (updatedOrder.id === id) {
          setRequest((prev: any) => ({ ...prev, ...updatedOrder }));
          showToast(`New status assigned: ${updatedOrder.status}`, 'info');
        }
      });
      return () => {
        socket.off('order_status_updated');
      };
    }
  }, [id, token, user, socket]);

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await api.put(`/rider/requests/${id}/status`, {
        status: newStatus,
      });
      setRequest(res.data);
      showToast('Logistics status marked successfully', 'success');
      if (socket) {
        socket.emit('update_order_status', {
          requestId: id,
          status: newStatus,
        });
      }
    } catch (err) {
      console.error('Failed to update status', err);
      showToast('Failed to push status update', 'error');
    }
  };

  if (loading)
    return (
      <Box p={4} display='flex' justifyContent='center'>
        <CircularProgress />
      </Box>
    );
  if (!request)
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Request not found.</Typography>
      </Container>
    );

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 2, md: 6 } }}>
      <Button
        onClick={() => router.push('/rider/dashboard')}
        sx={{
          mb: 4,
          color: 'black',
          textTransform: 'none',
          fontWeight: 'bold',
        }}
      >
        &larr; Back to Dashboard
      </Button>

      <Grid container spacing={4}>
        {/* Left Column: Job Details */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              p: 4,
              borderRadius: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='flex-start'
              mb={3}
            >
              <Typography
                variant='h4'
                fontWeight='bold'
                sx={{ letterSpacing: '-1.5px' }}
              >
                Job Logistics
              </Typography>
              <Chip
                label={request.status}
                color='primary'
                sx={{ borderRadius: 1 }}
              />
            </Box>

            <Typography variant='h6' fontWeight='bold' mb={1}>
              {request.description}
            </Typography>
            <Typography variant='body1' mb={1}>
              <strong>Bags:</strong> {request.bagCount}
            </Typography>
            <Typography variant='body1' fontWeight='800' color='primary'>
              <strong>Pickup:</strong> {request.pickupAddress}
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant='subtitle2' color='text.secondary' mb={2}>
              Tracking Sequence
            </Typography>
            <ProgressTracker status={request.status} />

            <Box mt={6} display='flex' gap={2} flexWrap='wrap'>
              <Button
                variant='contained'
                sx={{
                  bgcolor: 'black',
                  borderRadius: 0,
                  '&:hover': { bgcolor: '#222' },
                }}
                onClick={() => updateStatus('PICKED_UP')}
                disabled={[
                  'PICKED_UP',
                  'IN_TRANSIT',
                  'DELIVERED',
                  'COMPLETED',
                  'CANCELLED',
                ].includes(request.status)}
              >
                Confirm Pickup
              </Button>
              <Button
                variant='contained'
                color='warning'
                sx={{ borderRadius: 0 }}
                onClick={() => updateStatus('IN_TRANSIT')}
                disabled={[
                  'IN_TRANSIT',
                  'DELIVERED',
                  'COMPLETED',
                  'CANCELLED',
                  'PENDING',
                  'ACCEPTED',
                ].includes(request.status)}
              >
                Start Transit
              </Button>
              <Button
                variant='contained'
                color='success'
                sx={{ borderRadius: 0 }}
                onClick={() => updateStatus('DELIVERED')}
                disabled={[
                  'DELIVERED',
                  'COMPLETED',
                  'CANCELLED',
                  'PENDING',
                  'ACCEPTED',
                ].includes(request.status)}
              >
                Mark Delivered
              </Button>
            </Box>
          </Card>

          <Box sx={{ mt: 4, p: 3, border: '1px solid #eee' }}>
            <Typography variant='subtitle1' fontWeight='bold' mb={1}>
              Parties Involved
            </Typography>
            <Typography variant='body2' mb={1}>
              <strong>Customer:</strong> {request.customer?.name} (
              {request.customer?.phone || 'No phone'})
            </Typography>
            <Typography variant='body2'>
              <strong>Vendor:</strong> {request.selectedVendor?.name} (
              {request.selectedVendor?.phone || 'No phone'})
            </Typography>
          </Box>
        </Grid>

        {/* Right Column: Navigation & Communication */}
        <Grid item xs={12} md={5}>
          {/* Primary Navigation Map */}
          <Typography variant='h6' fontWeight='bold' mb={2}>
            Navigation
          </Typography>
          <Card
            sx={{
              height: 300,
              mb: 4,
              borderRadius: 0,
              bgcolor: '#eee',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #ddd',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage:
                  'url("https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.39,37.78,13,0/500x300?access_token=none")',
                backgroundSize: 'cover',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '40%',
                left: '40%',
                width: 14,
                height: 14,
                bgcolor: '#0066cc',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 0 20px rgba(0,102,204,0.6)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                bgcolor: 'white',
                px: 2,
                py: 1,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant='caption' fontWeight='bold'>
                2.4 miles to Pickup
              </Typography>
            </Box>
          </Card>

          <Typography variant='h6' fontWeight='bold' mb={2}>
            Communication
          </Typography>
          <Card
            sx={{
              p: 4,
              textAlign: 'left',
              bgcolor: '#fafafa',
              borderRadius: 0,
              border: '1px solid #ddd',
            }}
          >
            <Typography variant='subtitle1' fontWeight='bold' mb={1}>
              Admin-Mediated Contact
            </Typography>
            <Typography color='text.secondary'>
              Customer communication is handled by admin support. Riders should
              update delivery status accurately so admin can coordinate with the
              customer.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
