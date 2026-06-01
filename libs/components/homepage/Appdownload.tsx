import React from 'react';
import { Stack, Box, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

const FEATURES = [
    { emoji: '📱', title: 'Easy Booking', desc: 'Book in a few taps' },
    { emoji: '⭐', title: 'Real Reviews', desc: 'From verified customers' },
    { emoji: '🔒', title: 'Secure Payment', desc: 'Safe & encrypted' },
];

const AppDownload = () => {
    const { t } = useTranslation('common');

    return (
        <Stack
            sx={{
                py: 8,
                px: 4,
                background: 'linear-gradient(135deg, #fff0f5 0%, #fce8f3 100%)',
                borderTop: '1px solid rgba(255,77,141,0.08)',
            }}
        >
            <Stack
                sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={6}
            >
                {/* Left text */}
                <Stack sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', mb: 1, letterSpacing: -0.5 }}>
                        {t('Beauty in your pocket')}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: '#888', mb: 4, lineHeight: 1.7 }}>
                        {t('Download the app and book your beauty anytime, anywhere.')}
                    </Typography>

                    {/* Feature list */}
                    <Stack gap={2} sx={{ mb: 4 }}>
                        {FEATURES.map((f) => (
                            <Stack key={f.title} direction="row" alignItems="center" gap={1.5}>
                                <Box component="div" sx={{
                                    width: 36, height: 36, borderRadius: 2,
                                    background: 'rgba(255,77,141,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                                }}>
                                    {f.emoji}
                                </Box>
                                <Box component="div">
                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{t(f.title)}</Typography>
                                    <Typography sx={{ fontSize: 12, color: '#999' }}>{t(f.desc)}</Typography>
                                </Box>
                            </Stack>
                        ))}
                    </Stack>

                    {/* Store buttons */}
                    <Stack direction="row" gap={2}>
                        {[
                            { label: 'App Store', icon: '🍎', sub: 'Download on the' },
                            { label: 'Google Play', icon: '▶', sub: 'Get it on' },
                        ].map((store) => (
                            <Stack
                                key={store.label}
                                direction="row"
                                alignItems="center"
                                gap={1.5}
                                sx={{
                                    px: 2.5,
                                    py: 1.25,
                                    borderRadius: 2.5,
                                    background: '#1a1a1a',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s',
                                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', background: '#333' },
                                }}
                            >
                                <Typography sx={{ fontSize: 22 }}>{store.icon}</Typography>
                                <Box component="div">
                                    <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{t(store.sub)}</Typography>
                                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{store.label}</Typography>
                                </Box>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>

                {/* Right — phone mockup placeholder */}
                <Stack sx={{ flexShrink: 0, alignItems: 'center', gap: 2 }}>
                    <Box
                        component="div"
                        sx={{
                            width: 280,
                            height: 420,
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 20px 60px rgba(255,77,141,0.25)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <img
                            src="/img/app/mockup.png"
                            alt="BeautyNear App"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24 }}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <Typography sx={{ position: 'absolute', fontSize: 48, opacity: 0.3 }}>💄</Typography>
                    </Box>
                </Stack>
            </Stack>
        </Stack>
    );
};

export default AppDownload;