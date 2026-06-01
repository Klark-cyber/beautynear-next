import React, { useState } from 'react';
import { Stack, Box, Typography, Button, TextField } from '@mui/material';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const NewsletterBanner = () => {
    const { t } = useTranslation('common');
    const device = useDeviceDetect();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const submitHandler = () => {
        if (!email.trim()) return;
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        setEmail('');
    };

    return (
        <Stack
            sx={{
                mx: device === 'mobile' ? 2 : 4,
                my: device === 'mobile' ? 3 : 5,
                p: device === 'mobile' ? 3 : 5,
                borderRadius: 5,
                background: 'linear-gradient(135deg, #FF4D8D 0%, #FF85B3 60%, #ffb3d0 100%)',
                position: 'relative',
                overflow: 'hidden',
                maxWidth: device === 'mobile' ? '100%' : 1280,
                alignSelf: 'center',
                width: device === 'mobile' ? 'calc(100% - 32px)' : 'calc(100% - 128px)',
            }}
        >
            {/* Decorative circles */}
            {[
                { size: 200, top: -80, right: -40, op: 0.1 },
                { size: 120, bottom: -40, left: 20, op: 0.08 },
            ].map((c, i) => (
                <Box key={i} component="div" sx={{
                    position: 'absolute',
                    width: c.size, height: c.size,
                    top: (c as any).top, right: (c as any).right,
                    bottom: (c as any).bottom, left: (c as any).left,
                    borderRadius: '50%',
                    background: `rgba(255,255,255,${c.op})`,
                    pointerEvents: 'none',
                }} />
            ))}

            <Stack
                direction={device === 'mobile' ? 'column' : 'row'}
                alignItems={device === 'mobile' ? 'flex-start' : 'center'}
                justifyContent="space-between"
                gap={3}
                sx={{ position: 'relative', zIndex: 1 }}
            >
                {/* Text */}
                <Box component="div">
                    <Typography sx={{ fontSize: device === 'mobile' ? 12 : 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600, mb: 0.5 }}>
                        {t('New User?')}
                    </Typography>
                    <Typography sx={{ fontSize: device === 'mobile' ? 22 : 30, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                        {t('Get 20% off your first booking')}
                    </Typography>
                </Box>

                {/* Input + Button */}
                <Stack direction="row" gap={1} sx={{ width: device === 'mobile' ? '100%' : 'auto', minWidth: device === 'mobile' ? 0 : 380 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder={t('Enter your email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitHandler()}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2.5,
                                background: 'rgba(255,255,255,0.95)',
                                fontSize: 13,
                                '& fieldset': { border: 'none' },
                            },
                        }}
                    />
                    <Button
                        onClick={submitHandler}
                        sx={{
                            px: 2.5,
                            py: 1,
                            borderRadius: 2.5,
                            background: '#fff',
                            color: '#FF4D8D',
                            fontWeight: 700,
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                            transition: 'all 0.25s',
                            '&:hover': {
                                background: '#fff',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                            },
                        }}
                    >
                        {submitted ? '✅ ' + t('Sent!') : t('Get My Discount')}
                    </Button>
                </Stack>
            </Stack>
        </Stack>
    );
};

export default NewsletterBanner;