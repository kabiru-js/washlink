'use client';

import React, { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Stack,
  Tooltip,
  Typography,
  Button,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const formatTimeAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const visibleNotifications = useMemo(() => notifications.slice(0, 20), [notifications]);

  if (!user) return null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenItem = async (id: string, requestId?: string | null) => {
    await markRead(id);
    handleClose();
    if (requestId) {
      const role = user?.role;
      const base =
        role === 'ADMIN'
          ? '/admin/request'
          : role === 'VENDOR'
            ? '/vendor/request'
            : role === 'RIDER'
              ? '/rider/request'
              : '/customer/request';
      router.push(`${base}/${requestId}`);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 14,
        right: 14,
        zIndex: theme => theme.zIndex.snackbar + 2,
        bgcolor: 'white',
        border: '1px solid #d9e2ec',
        borderRadius: '999px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
      }}
    >
      <Tooltip title='Notifications'>
        <IconButton onClick={handleOpen} size='large'>
          <Badge badgeContent={unreadCount} color='error'>
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: 380, maxWidth: '95vw', maxHeight: 480 } }}
      >
        <Stack direction='row' justifyContent='space-between' alignItems='center' px={2} py={1.5}>
          <Typography fontWeight={800}>Notifications</Typography>
          <Button size='small' onClick={() => void markAllRead()} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </Stack>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', p: 3 }}>
            <CircularProgress size={26} />
          </Box>
        ) : visibleNotifications.length === 0 ? (
          <Box px={2} py={3}>
            <Typography variant='body2' color='text.secondary'>
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ py: 0 }}>
            {visibleNotifications.map(item => (
              <ListItemButton
                key={item.id}
                onClick={() => void handleOpenItem(item.id, item.requestId)}
                sx={{
                  alignItems: 'flex-start',
                  bgcolor: item.readAt ? 'transparent' : '#f5faff',
                  borderBottom: '1px solid #eef2f6',
                }}
              >
                <ListItemText
                  primary={
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                      <Typography variant='body2' fontWeight={700}>
                        {item.title}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {formatTimeAgo(item.createdAt)}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography variant='caption' color='text.secondary'>
                      {item.message}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Menu>
    </Box>
  );
}
