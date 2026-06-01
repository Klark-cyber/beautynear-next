import React, { useState, useEffect } from 'react';
import { Stack, Box, Typography, Button, MenuItem, Select, Chip } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SearchIcon from '@mui/icons-material/Search';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { SalonLocation } from '../../enums/salon.enum';

const AI_SUGGESTIONS = ['Glass Skin Facial', 'Lash Lift', 'Korean Scalp Spa', 'Nail Art', 'Botox'];

const STATS = [
    { value: '10K+', label: 'Happy Customers' },
    { value: '4.9', label: 'Average Rating' },
    { value: '500+', label: 'Verified Salons' },
];

const HeroSection = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const [location, setLocation] = useState < string > ('');
    const [serviceText, setServiceText] = useState('');
    const [showGeoBanner, setShowGeoBanner] = useState(false);
    const [geoAllowed, setGeoAllowed] = useState(false);

    useEffect(() => {
        const allowed = localStorage.getItem('geoAllowed');
        if (!allowed) setShowGeoBanner(true);
    }, []);

    const allowGeoHandler = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    localStorage.setItem('geoAllowed', 'true');
                    localStorage.setItem('userLat', String(pos.coords.latitude));
                    localStorage.setItem('userLng', String(pos.coords.longitude));
                    setGeoAllowed(true);
                    setShowGeoBanner(false);
                },
                () => setShowGeoBanner(false),
            );
        }
    };

    const searchHandler = () => {
        const params: any = { page: 1, limit: 9 };
        if (location) params.location = location;
        if (serviceText) params.text = serviceText;
        router.push({ pathname: '/salons', query: params });
    };

    const suggestionHandler = (text: string) => {
        setServiceText(text);
    };

    // ── MOBILE ──────────────────────────────────────────────────────────────────
    if (device === 'mobile') {
        return (
            <Stack
                sx={{
                    position: 'relative',
                    minHeight: 420,
                    background: 'linear-gradient(160deg, #fff0f5 0%, #ffe4ef 60%, #fff 100%)',
                    px: 2.5,
                    pt: 3,
                    pb: 2,
                    overflow: 'hidden',
                }}
            >
                {/* Decorative circles */}
                <Box component="div" sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,77,141,0.08)', pointerEvents: 'none' }} />
                <Box component="div" sx={{ position: 'absolute', bottom: 0, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,133,179,0.06)', pointerEvents: 'none' }} />

                <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.25, mb: 0.5 }}>
                    {t('Find Your')}<br />
                    <Box component="span" sx={{ color: '#FF4D8D' }}>{t('Perfect Beauty')}</Box> {t('Spot')}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#888', mb: 2.5 }}>
                    {t('Discover premium Korean salons and skincare clinics near you.')}
                </Typography>

                {/* Stats */}
                <Stack direction="row" gap={2} sx={{ mb: 2.5 }}>
                    {STATS.map((s) => (
                        <Box key={s.value} component="div">
                            <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#FF4D8D' }}>{s.value}</Typography>
                            <Typography sx={{ fontSize: 10, color: '#999' }}>{t(s.label)}</Typography>
                        </Box>
                    ))}
                </Stack>

                {/* Search box */}
                <Stack
                    sx={{
                        background: '#fff',
                        borderRadius: 3,
                        p: 2,
                        boxShadow: '0 4px 24px rgba(255,77,141,0.1)',
                        mb: 1.5,
                    }}
                    gap={1.5}
                >
                    <Stack direction="row" alignItems="center" gap={1}
                        sx={{ border: '1px solid rgba(255,77,141,0.2)', borderRadius: 2, px: 1.5, py: 0.75 }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                        <Select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            displayEmpty
                            variant="standard"
                            disableUnderline
                            sx={{ flex: 1, fontSize: 13, color: location ? '#333' : '#aaa' }}
                        >
                            <MenuItem value="">{t('Select city')}</MenuItem>
                            {Object.values(SalonLocation).map((loc) => (
                                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                            ))}
                        </Select>
                    </Stack>

                    <Stack direction="row" alignItems="center" gap={1}
                        sx={{ border: '1px solid rgba(255,77,141,0.2)', borderRadius: 2, px: 1.5, py: 0.75 }}>
                        <SearchIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                        <input
                            value={serviceText}
                            onChange={(e) => setServiceText(e.target.value)}
                            placeholder={t('Search (e.g. Facial, Nail)')}
                            onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#333' }}
                        />
                    </Stack>

                    <Button
                        fullWidth
                        onClick={searchHandler}
                        sx={{
                            background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
                            color: '#fff',
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: 14,
                            py: 1,
                            boxShadow: '0 4px 16px rgba(255,77,141,0.35)',
                            transition: 'all 0.25s',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(255,77,141,0.45)' },
                        }}
                    >
                        {t('Find Now')}
                    </Button>
                </Stack>

                {/* AI suggestions */}
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    <Typography sx={{ fontSize: 11, color: '#FF4D8D', fontWeight: 600, alignSelf: 'center' }}>✨ AI:</Typography>
                    {AI_SUGGESTIONS.slice(0, 3).map((s) => (
                        <Chip
                            key={s}
                            label={s}
                            size="small"
                            onClick={() => suggestionHandler(s)}
                            sx={{ fontSize: 11, cursor: 'pointer', background: 'rgba(255,77,141,0.08)', color: '#FF4D8D', border: '1px solid rgba(255,77,141,0.2)', '&:hover': { background: 'rgba(255,77,141,0.15)' } }}
                        />
                    ))}
                </Stack>

                {/* Geo banner */}
                {showGeoBanner && (
                    <Stack direction="row" alignItems="center" justifyContent="space-between"
                        sx={{ mt: 2, p: 1.5, background: '#fff', borderRadius: 2, border: '1px solid rgba(255,77,141,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <MyLocationIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                            <Typography sx={{ fontSize: 12, color: '#555' }}>{t('Enable location to discover salons near you')}</Typography>
                        </Stack>
                        <Stack direction="row" gap={0.75}>
                            <Button size="small" onClick={allowGeoHandler}
                                sx={{ background: '#FF4D8D', color: '#fff', fontSize: 11, px: 1.5, borderRadius: 1.5, minWidth: 0, '&:hover': { background: '#e53578' } }}>
                                {t('Allow')}
                            </Button>
                            <Button size="small" onClick={() => setShowGeoBanner(false)}
                                sx={{ color: '#999', fontSize: 11, px: 1, minWidth: 0 }}>
                                {t('Later')}
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Stack>
        );
    }

    // ── DESKTOP ─────────────────────────────────────────────────────────────────
    return (
        <Stack
            sx={{
                position: 'relative',
                minHeight: 580,
                background: 'linear-gradient(135deg, #fff0f5 0%, #ffe4ef 50%, #fce8f3 100%)',
                overflow: 'hidden',
            }}
        >
            {/* Decorative bg circles */}
            {[
                { size: 400, top: -100, right: -100, opacity: 0.06 },
                { size: 250, top: 100, right: 300, opacity: 0.04 },
                { size: 180, bottom: -50, left: 100, opacity: 0.05 },
            ].map((c, i) => (
                <Box key={i} component="div" sx={{
                    position: 'absolute', borderRadius: '50%',
                    width: c.size, height: c.size,
                    top: c.top, right: c.right, bottom: (c as any).bottom, left: (c as any).left,
                    background: `rgba(255,77,141,${c.opacity})`,
                    pointerEvents: 'none',
                }} />
            ))}

            <Stack sx={{ maxWidth: 1280, mx: 'auto', width: '100%', px: 4, py: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {/* Left content */}
                <Stack sx={{ flex: 1, zIndex: 1 }}>
                    <Typography sx={{ fontSize: 52, fontWeight: 900, color: '#1a1a1a', lineHeight: 1.15, mb: 1.5, letterSpacing: -1 }}>
                        {t('Find Your')}<br />
                        {t('Perfect Beauty Spot')} —<br />
                        <Box component="span" sx={{
                            color: '#FF4D8D',
                            background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {t('Right Around You')}
                        </Box>
                    </Typography>

                    <Typography sx={{ fontSize: 15, color: '#666', mb: 4, lineHeight: 1.7, maxWidth: 420 }}>
                        {t('Discover premium Korean salons, skincare clinics, and aesthetic studios near your location.')}
                    </Typography>

                    {/* Search box */}
                    <Stack
                        sx={{
                            background: '#fff',
                            borderRadius: 4,
                            p: 2.5,
                            boxShadow: '0 8px 40px rgba(255,77,141,0.12)',
                            mb: 2,
                            maxWidth: 580,
                        }}
                        gap={2}
                    >
                        <Stack direction="row" gap={1.5}>
                            {/* Location select */}
                            <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1, border: '1.5px solid rgba(255,77,141,0.2)', borderRadius: 2.5, px: 1.5, py: 1, transition: 'border-color 0.2s', '&:focus-within': { borderColor: '#FF4D8D' } }}>
                                <LocationOnOutlinedIcon sx={{ fontSize: 20, color: '#FF4D8D', flexShrink: 0 }} />
                                <Select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    displayEmpty
                                    variant="standard"
                                    disableUnderline
                                    sx={{ flex: 1, fontSize: 14, color: location ? '#333' : '#aaa', '& .MuiSelect-select': { p: 0 } }}
                                >
                                    <MenuItem value="">{t('Seoul, South Korea')}</MenuItem>
                                    {Object.values(SalonLocation).map((loc) => (
                                        <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                                    ))}
                                </Select>
                            </Stack>

                            {/* Service search */}
                            <Stack direction="row" alignItems="center" gap={1} sx={{ flex: 1.2, border: '1.5px solid rgba(255,77,141,0.2)', borderRadius: 2.5, px: 1.5, py: 1, transition: 'border-color 0.2s', '&:focus-within': { borderColor: '#FF4D8D' } }}>
                                <SearchIcon sx={{ fontSize: 20, color: '#FF4D8D', flexShrink: 0 }} />
                                <input
                                    value={serviceText}
                                    onChange={(e) => setServiceText(e.target.value)}
                                    placeholder={t('Search services (e.g. Facial, Nail)')}
                                    onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
                                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#333', fontFamily: 'inherit' }}
                                />
                            </Stack>

                            <Button
                                onClick={searchHandler}
                                sx={{
                                    px: 3,
                                    py: 1.25,
                                    background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
                                    color: '#fff',
                                    borderRadius: 2.5,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 4px 16px rgba(255,77,141,0.35)',
                                    transition: 'all 0.25s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(255,77,141,0.5)', background: 'linear-gradient(135deg, #e53578, #FF4D8D)' },
                                    '&:active': { transform: 'translateY(0)' },
                                }}
                            >
                                {t('Find Now')}
                            </Button>
                        </Stack>

                        {/* AI suggestions */}
                        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography sx={{ fontSize: 12, color: '#FF4D8D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                ✨ {t('AI Suggestions')}
                            </Typography>
                            {AI_SUGGESTIONS.map((s) => (
                                <Chip
                                    key={s}
                                    label={s}
                                    size="small"
                                    onClick={() => suggestionHandler(s)}
                                    sx={{
                                        fontSize: 12,
                                        cursor: 'pointer',
                                        background: 'rgba(255,77,141,0.06)',
                                        color: '#555',
                                        border: '1px solid rgba(255,77,141,0.15)',
                                        transition: 'all 0.2s',
                                        '&:hover': { background: 'rgba(255,77,141,0.12)', color: '#FF4D8D', borderColor: '#FF4D8D', transform: 'translateY(-1px)' },
                                    }}
                                />
                            ))}
                        </Stack>
                    </Stack>

                    {/* Stats */}
                    <Stack direction="row" gap={3}>
                        {STATS.map((s) => (
                            <Stack key={s.value} direction="row" alignItems="center" gap={1}>
                                <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#FF4D8D' }}>{s.value}</Typography>
                                <Typography sx={{ fontSize: 12, color: '#888' }}>{t(s.label)}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>

                {/* Right — hero image */}
                <Box
                    component="div"
                    sx={{
                        flexShrink: 0,
                        width: 420,
                        height: 480,
                        position: 'relative',
                        borderRadius: 6,
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(255,77,141,0.2)',
                        transition: 'transform 0.3s ease',
                        '&:hover': { transform: 'scale(1.02)' },
                    }}
                >
                    <img
                        src="/img/banner/hero.jpg"
                        alt="K-Beauty"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Booking confirmed card */}
                    <Stack
                        sx={{
                            position: 'absolute',
                            top: 20,
                            right: -10,
                            background: '#fff',
                            borderRadius: 3,
                            p: 1.5,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            minWidth: 180,
                            animation: 'floatUp 3s ease-in-out infinite',
                            '@keyframes floatUp': {
                                '0%,100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-8px)' },
                            },
                        }}
                    >
                        <Typography sx={{ fontSize: 11, color: '#4CAF50', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            ✅ {t('Booking Confirmed')}
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333', mt: 0.25 }}>Glow Skin Clinic</Typography>
                        <Typography sx={{ fontSize: 11, color: '#999' }}>May 24, 2025 · 2:00 PM</Typography>
                    </Stack>

                    {/* Special offer card */}
                    <Stack
                        sx={{
                            position: 'absolute',
                            bottom: 20,
                            right: -10,
                            background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
                            borderRadius: 3,
                            p: 1.5,
                            boxShadow: '0 8px 24px rgba(255,77,141,0.3)',
                            minWidth: 140,
                            animation: 'floatDown 3s ease-in-out infinite 1.5s',
                            '@keyframes floatDown': {
                                '0%,100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(8px)' },
                            },
                        }}
                    >
                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{t('Special Offer')}</Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>20% OFF</Typography>
                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{t('For New Customers')}</Typography>
                    </Stack>
                </Box>
            </Stack>

            {/* Geo location banner */}
            {showGeoBanner && (
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                    sx={{
                        py: 1.5,
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        borderTop: '1px solid rgba(255,77,141,0.1)',
                        animation: 'slideDown 0.3s ease',
                        '@keyframes slideDown': {
                            '0%': { transform: 'translateY(-100%)', opacity: 0 },
                            '100%': { transform: 'translateY(0)', opacity: 1 },
                        },
                    }}
                >
                    <MyLocationIcon sx={{ color: '#FF4D8D', fontSize: 20 }} />
                    <Typography sx={{ fontSize: 14, color: '#555' }}>
                        {t('Allow location access to see salons near you')}
                    </Typography>
                    <Button
                        size="small"
                        onClick={allowGeoHandler}
                        sx={{
                            background: '#FF4D8D',
                            color: '#fff',
                            px: 2.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            fontSize: 13,
                            boxShadow: '0 2px 12px rgba(255,77,141,0.3)',
                            '&:hover': { background: '#e53578', transform: 'scale(1.03)' },
                        }}
                    >
                        {t('Allow')}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setShowGeoBanner(false)}
                        startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                        sx={{ color: '#999', fontSize: 13 }}
                    >
                        {t('Skip')}
                    </Button>
                </Stack>
            )}
        </Stack>
    );
};

export default HeroSection;