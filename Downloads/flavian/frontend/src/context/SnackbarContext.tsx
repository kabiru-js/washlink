'use client';

import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface SnackbarContextType {
    showToast: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
}

const SnackbarContext = createContext<SnackbarContextType>({ showToast: () => {} });

export const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    const showToast = (msg: string, sev: 'success' | 'error' | 'info' | 'warning' = 'success') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    };

    return (
        <SnackbarContext.Provider value={{ showToast }}>
            {children}
            <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setOpen(false)} severity={severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

export const useSnackbar = () => useContext(SnackbarContext);
