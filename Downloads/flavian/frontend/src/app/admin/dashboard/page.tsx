'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import api from '@/lib/axios';
import ChatBox from '@/components/ChatBox';
import ProgressTracker from '@/components/ProgressTracker';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardPayload {
  metrics: {
    users: number;
    pending: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  recentRequests: DashboardRequest[];
}

interface DashboardRequest {
  id: string;
  customerId: string;
  status: string;
  description: string;
  pickupAddress: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  offers?: { id: string }[];
}

const statusOptions = [
  'PENDING',
  'ACCEPTED',
  'PICKED_UP',
  'WASHING',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [savingStatus, setSavingStatus] = useState(false);
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    void loadDashboard();
  }, [token, user]);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
      if (res.data?.recentRequests?.length > 0) {
        setSelectedRequestId(res.data.recentRequests[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRequest = useMemo<DashboardRequest | null>(
    () =>
      data?.recentRequests.find(
        (r: DashboardRequest) => r.id === selectedRequestId,
      ) || null,
    [data, selectedRequestId],
  );

  const updateStatus = async (status: string) => {
    if (!selectedRequest) return;

    setSavingStatus(true);
    try {
      await api.patch(`/admin/requests/${selectedRequest.id}/status`, {
        status,
      });
      setData((prev: DashboardPayload | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          recentRequests: prev.recentRequests.map((r: DashboardRequest) =>
            r.id === selectedRequest.id ? { ...r, status } : r,
          ),
        };
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant='h5' fontWeight={700}>
          Unable to load admin dashboard.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2, md: 4 },
        background: 'linear-gradient(180deg, #f5f9ff 0%, #ffffff 40%)',
      }}
    >
      <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
        <Typography
          variant='h3'
          fontWeight={800}
          sx={{ letterSpacing: '-1px' }}
        >
          Admin Command Dashboard
        </Typography>
        <Typography variant='body1' color='text.secondary' mt={1} mb={4}>
          Centralized support, live order supervision, and customer-first
          communication control.
        </Typography>

        <Grid container spacing={2.5} mb={4}>
          {[
            {
              label: 'Total Users',
              value: data.metrics.users,
              color: '#102A43',
            },
            {
              label: 'Pending Requests',
              value: data.metrics.pending,
              color: '#B45309',
            },
            {
              label: 'Active Orders',
              value: data.metrics.active,
              color: '#1D4ED8',
            },
            {
              label: 'Completed',
              value: data.metrics.completed,
              color: '#047857',
            },
            {
              label: 'Cancelled',
              value: data.metrics.cancelled,
              color: '#991B1B',
            },
          ].map(item => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={item.label}>
              <Card
                sx={{ p: 2.5, borderRadius: 0, border: '1px solid #d9e3f0' }}
              >
                <Typography variant='caption' color='text.secondary'>
                  {item.label}
                </Typography>
                <Typography
                  variant='h4'
                  fontWeight={800}
                  sx={{ color: item.color, mt: 1 }}
                >
                  {item.value}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 0,
                border: '1px solid #dfe6ef',
                mb: 3,
              }}
            >
              <Typography variant='h6' fontWeight={700} mb={2}>
                Recent Requests Queue
              </Typography>
              <Stack spacing={1.5}>
                {data.recentRequests.map((req: DashboardRequest) => (
                  <Box
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor:
                        selectedRequestId === req.id ? '#0F4C81' : '#e5eaf0',
                      bgcolor:
                        selectedRequestId === req.id ? '#f0f6ff' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <Box
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                      mb={1}
                    >
                      <Typography fontWeight={700}>
                        {req.customer?.name || 'Unknown Customer'}
                      </Typography>
                      <Chip label={req.status} size='small' />
                    </Box>
                    <Typography variant='body2' color='text.secondary' noWrap>
                      {req.description}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Offers: {req.offers?.length || 0} • Pickup:{' '}
                      {req.pickupAddress}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            {selectedRequest ? (
              <>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 0,
                    border: '1px solid #dfe6ef',
                    mb: 3,
                  }}
                >
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='flex-start'
                    mb={2}
                  >
                    <Box>
                      <Typography variant='h6' fontWeight={800}>
                        {selectedRequest.description}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Customer: {selectedRequest.customer?.name} (
                        {selectedRequest.customer?.email})
                      </Typography>
                    </Box>
                    <Chip label={selectedRequest.status} color='primary' />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant='subtitle2' color='text.secondary' mb={1}>
                    Progress
                  </Typography>
                  <ProgressTracker status={selectedRequest.status} />

                  <Box mt={2}>
                    <FormControl fullWidth size='small'>
                      <InputLabel id='admin-status-label'>
                        Update Status
                      </InputLabel>
                      <Select
                        labelId='admin-status-label'
                        label='Update Status'
                        value={selectedRequest.status}
                        onChange={(e: SelectChangeEvent) =>
                          updateStatus(e.target.value)
                        }
                        disabled={savingStatus}
                      >
                        {statusOptions.map(status => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Card>

                <Card
                  sx={{ p: 2, borderRadius: 0, border: '1px solid #dfe6ef' }}
                >
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                    mb={1}
                  >
                    <Typography variant='h6' fontWeight={700}>
                      Customer Support Chat
                    </Typography>
                    <Box display='flex' gap={1}>
                      <Button
                        variant='outlined'
                        sx={{ borderRadius: 0 }}
                        onClick={() =>
                          router.push(`/admin/request/${selectedRequest.id}`)
                        }
                      >
                        Open Details
                      </Button>
                      <Button
                        variant='outlined'
                        sx={{ borderRadius: 0 }}
                        onClick={() => void loadDashboard()}
                      >
                        Refresh
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant='body2' color='text.secondary' mb={2}>
                    Admin is the official point of contact for customer
                    communication.
                  </Typography>
                  <ChatBox
                    requestId={selectedRequest.id}
                    receiverId={selectedRequest.customerId}
                  />
                </Card>
              </>
            ) : (
              <Card sx={{ p: 4, borderRadius: 0, border: '1px solid #dfe6ef' }}>
                <Typography>
                  Select a request to manage status and customer communication.
                </Typography>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
