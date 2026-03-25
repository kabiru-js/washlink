'use client';

import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#0066cc' }, // Vibrant Blue as per spec
        secondary: { main: '#1a1a1a' }, // Dark as per spec
        background: { default: '#fafafa', paper: '#ffffff' },
    },
    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 700 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 0 }, // Sharp corners for modern minimalist look
    components: {
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 0, padding: '12px 28px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #eee'
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': { borderRadius: 0 }
                }
            }
        }
    },
});

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}
