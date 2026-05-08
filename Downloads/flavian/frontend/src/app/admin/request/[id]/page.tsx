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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip as MuiChip,
  Alert,
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
  paymentStatus: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentProofUrl?: string | null;
  paymentSubmittedAt?: string | null;
  paymentConfirmedAt?: string | null;
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
  assignedRider?: {
    id: string;
    name: string;
    phone?: string | null;
    vehicleType?: string | null;
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

interface VendorOption {
  vendor: { id: string; name: string; email: string; phone: string | null };
  distanceKm: number;
  inRadius: boolean;
}

interface RiderOption {
  rider: { id: string; name: string; phone: string | null; vehicleType: string | null };
  distanceKm: number;
  inRadius: boolean;
}

type OfferItem = NonNullable<RequestDetails['offers']>[number];
type MessageItem = NonNullable<RequestDetails['messages']>[number];

const statusOptions = [
  'PENDING',
  'ACCEPTED',
  'PICKED_UP',
  'RECEIVED',
  'PROCESSING',
  'READY',
  'WASHING',
  'DELIVERING',
  'IN_TRANSIT',
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
  const [statusError, setStatusError] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [assigningVendor, setAssigningVendor] = useState(false);
  const [assigningPickupRider, setAssigningPickupRider] = useState(false);
  const [assigningDeliveryRider, setAssigningDeliveryRider] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savedAt, setSavedAt] = useState<string>('');

  // Manual selection dialogs
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [pickupRiderDialogOpen, setPickupRiderDialogOpen] = useState(false);
  const [deliveryRiderDialogOpen, setDeliveryRiderDialogOpen] = useState(false);
  const [availableVendors, setAvailableVendors] = useState<VendorOption[]>([]);
  const [availablePickupRiders, setAvailablePickupRiders] = useState<RiderOption[]>([]);
  const [availableDeliveryRiders, setAvailableDeliveryRiders] = useState<RiderOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [assigningManualVendor, setAssigningManualVendor] = useState(false);
  const [assigningManualPickupRider, setAssigningManualPickupRider] = useState(false);
  const [assigningManualDeliveryRider, setAssigningManualDeliveryRider] = useState(false);

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
    setStatusError('');
    try {
      const res = await api.patch(`/admin/requests/${request.id}/status`, {
        status,
      });
      setRequest((prev: RequestDetails | null) =>
        prev
          ? { ...prev, status: res.data.status, updatedAt: res.data.updatedAt }
          : prev,
      );
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update status';
      setStatusError(errorMsg);
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

  const confirmPayment = async () => {
    if (!request || request.paymentStatus === 'CONFIRMED') return;

    setConfirmingPayment(true);
    try {
      const res = await api.patch(`/admin/requests/${request.id}/payment/confirm`);
      setRequest((prev: RequestDetails | null) =>
        prev
          ? {
              ...prev,
              paymentStatus: res.data.paymentStatus,
              paymentConfirmedAt: res.data.paymentConfirmedAt,
              updatedAt: res.data.updatedAt,
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmingPayment(false);
    }
  };

  const assignNearestVendor = async () => {
    if (!request) return;
    setAssigningVendor(true);
    try {
      await api.patch(`/admin/requests/${request.id}/assign-vendor`);
      await loadRequest();
    } catch (error) {
      console.error(error);
    } finally {
      setAssigningVendor(false);
    }
  };

  const assignPickupRider = async () => {
    if (!request) return;
    setAssigningPickupRider(true);
    try {
      await api.patch(`/admin/requests/${request.id}/assign-rider-pickup`);
      await loadRequest();
    } catch (error) {
      console.error(error);
    } finally {
      setAssigningPickupRider(false);
    }
  };

  const assignDeliveryRider = async () => {
    if (!request) return;
    setAssigningDeliveryRider(true);
    try {
      await api.patch(`/admin/requests/${request.id}/assign-rider-delivery`);
      await loadRequest();
    } catch (error) {
      console.error(error);
    } finally {
      setAssigningDeliveryRider(false);
    }
  };

  const loadAvailableVendors = async () => {
    if (!request) return;
    setLoadingVendors(true);
    try {
      const res = await api.get(`/admin/vendors?requestId=${request.id}`);
      setAvailableVendors(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingVendors(false);
    }
  };

  const assignManualVendor = async (vendorUserId: string) => {
    if (!request) return;
    setAssigningManualVendor(true);
    try {
      await api.post(`/admin/requests/${request.id}/assign-vendor-manual`, {
        vendorUserId,
      });
      await loadRequest();
      setVendorDialogOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setAssigningManualVendor(false);
    }
  };

  const loadAvailablePickupRiders = async () => {
    if (!request) return;
    setLoadingRiders(true);
    try {
      const res = await api.get(
        `/admin/riders?requestId=${request.id}&stage=PICKUP`,
      );
      setAvailablePickupRiders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRiders(false);
    }
  };

  const assignManualPickupRider = async (riderUserId: string) => {
    if (!request) return;
    setAssigningManualPickupRider(true);
    try {
      await api.post(`/admin/requests/${request.id}/assign-rider-pickup-manual`, {
        riderUserId,
      });
      await loadRequest();
      setPickupRiderDialogOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setAssigningManualPickupRider(false);
    }
  };

  const loadAvailableDeliveryRiders = async () => {
    if (!request) return;
    setLoadingRiders(true);
    try {
      const res = await api.get(
        `/admin/riders?requestId=${request.id}&stage=DELIVERY`,
      );
      setAvailableDeliveryRiders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRiders(false);
    }
  };

  const assignManualDeliveryRider = async (riderUserId: string) => {
    if (!request) return;
    setAssigningManualDeliveryRider(true);
    try {
      await api.post(`/admin/requests/${request.id}/assign-rider-delivery-manual`, {
        riderUserId,
      });
      await loadRequest();
      setDeliveryRiderDialogOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setAssigningManualDeliveryRider(false);
    }
  };

  const openVendorDialog = async () => {
    await loadAvailableVendors();
    setVendorDialogOpen(true);
  };

  const openPickupRiderDialog = async () => {
    await loadAvailablePickupRiders();
    setPickupRiderDialogOpen(true);
  };

  const openDeliveryRiderDialog = async () => {
    await loadAvailableDeliveryRiders();
    setDeliveryRiderDialogOpen(true);
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
              <Typography variant='body2' color='text.secondary' mb={0.5}>
                Rider: {request.assignedRider?.name || 'Not assigned yet'}
              </Typography>
              <Typography variant='body2' color='text.secondary' mb={0.5}>
                Payment: {request.paymentStatus}
                {request.paymentMethod ? ` (${request.paymentMethod})` : ''}
              </Typography>
              {request.paymentReference ? (
                <Typography variant='body2' color='text.secondary' mb={0.5}>
                  Payment Ref: {request.paymentReference}
                </Typography>
              ) : null}
              <Typography variant='body2' color='text.secondary' mb={2}>
                Pickup: {request.pickupAddress}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant='subtitle2' color='text.secondary' mb={1}>
                Order Progress
              </Typography>
              <ProgressTracker status={request.status} />

              {statusError && (
                <Alert severity='error' sx={{ mt: 2, mb: 2 }} onClose={() => setStatusError('')}>
                  {statusError}
                </Alert>
              )}

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

              <Box mt={2}>
                <Button
                  variant='contained'
                  color='success'
                  sx={{ borderRadius: 0 }}
                  onClick={confirmPayment}
                  disabled={
                    confirmingPayment ||
                    request.paymentStatus === 'CONFIRMED' ||
                    request.paymentStatus !== 'SUBMITTED'
                  }
                >
                  {request.paymentStatus === 'CONFIRMED'
                    ? 'Payment Confirmed'
                    : 'Confirm Customer Payment'}
                </Button>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={2}>
                <Button
                  variant='outlined'
                  sx={{ borderRadius: 0 }}
                  onClick={assignNearestVendor}
                  disabled={
                    assigningVendor ||
                    request.paymentStatus !== 'CONFIRMED'
                  }
                >
                  Assign Nearest Vendor
                </Button>
                <Button
                  variant='outlined'
                  sx={{ borderRadius: 0 }}
                  onClick={assignPickupRider}
                  disabled={
                    assigningPickupRider ||
                    request.paymentStatus !== 'CONFIRMED' ||
                    !request.selectedVendor
                  }
                >
                  Assign Pickup Rider
                </Button>
                <Button
                  variant='outlined'
                  sx={{ borderRadius: 0 }}
                  onClick={assignDeliveryRider}
                  disabled={
                    assigningDeliveryRider ||
                    request.paymentStatus !== 'CONFIRMED' ||
                    request.status !== 'READY'
                  }
                >
                  Assign Delivery Rider
                </Button>
              </Stack>

              <Typography variant='subtitle2' color='text.secondary' mt={2.5} mb={1}>
                Or select manually:
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant='outlined'
                  size='small'
                  sx={{ borderRadius: 0, flex: 1 }}
                  onClick={openVendorDialog}
                  disabled={request.paymentStatus !== 'CONFIRMED'}
                >
                  Select Vendor
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  sx={{ borderRadius: 0, flex: 1 }}
                  onClick={openPickupRiderDialog}
                  disabled={
                    request.paymentStatus !== 'CONFIRMED' ||
                    !request.selectedVendor
                  }
                >
                  Select Pickup Rider
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  sx={{ borderRadius: 0, flex: 1 }}
                  onClick={openDeliveryRiderDialog}
                  disabled={
                    request.paymentStatus !== 'CONFIRMED' ||
                    request.status !== 'READY'
                  }
                >
                  Select Delivery Rider
                </Button>
              </Stack>
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

      {/* Vendor Selection Dialog */}
      <Dialog open={vendorDialogOpen} onClose={() => setVendorDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Select Vendor Manually</DialogTitle>
        <DialogContent>
          {loadingVendors ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={40} />
            </Box>
          ) : availableVendors.length === 0 ? (
            <Typography color='text.secondary'>No vendors available</Typography>
          ) : (
            <List>
              {availableVendors.map(option => (
                <ListItemButton
                  key={option.vendor.id}
                  onClick={() => assignManualVendor(option.vendor.id)}
                  disabled={assigningManualVendor}
                >
                  <ListItemText
                    primary={option.vendor.name}
                    secondary={`${option.distanceKm.toFixed(1)} km ${option.inRadius ? '✓' : '(beyond radius)'}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Pickup Rider Selection Dialog */}
      <Dialog open={pickupRiderDialogOpen} onClose={() => setPickupRiderDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Select Pickup Rider</DialogTitle>
        <DialogContent>
          {loadingRiders ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={40} />
            </Box>
          ) : availablePickupRiders.length === 0 ? (
            <Typography color='text.secondary'>No riders available</Typography>
          ) : (
            <List>
              {availablePickupRiders.map(option => (
                <ListItemButton
                  key={option.rider.id}
                  onClick={() => assignManualPickupRider(option.rider.id)}
                  disabled={assigningManualPickupRider}
                >
                  <ListItemText
                    primary={option.rider.name}
                    secondary={`${option.distanceKm.toFixed(1)} km ${option.inRadius ? '✓' : '(beyond radius)'}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupRiderDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Rider Selection Dialog */}
      <Dialog open={deliveryRiderDialogOpen} onClose={() => setDeliveryRiderDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Select Delivery Rider</DialogTitle>
        <DialogContent>
          {loadingRiders ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={40} />
            </Box>
          ) : availableDeliveryRiders.length === 0 ? (
            <Typography color='text.secondary'>No riders available</Typography>
          ) : (
            <List>
              {availableDeliveryRiders.map(option => (
                <ListItemButton
                  key={option.rider.id}
                  onClick={() => assignManualDeliveryRider(option.rider.id)}
                  disabled={assigningManualDeliveryRider}
                >
                  <ListItemText
                    primary={option.rider.name}
                    secondary={`${option.distanceKm.toFixed(1)} km ${option.inRadius ? '✓' : '(beyond radius)'}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryRiderDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
