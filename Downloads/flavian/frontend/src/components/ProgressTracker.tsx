import React from 'react';
import { Stepper, Step, StepLabel, Box } from '@mui/material';

const steps = [
  'Request Accepted',
  'Picked Up',
    'Received by Vendor',
    'Processing',
    'Ready',
  'Out for Delivery',
  'Completed',
];

const statusToStep = {
    'PENDING': -1,
    'ACCEPTED': 0,
    'PICKED_UP': 1,
    'RECEIVED': 2,
    'PROCESSING': 3,
    'READY': 4,
    'WASHING': 3,
    'DELIVERING': 5,
    'IN_TRANSIT': 5,
    'COMPLETED': 6,
};

export default function ProgressTracker({ status }: { status: string }) {
    if (status === 'CANCELLED') return null;

    const activeStep = statusToStep[status as keyof typeof statusToStep] ?? -1;

    // Do not show stepper at all if it's purely PENDING (no one accepted yet)
    if (activeStep === -1) return null;

    return (
        <Box sx={{ width: '100%', my: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
}
