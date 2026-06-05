import React, { useCallback, useEffect, useState } from 'react';
import { Stack, Box, Typography, Button, Select, MenuItem, InputBase } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import StarIcon from '@mui/icons-material/Star';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.9780;
const CATEGORIES = ['All Categories', 'Salon', 'Clinic', 'Nail', 'Hair', 'Spa'];

const PETALS = [
    { top: '10%', left: '12%', size: 16, opacity: 0.6, delay: 0 },
    { top: '25%', left: '38%', size: 11, opacity: 0.45, delay: 1.2 },
    { top: '60%', left: '28%', size: 20, opacity: 0.35, delay: 0.7 },
    { top: '8%', left: '58%', size: 13, opacity: 0.5, delay: 2 },
    { top: '40%', left: '68%', size: 18, opacity: 0.3, delay: 0.4 },
    { top: '70%', left: '52%', size: 10, opacity: 0.45, delay: 1.8 },
    { top: '18%', left: '78%', size: 14, opacity: 0.4, delay: 0.9 },
];

// Female Korean face SVG avatars
const avatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&q=80",
];

const HeroSection = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const [category, setCategory] = useState('All Categories');
    const [searchLocation, setSearchLocation] = useState('Seoul, South Korea');
    const [searchArea, setSearchArea] = useState('Gangnam-gu, Apgujeong');
    const [showGeo, setShowGeo] = useState(true);

    useEffect(() => {
        if (localStorage.getItem('geoAllowed')) setShowGeo(false);
    }, []);

    const allowGeoHandler = useCallback(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                localStorage.setItem('geoAllowed', 'true');
                localStorage.setItem('userLat', String(pos.coords.latitude));
                localStorage.setItem('userLng', String(pos.coords.longitude));
                setShowGeo(false);
            },
            () => {
                localStorage.setItem('userLat', String(SEOUL_LAT));
                localStorage.setItem('userLng', String(SEOUL_LNG));
                setShowGeo(false);
            },
        );
    }, []);

    const findNowHandler = useCallback(() => {
        router.push('/salons?input=' + JSON.stringify({
            page: 1, limit: 9, sort: 'createdAt', direction: 'DESC', search: {},
        }));
    }, []);

    if (device === 'mobile') {
        return (
            <Stack className="hero-section mobile">
                <Box component="div" className="hero-bg-mobile" />
                <Box component="div" className="hero-overlay-mobile" />
                <Stack className="hero-mobile-content">
                    <Typography className="hero-h1-mobile">
                        Find Your<br /><span className="pink">Perfect Beauty</span><br />Near You
                    </Typography>
                    <Typography className="hero-sub-mobile">
                        {t('Discover premium Korean salons & clinics near your location.')}
                    </Typography>
                    <Button className="hero-find-mobile" onClick={findNowHandler}>{t('Find Now')}</Button>
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack className="hero-section">
            {/* BG image — no blur */}
            <Box component="div" className="hero-bg" />
            {/* Left white gradient */}
            <Box component="div" className="hero-left-overlay" />
            {/* Petals */}
            {PETALS.map((p, i) => (
                <Box key={i} component="div" className="petal" sx={{
                    top: p.top, left: p.left,
                    width: p.size, height: p.size,
                    opacity: p.opacity,
                    animationDelay: `${p.delay}s`,
                }} />
            ))}
            {/* Bottom wave */}
            <Box component="div" className="hero-wave">
                <svg viewBox="0 0 1440 72" preserveAspectRatio="none">
                    <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="#ffffff" />
                </svg>
            </Box>

            {/* LEFT CONTENT */}
            <Stack className="hero-content">

                {/* H1 — single line, no break in "--" */}
                <Typography className="hero-h1">
                    {'Find Your'}
                    <br />
                    {'Perfect Beauty Spot \u2014'}
                    <br />
                    <span className="pink">{'Right Around You'}</span>
                </Typography>

                <Typography className="hero-sub">
                    {'Discover premium Korean salons, skincare clinics,'}
                    <br />
                    {'and aesthetic studios near your location.'}
                </Typography>

                {/* Search panel */}
                <Stack className="hero-search-panel" direction="row" alignItems="center">
                    {/* Location */}
                    <Stack direction="row" alignItems="center" gap={1} className="search-field">
                        <LocationOnOutlinedIcon className="sf-icon" />
                        <InputBase
                            value={searchLocation}
                            onChange={(e) => setSearchLocation(e.target.value)}
                            className="sf-input"
                        />
                        <KeyboardArrowDownIcon className="sf-arrow" />
                    </Stack>

                    <Box component="div" className="search-sep" />

                    {/* District */}
                    <Stack direction="row" alignItems="center" gap={1} className="search-field">
                        <LocationOnOutlinedIcon className="sf-icon" />
                        <InputBase
                            value={searchArea}
                            onChange={(e) => setSearchArea(e.target.value)}
                            className="sf-input"
                        />
                        <KeyboardArrowDownIcon className="sf-arrow" />
                    </Stack>

                    <Box component="div" className="search-sep" />

                    {/* Category */}
                    <Stack direction="row" alignItems="center" gap={1} className="search-field">
                        <GridViewOutlinedIcon className="sf-icon" />
                        <Select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            variant="standard"
                            disableUnderline
                            className="sf-select"
                        >
                            {CATEGORIES.map((c) => (
                                <MenuItem key={c} value={c} sx={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}>{c}</MenuItem>
                            ))}
                        </Select>
                        <KeyboardArrowDownIcon className="sf-arrow" />
                    </Stack>

                    {/* CTA */}
                    <Button className="hero-find-btn" onClick={findNowHandler}>
                        {t('Find Now')}
                    </Button>
                </Stack>

                {/* Stats row */}
                <Stack direction="row" alignItems="center" className="hero-stats" gap={0}>
                    {/* Avatars + 10K */}
                    <Stack direction="row" alignItems="center" gap={1.5} className="stat-block">
                        <Stack direction="row" className="avatar-row">
                            {avatars.map((src, i) => (
                                <Box key={i} className={`stat-av av${i}`}>
                                    <img
                                        src={src}
                                        alt={`customer-${i}`}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "50%",
                                        }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                        <Stack>
                            <Typography className="stat-num">10K+</Typography>
                            <Typography className="stat-lbl">{t('Happy Customers')}</Typography>
                        </Stack>
                    </Stack>

                    <Box component="div" className="stat-sep" />

                    {/* Rating */}
                    <Stack direction="row" alignItems="center" gap={1.5} className="stat-block">
                        <StarIcon sx={{ fontSize: 24, color: '#FFB800' }} />
                        <Stack>
                            <Typography className="stat-num">4.9</Typography>
                            <Typography className="stat-lbl">{t('Average Rating')}</Typography>
                        </Stack>
                    </Stack>

                    <Box component="div" className="stat-sep" />

                    {/* Verified */}
                    <Stack direction="row" alignItems="center" gap={1.25} className="stat-block">
                        <VerifiedOutlinedIcon sx={{ fontSize: 22, color: '#FF5D92' }} />
                        <Stack>
                            <Typography className="stat-lbl-dark">{t('Verified Salons')}</Typography>
                            <Typography className="stat-lbl-dark">{t('& Clinics')}</Typography>
                        </Stack>
                    </Stack>
                </Stack>

                {/* Geo permission — hero ichida */}
                {showGeo && (
                    <Stack direction="row" alignItems="center" gap={2} className="geo-bar">
                        <MyLocationIcon sx={{ fontSize: 18, color: '#FF5D92', flexShrink: 0 }} />
                        <Typography className="geo-text">
                            {t('Allow location access to see salons near you')}
                        </Typography>
                        <Button className="geo-allow" onClick={allowGeoHandler}>{t('Allow')}</Button>
                        <Button className="geo-skip" onClick={() => setShowGeo(false)}>{t('Skip')}</Button>
                    </Stack>
                )}
            </Stack>

            {/* FLOATING CARD 1 — Booking Confirmed */}
            <Stack className="float-card booking-card">
                <Stack direction="row" alignItems="center" gap={0.75} sx={{ mb: 1.25 }}>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
                    <Typography sx={{ fontSize: 11, color: '#888', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                        {t('Booking Confirmed')}
                    </Typography>
                </Stack>
                <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box component="div" className="booking-thumb">
                        <img src="/img/banner/hero.jpg" alt="clinic"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                    </Box>
                    <Stack>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F1F1F', fontFamily: 'Inter, sans-serif' }}>
                            Glow Skin Clinic
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#aaa', fontFamily: 'Inter, sans-serif', my: 0.4 }}>
                            May 24, 2025 · 2:00 PM
                        </Typography>
                    </Stack>
                </Stack>
                <Box component="div" sx={{ borderTop: '1px solid #F1E4E8', pt: 1.25 }}>
                    <Typography sx={{ fontSize: 12, color: '#FF5D92', fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', textAlign: 'center' }}>
                        {t('View Details')}
                    </Typography>
                </Box>
            </Stack>

            {/* FLOATING CARD 2 — Special Offer */}
            <Stack className="float-card offer-card">
                <CardGiftcardOutlinedIcon sx={{ fontSize: 22, color: '#FF5D92', opacity: 0.5, position: 'absolute', top: 14, right: 16 }} />
                <Typography sx={{ fontSize: 11, color: '#aaa', fontFamily: 'Inter, sans-serif', mb: 0.75 }}>
                    {t('Special Offer')}
                </Typography>
                <Typography sx={{ fontSize: 34, fontWeight: 800, color: '#FF5D92', fontFamily: 'Inter, sans-serif', lineHeight: 1.1, mb: 0.5 }}>
                    20% OFF
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#555', fontFamily: 'Inter, sans-serif', mb: 1.5 }}>
                    {t('For New Customers')}
                </Typography>
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer' }}>
                    <Typography sx={{ fontSize: 13, color: '#FF5D92', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                        {t('Claim Now')}
                    </Typography>
                    <ArrowForwardIcon sx={{ fontSize: 14, color: '#FF5D92' }} />
                </Stack>
            </Stack>
        </Stack>
    );
};

export default HeroSection;