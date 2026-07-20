import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import MobileSaved from '../libs/components/salon/MobileSaved';
import { Stack, Typography } from '@mui/material';

const SavedPage: NextPage = () => {
    const device = useDeviceDetect();

    if (device === 'mobile') {
        return <MobileSaved />;
    }

    // ⚠️ Desktop versiyasi so'ralmagan — vaqtincha oddiy placeholder
    return (
        <Stack sx={{ minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: '#999' }}>
                Saved items — please use the mobile view.
            </Typography>
        </Stack>
    );
};

export default withLayoutBasic(SavedPage);