import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_FAVORITE_SALONS, GET_FAVORITE_SERVICES } from '../../../apollo/user/query';
import { LIKE_TARGET_SALON, LIKE_TARGET_SERVICE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};
const formatPrice = (n?: number): string => (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const MobileMyFavorites = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [tab, setTab] = useState<'salons' | 'services'>('salons');
    const [favSalons, setFavSalons] = useState<any[]>([]);
    const [favServices, setFavServices] = useState<any[]>([]);

    const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);
    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);

    const { error: salonsError } = useQuery(GET_FAVORITE_SALONS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 20 } },
        skip: !user?._id,
        onCompleted: (data: T) => setFavSalons(data?.getFavoriteSalons?.list ?? []),
        onError: (err) => console.error('GET_FAVORITE_SALONS XATO:', err.message, err),
    });

    const { error: servicesError } = useQuery(GET_FAVORITE_SERVICES, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 20 } },
        skip: !user?._id,
        onCompleted: (data: T) => setFavServices(data?.getFavoriteServices?.list ?? []),
        onError: (err) => console.error('GET_FAVORITE_SERVICES XATO:', err.message, err),
    });

    const unlikeSalonHandler = async (id: string) => {
        try {
            await likeTargetSalon({ variables: { input: id } });
            setFavSalons((prev) => prev.filter((s) => s._id !== id));
        } catch (err) {
            console.log('ERROR, unlikeSalonHandler:', err);
        }
    };

    const unlikeServiceHandler = async (id: string) => {
        try {
            await likeTargetService({ variables: { input: id } });
            setFavServices((prev) => prev.filter((s) => s._id !== id));
        } catch (err) {
            console.log('ERROR, unlikeServiceHandler:', err);
        }
    };

    const list = tab === 'salons' ? favSalons : favServices;

    return (
        <Box component="div" id="mobile-myfavorites">
            <Stack direction="row" className="mf-tabs">
                <Box component="div" className={`mf-tab ${tab === 'salons' ? 'active' : ''}`} onClick={() => setTab('salons')}>
                    {t('Salons')}
                </Box>
                <Box component="div" className={`mf-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>
                    {t('Services')}
                </Box>
            </Stack>

            <Stack className="mf-list">
                {list.length === 0 && (
                    <Stack alignItems="center" className="mf-empty">
                        <Typography className="mf-empty-emoji">{(salonsError || servicesError) ? '⚠️' : '💗'}</Typography>
                        <Typography className="mf-empty-title">
                            {(salonsError || servicesError) ? t('Something went wrong') : t('No favorites yet')}
                        </Typography>
                        {(salonsError || servicesError) ? (
                            <Typography sx={{ fontSize: 11, color: '#e53935', mt: 1, textAlign: 'center', px: 2 }}>
                                {salonsError?.message || servicesError?.message}
                            </Typography>
                        ) : (
                            <Box component="div" className="mf-empty-btn" onClick={() => router.push(tab === 'salons' ? '/salons' : '/service')}>
                                {t('Explore')}
                            </Box>
                        )}
                    </Stack>
                )}

                {tab === 'salons' && favSalons.map((s) => (
                    <Stack key={s._id} direction="row" gap={1.25} className="mf-card" onClick={() => router.push(`/salons/${s._id}`)}>
                        <Box component="div" className="mf-card-img" style={{ backgroundImage: `url(${imgUrl(s.salonImages?.[0])})` }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography className="mf-card-title">{s.salonTitle}</Typography>
                            <Typography className="mf-card-addr">{s.salonAddress}</Typography>
                            <Stack direction="row" alignItems="center" gap={0.3}>
                                <StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
                                <Typography className="mf-card-rating">{(s.salonRating ?? 0).toFixed(1)} ({s.salonLikes ?? 0})</Typography>
                            </Stack>
                        </Box>
                        <IconButton onClick={(e: any) => { e.stopPropagation(); unlikeSalonHandler(s._id); }}>
                            <FavoriteIcon sx={{ fontSize: 22, color: '#FF4D8D' }} />
                        </IconButton>
                    </Stack>
                ))}

                {tab === 'services' && favServices.map((s) => (
                    <Stack key={s._id} direction="row" gap={1.25} className="mf-card" onClick={() => router.push(`/service/${s._id}`)}>
                        <Box component="div" className="mf-card-img" style={{ backgroundImage: `url(${imgUrl(s.serviceImages?.[0])})` }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography className="mf-card-title">{s.serviceTitle}</Typography>
                            <Typography className="mf-card-addr">₩{formatPrice(s.servicePrice)}</Typography>
                            <Stack direction="row" alignItems="center" gap={0.3}>
                                <StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
                                <Typography className="mf-card-rating">{(s.serviceRating ?? 0).toFixed(1)}</Typography>
                            </Stack>
                        </Box>
                        <IconButton onClick={(e: any) => { e.stopPropagation(); unlikeServiceHandler(s._id); }}>
                            <FavoriteIcon sx={{ fontSize: 22, color: '#FF4D8D' }} />
                        </IconButton>
                    </Stack>
                ))}

                {list.length > 0 && <Typography className="mf-no-more">{t('No more favorites')}</Typography>}
            </Stack>
        </Box>
    );
};

export default MobileMyFavorites;