'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Grid,
  Divider,
  Button,
  MenuItem,
  Select,
  Chip,
} from '@mui/material';
import api from '@/lib/axios';
import { useSocket } from '@/context/SocketContext';
import ProgressTracker from '@/components/ProgressTracker';
import { useSnackbar } from '@/context/SnackbarContext';

export default function VendorRequestPage({
  params,
}: {
  params: { id: string };
}) {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { socket } = useSocket();
  const { showToast } = useSnackbar();

  useEffect(() => {
    fetchRequest();

    if (socket) {
      socket.on('order_status_updated', updatedRequest => {
        if (updatedRequest.id === params.id) {
          setRequest((prev: any) => ({
            ...prev,
            status: updatedRequest.status,
          }));
          showToast(
            `Status updated via rider: ${updatedRequest.status}`,
            'info',
          );
        }
      });
    }

    return () => {
      if (socket) socket.off('order_status_updated');
    };
  }, [params.id, socket]);

  const fetchRequest = async () => {
    try {
      // In MVP, a vendor checks their offers to find the request details.
      // We will make a generic API GET call /vendor/offers if it includes the request.
      const res = await api.get('/vendor/offers');
      const offer = res.data.find((o: any) => o.requestId === params.id);
      if (offer && offer.request) {
        setRequest(offer.request);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!socket) return;
    setUpdating(true);
    socket.emit('update_order_status', {
      requestId: request.id,
      status: newStatus,
    });
    showToast('Successfully updated tracking status', 'success');
    setTimeout(() => setUpdating(false), 500); // UI feedback
  };

  if (loading)
    return (
      <Box display='flex' justifyContent='center' p={5}>
        <CircularProgress />
      </Box>
    );
  if (!request) return <Typography>Request not found</Typography>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography
        variant='h4'
        fontWeight='bold'
        mb={4}
        sx={{ letterSpacing: '-1px' }}
      >
        Job Details
      </Typography>

      <Grid container spacing={4}>
        {/* Left Column: Job Info */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='flex-start'
              mb={2}
            >
              <Typography variant='h5' fontWeight='bold'>
                {request.description}
              </Typography>
              <Chip
                label={request.status}
                color='primary'
                sx={{ borderRadius: 1 }}
              />
            </Box>
            <Typography variant='body1' fontWeight='bold' mt={1}>
              Pickup: {request.pickupAddress}
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant='h6' fontWeight='bold' mb={2}>
              Assigned Price: ${request.finalPrice || 'N/A'}
            </Typography>

            <Typography variant='subtitle2' color='text.secondary' mb={2}>
              Live Tracking Status
            </Typography>
            <ProgressTracker status={request.status} />
          </Card>

          {request.status !== 'PENDING' &&
            request.status !== 'CANCELLED' &&
            request.status !== 'COMPLETED' && (
              <Card sx={{ p: 4, borderRadius: 0, bgcolor: '#fafafa' }}>
                <Typography variant='h6' fontWeight='bold' mb={2}>
                  Update Job Status
                </Typography>
                <Select
                  value={request.status}
                  onChange={e => updateStatus(e.target.value)}
                  fullWidth
                  disabled={updating}
                  sx={{ borderRadius: 0, bgcolor: 'white' }}
                >
                  <MenuItem value='ACCEPTED'>Accepted</MenuItem>
                  <MenuItem value='PICKED_UP'>Picked Up</MenuItem>
                  <MenuItem value='WASHING'>Washing</MenuItem>
                  <MenuItem value='DELIVERING'>Out for Delivery</MenuItem>
                  <MenuItem value='COMPLETED'>Completed</MenuItem>
                </Select>
              </Card>
            )}
        </Grid>

        {/* Right Column: Map & Chat */}
        <Grid item xs={12} md={5}>
          {/* Mini Map Placeholder */}
          <Card
            sx={{
              height: 250,
              mb: 3,
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
                  'url("https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-122.4194,37.7749,15,0/400x250?access_token=none")',
                backgroundSize: 'cover',
                opacity: 0.5,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  bgcolor: '#0066cc',
                  borderRadius: '50%',
                  border: '2px solid white',
                  mx: 'auto',
                  boxShadow: '0 0 20px rgba(0,102,204,0.5)',
                }}
              />
              <Typography
                variant='caption'
                sx={{
                  bgcolor: 'black',
                  color: 'white',
                  px: 1,
                  mt: 1,
                  display: 'block',
                }}
              >
                Rider Proximity
              </Typography>
            </Box>
          </Card>

          <Card
            sx={{
              p: 4,
              textAlign: 'left',
              borderRadius: 0,
              border: '1px solid #ddd',
              bgcolor: '#fdfdfd',
            }}
          >
            <Typography variant='h6' fontWeight='bold' mb={1}>
              Customer Communication Policy
            </Typography>
            <Typography variant='body2' color='text.secondary' mb={2}>
              Customer communication is handled by the admin support team.
              Vendors do not chat directly with customers.
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Keep order progress updated accurately so admin can coordinate
              customer updates in real time.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
