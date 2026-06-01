import React from 'react';
import { Stack, Box, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

const STEPS = [
    {
        number: '01',
        emoji: '📍',
        title: 'Search',
        desc: 'Find the best salons or clinics near you',
    },
    {
        number: '02',
        emoji: '📅',
        title: 'Choose & Book',
        desc: 'Pick your service, check reviews and book',
    },
    {
        number: '03',
        emoji: '💳',
        title: 'Pay Deposit & Visit',
        desc: 'Pay a small deposit and enjoy your beauty time',
    },
];

const HowItWorks = () => {
    const { t } = useTranslation('common');

    return (
        <Stack
            sx={{
                py: 8,
                px: 4,
                background: '#fff',
                borderTop: '1px solid rgba(255,77,141,0.06)',
            }}
        >
            <Stack sx={{ maxWidth: 1280, mx: 'auto', width: '100%', alignItems: 'center' }}>
                <Typography
                    sx={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: '#1a1a1a',
                        mb: 0.75,
                        letterSpacing: -0.5,
                    }}
                >
                    {t('How It Works')}
                </Typography>
                <Typography sx={{ fontSize: 14, color: '#888', mb: 6 }}>
                    {t('Book your beauty appointment in 3 simple steps')}
                </Typography>

                <Stack
                    direction="row"
                    gap={4}
                    sx={{ width: '100%', justifyContent: 'center' }}
                >
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <Stack
                                alignItems="center"
                                sx={{
                                    flex: 1,
                                    maxWidth: 280,
                                    p: 3,
                                    borderRadius: 4,
                                    border: '1.5px solid rgba(255,77,141,0.1)',
                                    background: 'linear-gradient(135deg, #fff8fb, #fff)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-6px)',
                                        boxShadow: '0 16px 40px rgba(255,77,141,0.12)',
                                        borderColor: '#FF85B3',
                                    },
                                }}
                            >
                                {/* Number badge */}
                                <Box
                                    component="div"
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 2,
                                        boxShadow: '0 4px 12px rgba(255,77,141,0.3)',
                                    }}
                                >
                                    <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>
                                        {step.number}
                                    </Typography>
                                </Box>

                                {/* Emoji */}
                                <Typography sx={{ fontSize: 36, mb: 1.5 }}>{step.emoji}</Typography>

                                <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', mb: 0.75 }}>
                                    {t(step.title)}
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
                                    {t(step.desc)}
                                </Typography>
                            </Stack>

                            {/* Arrow between steps */}
                            {index < STEPS.length - 1 && (
                                <Stack justifyContent="center" sx={{ flexShrink: 0 }}>
                                    <Typography sx={{ fontSize: 24, color: 'rgba(255,77,141,0.3)' }}>→</Typography>
                                </Stack>
                            )}
                        </React.Fragment>
                    ))}
                </Stack>
            </Stack>
        </Stack>
    );
};

export default HowItWorks;