'use client';

import React from 'react';
import { Box, Typography, Button, Container, Grid, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  // Colors based on specification
  const colors = {
    primary: '#0066cc',
    dark: '#1a1a1a',
    light: '#fafafa',
    textGray: '#666',
    hoverGray: '#f0f0f0',
    iconBg: '#e8f0ff',
    footerDark: '#333',
  };

  // Typography system based on spec
  const typography = {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
  };

  return (
    <Box sx={{ 
      bgcolor: colors.light, 
      color: colors.dark, 
      fontFamily: typography.fontFamily,
      minHeight: '100vh',
      scrollBehavior: 'smooth'
    }}>
      
      {/* 1. Header Navigation (Sticky) */}
      <Box component="header" sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        bgcolor: colors.light, 
        borderBottom: `1px solid ${colors.hoverGray}`,
        px: '5%',
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
          WashLink
        </Typography>
        <Box component="nav" sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
          {['Features', 'How it Works', 'About'].map((item) => (
            <Typography 
              key={item} 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                cursor: 'pointer', 
                transition: '0.3s',
                '&:hover': { color: colors.primary }
              }}
            >
              {item}
            </Typography>
          ))}
          <Button 
            variant="contained" 
            onClick={() => router.push('/login')}
            sx={{ 
              bgcolor: colors.dark, 
              color: 'white', 
              borderRadius: '50px', 
              px: 3.5, 
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: colors.primary, transform: 'translateY(-2px)' },
              transition: '0.3s'
            }}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      {/* 2. Hero Section */}
      <Box component="section" sx={{ 
        textAlign: 'center', 
        py: { xs: 6, md: 12 }, 
        px: '5%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: { md: '80vh' }
      }}>
        <Typography variant="h1" sx={{ 
          fontSize: { xs: '2rem', md: '3.5rem' }, 
          fontWeight: 700, 
          lineHeight: 1.1, 
          letterSpacing: '-1px',
          maxWidth: 900,
          mb: 3
        }}>
          Premium laundry services, delivered fast
        </Typography>
        <Typography variant="subtitle1" sx={{ 
          fontSize: { xs: '1.1rem', md: '1.25rem' }, 
          color: colors.textGray, 
          maxWidth: 600,
          mb: 6,
          lineHeight: 1.6
        }}>
          Connect with local professionals and get your laundry done right. Book in minutes, relax instantly.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, width: { xs: '100%', md: 'auto' } }}>
          <Button 
            variant="contained" 
            onClick={() => router.push('/register?role=CUSTOMER')}
            sx={{ 
              bgcolor: colors.primary, 
              color: 'white', 
              borderRadius: '50px', 
              px: 5, 
              py: 2,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: '#0052a3', transform: 'translateY(-3px)', boxShadow: `0 10px 25px rgba(0,102,204,0.2)` },
              transition: '0.3s'
            }}
          >
            Get Started
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => router.push('/register?role=VENDOR')}
            sx={{ 
              borderColor: colors.dark, 
              color: colors.dark, 
              borderRadius: '50px', 
              px: 5, 
              py: 2,
              fontWeight: 600,
              borderWidth: 2,
              textTransform: 'none',
              '&:hover': { bgcolor: colors.dark, color: 'white', borderColor: colors.dark, transform: 'translateY(-3px)' },
              transition: '0.3s'
            }}
          >
            Become a Partner
          </Button>
        </Box>

        {/* Hero Image Placeholder */}
        <Box sx={{ 
          mt: 8,
          width: '100%',
          maxWidth: 700,
          height: { xs: 250, md: 400 },
          background: 'linear-gradient(135deg, #e8f0ff 0%, #f0f4ff 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.primary,
          overflow: 'hidden'
        }}>
          {/* We can use the previously generated image path if available, or stay with the stylish gradient */}
          <Typography variant="h2" sx={{ opacity: 0.1, fontWeight: 800 }}>WashLink</Typography>
        </Box>
      </Box>

      {/* 3. Features Section */}
      <Box component="section" sx={{ bgcolor: 'white', py: 10, px: '5%', borderTop: `1px solid ${colors.hoverGray}`, borderBottom: `1px solid ${colors.hoverGray}` }}>
        <Typography variant="h2" sx={{ 
          fontSize: { xs: '2rem', md: '2.5rem' }, 
          fontWeight: 700, 
          textAlign: 'center',
          mb: 8
        }}>
          Why choose WashLink
        </Typography>
        
        <Grid container spacing={6} sx={{ maxWidth: 1200, mx: 'auto' }}>
          {[
            { icon: '✓', title: 'Trusted Professionals', desc: 'All our professionals are vetted, insured, and trained to handle your clothes with care.' },
            { icon: '⚡', title: 'Fast Turnaround', desc: 'Get your laundry back fresh and clean in 24-48 hours. Express options available.' },
            { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden fees. See your exact price upfront before booking any service.' },
            { icon: '📱', title: 'Easy Booking', desc: 'Schedule pickups and deliveries in seconds. Real-time tracking included.' },
            { icon: '🌱', title: 'Eco-Friendly', desc: 'We use sustainable cleaning methods and packaging to protect the environment.' },
            { icon: '🛡️', title: 'Guaranteed Quality', desc: '100% satisfaction guaranteed. If anything’s not perfect, we’ll make it right.' }
          ].map((f, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Box sx={{ 
                bgcolor: '#f9f9f9', 
                p: 5, 
                borderRadius: '15px', 
                border: `1px solid ${colors.hoverGray}`,
                height: '100%',
                transition: '0.3s ease',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 15px 40px rgba(0,0,0,0.08)', bgcolor: 'white' }
              }}>
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  bgcolor: colors.iconBg, 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  mb: 3
                }}>
                  {f.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{f.title}</Typography>
                <Typography variant="body2" sx={{ color: colors.textGray, lineHeight: 1.6 }}>{f.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 4. How It Works Section */}
      <Box component="section" sx={{ py: 10, px: '5%' }}>
        <Typography variant="h2" sx={{ 
          fontSize: { xs: '2rem', md: '2.5rem' }, 
          fontWeight: 700, 
          textAlign: 'center',
          mb: 2
        }}>
          How WashLink Works
        </Typography>
        <Typography variant="subtitle1" sx={{ 
          textAlign: 'center', 
          color: colors.textGray, 
          maxWidth: 600, 
          mx: 'auto', 
          mb: 7 
        }}>
          Three simple steps to fresh, clean laundry delivered to your door
        </Typography>

        <Grid container spacing={5} sx={{ maxWidth: 1000, mx: 'auto' }}>
          {[
            { num: '01', title: 'Book Service', desc: 'Select your laundry service preferences and choose a convenient pickup time.' },
            { num: '02', title: 'We Pick Up', desc: 'Our professionals arrive at your preferred time to collect your laundry bag.' },
            { num: '03', title: 'We Deliver', desc: 'Receive your freshly cleaned laundry delivered straight to your door.' }
          ].map((s, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Box sx={{ 
                bgcolor: 'white', 
                p: 5, 
                borderRadius: '15px', 
                border: `1px solid ${colors.hoverGray}`,
                textAlign: 'center',
                height: '100%'
              }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.primary, mb: 2 }}>{s.num}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{s.title}</Typography>
                <Typography variant="body2" sx={{ color: colors.textGray }}>{s.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 5. Call-to-Action Section */}
      <Box component="section" sx={{ 
        bgcolor: colors.primary, 
        color: 'white', 
        py: 10, 
        px: '5%', 
        textAlign: 'center' 
      }}>
        <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700, mb: 2 }}>
          Ready to simplify your laundry?
        </Typography>
        <Typography sx={{ maxWidth: 600, mx: 'auto', mb: 5, fontSize: '1.1rem', opacity: 0.9 }}>
          Join thousands of busy professionals who trust WashLink with their laundry. Start your first order today.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/register')}
          sx={{ 
            bgcolor: 'white', 
            color: colors.primary, 
            borderRadius: '50px', 
            px: 5, 
            py: 2, 
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { bgcolor: '#f0f0f0', transform: 'translateY(-3px)' },
            transition: '0.3s'
          }}
        >
          Get Started Now
        </Button>
      </Box>

      {/* 6. Footer */}
      <Box component="footer" sx={{ bgcolor: colors.dark, color: '#999', py: 6, px: '5%', textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>WashLink</Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          &copy; 2024 WashLink. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          {['Privacy', 'Terms', 'Contact'].map(link => (
            <Typography 
              key={link} 
              variant="caption" 
              sx={{ 
                color: colors.primary, 
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {link}
            </Typography>
          ))}
        </Box>
      </Box>

    </Box>
  );
}
