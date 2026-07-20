import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import StarIcon from '@mui/icons-material/Star';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { GET_SALON, GET_SERVICE } from '../../../apollo/user/query';
import { initializeApollo } from '../../../apollo/client';
import { REACT_APP_API_URL } from '../../config';
import { Salon } from '../../types/salon/salon';
import { Service } from '../../types/service/service';
import { getSavedSalonIds, getSavedServiceIds, toggleSavedSalon, toggleSavedService } from '../../utils';

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const MobileSaved = () => {
    const { t } = useTranslation('common');
    const router = useRouter();

    const [tab, setTab] = useState<'salons' | 'services'>('salons');
    const [savedSalons, setSavedSalons] = useState<Salon[]>([]);
    const [savedServices, setSavedServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    const loadSaved = async () => {
        setLoading(true);
        try {
            const client = initializeApollo();
            const salonIds = getSavedSalonIds();
            const serviceIds = getSavedServiceIds();

            const salonResults = await Promise.all(
                salonIds.map((id) =>
                    client.query({ query: GET_SALON, variables: { input: id }, fetchPolicy: 'network-only' }).catch(() => null),
                ),
            );
            const serviceResults = await Promise.all(
                serviceIds.map((id) =>
                    client.query({ query: GET_SERVICE, variables: { input: id }, fetchPolicy: 'network-only' }).catch(() => null),
                ),
            );

            setSavedSalons(salonResults.filter(Boolean).map((r: any) => r.data.getSalon));
            setSavedServices(serviceResults.filter(Boolean).map((r: any) => r.data.getService));
        } catch (err) {
            console.log('ERROR, loadSaved:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSaved();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const unsaveSalonHandler = (id: string) => {
        toggleSavedSalon(id);
        setSavedSalons((prev) => prev.filter((s) => s._id !== id));
    };

    const unsaveServiceHandler = (id: string) => {
        toggleSavedService(id);
        setSavedServices((prev) => prev.filter((s) => s._id !== id));
    };

    const list = tab === 'salons' ? savedSalons : savedServices;

    return (
        <Box component="div" id="mobile-saved">
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="sv-header">
                <IconButton className="sv-icon-btn" onClick={() => router.push('/')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography className="sv-title">{t('Saved')}</Typography>
                <Box sx={{ width: 40 }} />
            </Stack>

            <Stack direction="row" className="sv-tabs">
                <Box component="div" className={`sv-tab ${tab === 'salons' ? 'active' : ''}`} onClick={() => setTab('salons')}>
                    {t('Salons')} ({savedSalons.length})
                </Box>
                <Box component="div" className={`sv-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>
                    {t('Services')} ({savedServices.length})
                </Box>
            </Stack>

            <Stack className="sv-list">
                {!loading && list.length === 0 && (
                    <Stack alignItems="center" className="sv-empty">
                        <Typography className="sv-empty-emoji">🔖</Typography>
                        <Typography className="sv-empty-title">{t('Nothing saved yet')}</Typography>
                        <Typography className="sv-empty-desc">{t('Tap the bookmark icon on any salon or service to save it here.')}</Typography>
                    </Stack>
                )}

                {tab === 'salons' && savedSalons.map((salon) => (
                    <Stack key={salon._id} direction="row" gap={1.25} className="sv-card" onClick={() => router.push(`/salons/${salon._id}`)}>
                        <Box component="div" className="sv-card-img" style={{ backgroundImage: `url(${imgUrl(salon.salonImages?.[0])})` }} />
                        <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                            <Typography className="sv-card-title">{salon.salonTitle}</Typography>
                            <Typography className="sv-card-sub">{t(salon.salonType)} • {salon.salonAddress}</Typography>
                            <Stack direction="row" alignItems="center" gap={0.3} sx={{ mt: 0.5 }}>
                                <StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
                                <Typography className="sv-card-rating">4.9</Typography>
                            </Stack>
                        </Box>
                        <IconButton onClick={(e: any) => { e.stopPropagation(); unsaveSalonHandler(salon._id); }}>
                            <BookmarkIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
                        </IconButton>
                    </Stack>
                ))}

                {tab === 'services' && savedServices.map((svc) => (
                    <Stack key={svc._id} direction="row" gap={1.25} className="sv-card" onClick={() => router.push(`/service/${svc._id}`)}>
                        <Box component="div" className="sv-card-img" style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }} />
                        <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                            <Typography className="sv-card-title">{svc.serviceTitle}</Typography>
                            <Typography className="sv-card-sub">{svc.serviceDesc}</Typography>
                            <Typography className="sv-card-price">₩{formatPrice(svc.servicePrice)}</Typography>
                        </Box>
                        <IconButton onClick={(e: any) => { e.stopPropagation(); unsaveServiceHandler(svc._id); }}>
                            <BookmarkIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
                        </IconButton>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
};

export default MobileSaved;