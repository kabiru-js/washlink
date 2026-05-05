'use client';

import React, { Suspense, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') as
    | 'CUSTOMER'
    | 'VENDOR'
    | 'RIDER'
    | null;

  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR' | 'RIDER'>(
    initialRole || 'CUSTOMER',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    if (avatarFile) formData.append('avatar', avatarFile);
    if (role === 'VENDOR') formData.append('businessName', businessName);
    if (role === 'RIDER') formData.append('vehicleType', vehicleType);

    try {
      const res = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: '#f6f6f6',
      }}
    >
      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          p: 5,
          borderRadius: 0,
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        }}
      >
        <Typography variant='h4' fontWeight='bold' align='center' mb={1}>
          WashLink
        </Typography>
        <Typography
          variant='body1'
          align='center'
          color='text.secondary'
          mb={3}
        >
          Create an account
        </Typography>

        <form onSubmit={handleRegister}>
          <Box display='flex' justifyContent='center' mb={3}>
            <ToggleButtonGroup
              color='primary'
              value={role}
              exclusive
              onChange={(e, newRole) => {
                if (newRole) setRole(newRole);
              }}
              aria-label='Account Role'
            >
              <ToggleButton
                value='CUSTOMER'
                sx={{ textTransform: 'none', px: 3 }}
              >
                Customer
              </ToggleButton>
              <ToggleButton
                value='VENDOR'
                sx={{ textTransform: 'none', px: 3 }}
              >
                Vendor
              </ToggleButton>
              <ToggleButton value='RIDER' sx={{ textTransform: 'none', px: 3 }}>
                Rider
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            fullWidth
            label='Full Name'
            value={name}
            onChange={e => setName(e.target.value)}
            margin='normal'
            required
          />
          <TextField
            fullWidth
            label='Email'
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            margin='normal'
            required
          />
          <TextField
            fullWidth
            label='Password (min 8 chars)'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            margin='normal'
            required
            inputProps={{ minLength: 8 }}
          />

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant='caption' color='text.secondary'>
              Profile Avatar (Optional)
            </Typography>
            <input
              type='file'
              accept='image/*'
              onChange={e =>
                setAvatarFile(e.target.files ? e.target.files[0] : null)
              }
              style={{ display: 'block', marginTop: '8px' }}
            />
          </Box>

          {role === 'VENDOR' && (
            <TextField
              fullWidth
              label='Business Name'
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              margin='normal'
              required
            />
          )}
          {role === 'RIDER' && (
            <TextField
              fullWidth
              label='Vehicle Type (e.g. Car, Bike)'
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              margin='normal'
            />
          )}

          {error && (
            <Typography color='error' variant='body2' mt={1}>
              {error}
            </Typography>
          )}

          <Button
            type='submit'
            fullWidth
            variant='contained'
            size='large'
            disabled={loading}
            sx={{
              mt: 4,
              mb: 2,
              py: 1.5,
              bgcolor: 'black',
              borderRadius: 0,
              '&:hover': { bgcolor: '#333' },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color='inherit' />
            ) : (
              'Sign Up'
            )}
          </Button>

          <Box textAlign='center'>
            <Typography variant='body2'>
              Already have an account?{' '}
              <Link
                href='/login'
                style={{ color: '#1976d2', textDecoration: 'none' }}
              >
                Log in
              </Link>
            </Typography>
          </Box>
        </form>
      </Card>
    </Box>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
