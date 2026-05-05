'use client';

import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import ProgressTracker from '@/components/ProgressTracker';
import ChatBox from '@/components/ChatBox';

interface RequestDetails {
  id: string;
  customerId: string;
  status: string;
  description: string;
  bagCount: number;
  notes?: string | null;
  pickupAddress: string;
  initialPriceOffer?: number | null;
  finalPrice?: number | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  selectedVendor?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  offers?: Array<{
    id: string;
    status: string;
    proposedPrice: number;
    etaHours: number;
    createdAt: string;
    vendor: {
      id: string;
      name: string;
      email: string;
      vendorProfileVendor?: { businessName?: string } | null;
    };
  }>;
  messages?: Array<{
    id: string;
    content: string;
    createdAt: string;
    sender?: {
      id: string;
      name: string;
      role: string;
    };
  }>;
}

interface TimelineEvent {
  title: string;
  time: string;
  detail: string;
}

type OfferItem = NonNullable<RequestDetails['offers']>[number];
type MessageItem = NonNullable<RequestDetails['messages']>[number];

const statusOptions = [
  'PENDING',
  'ACCEPTED',
  'PICKED_UP',
  'WASHING',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
];

export default function AdminRequestDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, token } = useAuth();

  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savedAt, setSavedAt] = useState<string>('');

  const noteStorageKey = useMemo(() => `admin_note_${id}`, [id]);

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    void loadRequest();
  }, [id, token, user]);

  useEffect(() => {
    const storedNote = localStorage.getItem(noteStorageKey);
    const storedTimestamp = localStorage.getItem(`${noteStorageKey}_time`);
    if (storedNote) setNoteText(storedNote);
    if (storedTimestamp) setSavedAt(storedTimestamp);
  }, [noteStorageKey]);

  const loadRequest = async () => {
    try {
      const res = await api.get(`/admin/requests/${id}`);
      setRequest(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!request) return;

    setSavingStatus(true);
    try {
      const res = await api.patch(`/admin/requests/${request.id}/status`, {
        status,
      });
      setRequest((prev: RequestDetails | null) =>
        prev
          ? { ...prev, status: res.data.status, updatedAt: res.data.updatedAt }
          : prev,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setSavingStatus(false);
    }
  };

  const saveInternalNote = () => {
    const now = new Date().toISOString();
    localStorage.setItem(noteStorageKey, noteText);
    localStorage.setItem(`${noteStorageKey}_time`, now);
    setSavedAt(now);
  };

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!request) return [];

    const events: TimelineEvent[] = [
      {
        title: 'Request Created',
        time: request.createdAt,
        detail: `${request.customer?.name || 'Customer'} created this request.`,
      },
      {
        title: 'Current Status',
        time: request.updatedAt,
        detail: `Current status: ${request.status}`,
      },
    ];

    (request.offers || []).forEach((offer: OfferItem) => {
      events.push({
        title: `Offer ${offer.status}`,
        time: offer.createdAt,
        detail: `${offer.vendor.vendorProfileVendor?.businessName || offer.vendor.name} offered $${offer.proposedPrice} (ETA ${offer.etaHours}h)`,
      });
    });

    (request.messages || []).slice(-5).forEach((msg: MessageItem) => {
      events.push({
        title: 'Support Message',
        time: msg.createdAt,
        detail: `${msg.sender?.name || 'User'} (${msg.sender?.role || 'UNKNOWN'}): ${msg.content}`,
      });
    });

    return events.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
    );
  }, [request]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return (
      <Box sx={{ p: 4 }}>
        <Button
          variant='outlined'
          sx={{ borderRadius: 0, mb: 2 }}
          onClick={() => router.push('/admin/dashboard')}
        >
          Back to Dashboard
        </Button>
        <Typography variant='h5' fontWeight={700}>
          Request not found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', background: '#f7fafc' }}
    >
      <Box sx={{ maxWidth: 1360, mx: 'auto' }}>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={3}
        >
          <Box>
            <Typography variant='h4' fontWeight={800}>
              Admin Request Details
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Request ID: {request.id}
            </Typography>
          </Box>
          <Button
            variant='outlined'
            sx={{ borderRadius: 0 }}
            onClick={() => router.push('/admin/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card
              sx={{ p: 3, borderRadius: 0, border: '1px solid #d9e2ec', mb: 3 }}
            >
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='flex-start'
                mb={2}
              >
                <Typography variant='h6' fontWeight={800}>
                  {request.description}
                </Typography>
                <Chip label={request.status} color='primary' />
              </Box>
              <Typography variant='body2' color='text.secondary' mb={0.5}>
                Customer: {request.customer?.name} ({request.customer?.email})
              </Typography>
              <Typography variant='body2' color='text.secondary' mb={0.5}>
                Vendor: {request.selectedVendor?.name || 'Not assigned yet'}
              </Typography>
              <Typography variant='body2' color='text.secondary' mb={2}>
                Pickup: {request.pickupAddress}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant='subtitle2' color='text.secondary' mb={1}>
                Order Progress
              </Typography>
              <ProgressTracker status={request.status} />

              <FormControl fullWidth size='small' sx={{ mt: 2 }}>
                <InputLabel id='admin-request-status'>Update Status</InputLabel>
                <Select
                  labelId='admin-request-status'
                  label='Update Status'
                  value={request.status}
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
            </Card>

            <Card sx={{ p: 3, borderRadius: 0, border: '1px solid #d9e2ec' }}>
              <Typography variant='h6' fontWeight={700} mb={1}>
                Customer Support Chat
              </Typography>
              <Typography variant='body2' color='text.secondary' mb={2}>
                Admin is the single communication channel with the customer.
              </Typography>
              <ChatBox requestId={request.id} receiverId={request.customerId} />
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card
              sx={{ p: 3, borderRadius: 0, border: '1px solid #d9e2ec', mb: 3 }}
            >
              <Typography variant='h6' fontWeight={700} mb={2}>
                Operational Timeline
              </Typography>
              <Stack spacing={1.5}>
                {timeline.map((event: TimelineEvent, index: number) => (
                  <Box
                    key={`${event.title}-${index}`}
                    sx={{ borderLeft: '3px solid #0f4c81', pl: 1.5 }}
                  >
                    <Typography variant='subtitle2' fontWeight={700}>
                      {event.title}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(event.time).toLocaleString()}
                    </Typography>
                    <Typography variant='body2'>{event.detail}</Typography>
                  </Box>
                ))}
              </Stack>
            </Card>

            <Card sx={{ p: 3, borderRadius: 0, border: '1px solid #d9e2ec' }}>
              <Typography variant='h6' fontWeight={700} mb={2}>
                Internal Admin Notes
              </Typography>
              <Typography variant='body2' color='text.secondary' mb={1.5}>
                Private notes for operations handoff. Saved in this browser per
                request.
              </Typography>
              <TextField
                multiline
                minRows={6}
                fullWidth
                value={noteText}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNoteText(e.target.value)
                }
                placeholder='Write internal notes for this request...'
              />
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mt={1.5}
              >
                <Typography variant='caption' color='text.secondary'>
                  {savedAt
                    ? `Last saved: ${new Date(savedAt).toLocaleString()}`
                    : 'Not saved yet'}
                </Typography>
                <Button
                  variant='contained'
                  sx={{ borderRadius: 0 }}
                  onClick={saveInternalNote}
                >
                  Save Note
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
