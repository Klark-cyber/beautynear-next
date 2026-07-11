import React, { useEffect, useState } from 'react';
import { Stack, Box, Typography, Button, IconButton, Chip } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation } from 'swiper';

import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SALONS } from '../../../apollo/user/query';
import { LIKE_TARGET_SALON } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Salon } from '../../types/salon/salon';
import { REACT_APP_API_URL, topSalonRank } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { isSalonOpen } from '../../utils';
import useDeviceDetect from '../../hooks/useDeviceDetect';

// ⚠️ TUZATILDI: v8'da modullar ROOT paketdan import qilinadi va
// SwiperCore.use() orqali ROYXATDAN OTKAZILISHI SHART (v7dan oldingi API)
SwiperCore.use([Autoplay, Navigation]);

// ⚠️ .toLocaleString() ISHLATMAYMIZ — server va brauzer turli locale bilan
// formatlab, hydration mismatch xatosiga olib keladi.
const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const NearbySalons = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const user = useReactiveVar(userVar);
    const [salons, setSalons] = useState<Salon[]>([]);

    // ⚠️ TUZATILDI: avval userLat/userLng har render'da localStorage'dan
    // o'qilar edi, lekin Herolocationfinder geolokatsiyani KEYINROQ
    // (asinxron) saqlaganida, bu komponent qayta render bo'lmagani uchun
    // YANGI koordinatalarni hech qachon olmas edi — doim Seoul (yoki eski)
    // koordinata bilan qolib ketardi. Endi reactive state + hodisa orqali
    // sinxronlanadi.
    const [userLat, setUserLat] = useState<number>(37.5665);
    const [userLng, setUserLng] = useState<number>(126.978);

    useEffect(() => {
        const readLocation = () => {
            setUserLat(parseFloat(localStorage.getItem('userLat') || '37.5665'));
            setUserLng(parseFloat(localStorage.getItem('userLng') || '126.978'));
        };
        readLocation();
        window.addEventListener('userLocationUpdated', readLocation);
        return () => window.removeEventListener('userLocationUpdated', readLocation);
    }, []);

    const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);

    const { refetch } = useQuery(GET_SALONS, {
        fetchPolicy: 'cache-and-network',
        variables: {
            input: {
                page: 1, limit: 6, sort: 'createdAt', direction: 'DESC',
                search: { latitude: userLat, longitude: userLng, radius: 50 },
            },
        },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => setSalons(data?.getSalons?.list ?? []),
    });

    const likeHandler = async (id: string) => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await likeTargetSalon({ variables: { input: id } });
            await refetch();
            await sweetTopSmallSuccessAlert('success', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    };

    if (!salons.length) return null;

    return (
        <Stack sx={{ py: 6, px: 4, background: '#FAFAFA' }}>
            <Stack sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box component="div">
                        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', mb: 0.25 }}>
                            {t('Nearby Salons')}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: '#888' }}>
                            {t('Open salons near your location')}
                        </Typography>
                    </Box>
                    <Link href="/salons">
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer', color: '#FF4D8D', fontSize: 13, fontWeight: 600, '&:hover': { opacity: 0.8 } }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#FF4D8D' }}>{t('View all')}</Typography>
                            <Typography sx={{ color: '#FF4D8D' }}>→</Typography>
                        </Stack>
                    </Link>
                </Stack>

                {/* Cards grid */}
                <Stack direction="row" flexWrap="wrap" gap={2.5}>
                    {salons.map((salon) => {
                        const img = salon.salonImages?.[0]
                            ? (salon.salonImages[0].startsWith('http') ? salon.salonImages[0] : `${REACT_APP_API_URL}/${salon.salonImages[0]}`)
                            : '/img/banner/default.jpg';
                        const isOpen = isSalonOpen(salon.salonWorkHours);
                        const isTop = salon.salonRank >= topSalonRank;
                        const liked = salon.meLiked?.[0]?.myFavorite;

                        return (
                            <Stack
                                key={salon._id}
                                sx={{
                                    width: 'calc(33.33% - 17px)',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    background: '#fff',
                                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                                    border: '1px solid rgba(255,77,141,0.08)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 40px rgba(255,77,141,0.15)', borderColor: 'rgba(255,77,141,0.2)' },
                                }}
                            >
                                {/* Image */}
                                <Box
                                    component="div"
                                    onClick={() => router.push(`/salons/${salon._id}`)}
                                    sx={{ position: 'relative', height: 200, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' }}
                                >
                                    {/* Open/Close badge */}
                                    <Chip
                                        label={isOpen ? t('Open') : t('Closed')}
                                        size="small"
                                        sx={{
                                            position: 'absolute', top: 12, left: 12,
                                            background: isOpen ? '#4CAF50' : '#e53935',
                                            color: '#fff', fontWeight: 700, fontSize: 11,
                                        }}
                                    />
                                    {/* Like button */}
                                    <IconButton
                                        onClick={(e: any) => { e.stopPropagation(); likeHandler(salon._id); }}
                                        sx={{
                                            position: 'absolute', top: 8, right: 8,
                                            background: 'rgba(255,255,255,0.9)',
                                            width: 32, height: 32,
                                            transition: 'all 0.2s',
                                            '&:hover': { background: '#fff', transform: 'scale(1.1)' },
                                        }}
                                    >
                                        {liked ? <FavoriteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 16, color: '#666' }} />}
                                    </IconButton>
                                    {/* Top badge */}
                                    {isTop && (
                                        <Chip label="⚡ TOP" size="small" sx={{ position: 'absolute', top: 12, right: 48, background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)', color: '#fff', fontWeight: 700, fontSize: 10 }} />
                                    )}
                                </Box>

                                {/* Info */}
                                <Box component="div" sx={{ p: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                                        <Typography
                                            onClick={() => router.push(`/salons/${salon._id}`)}
                                            sx={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', cursor: 'pointer', '&:hover': { color: '#FF4D8D' }, flex: 1, mr: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                            {salon.salonTitle}
                                        </Typography>
                                        <Stack direction="row" alignItems="center" gap={0.25}>
                                            <StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
                                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333' }}>4.9</Typography>
                                        </Stack>
                                    </Stack>

                                    <Typography sx={{ fontSize: 12, color: '#888', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <LocationOnIcon sx={{ fontSize: 13 }} />
                                        {salon.salonAddress}
                                    </Typography>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ fontSize: 13, color: '#FF4D8D', fontWeight: 600 }}>
                                            {t('₩30,000~')}
                                        </Typography>
                                        <Button
                                            size="small"
                                            onClick={() => router.push(`/salons/${salon._id}`)}
                                            sx={{
                                                background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
                                                color: '#fff',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 2,
                                                boxShadow: '0 2px 8px rgba(255,77,141,0.3)',
                                                transition: 'all 0.2s',
                                                '&:hover': { transform: 'scale(1.05)', boxShadow: '0 4px 16px rgba(255,77,141,0.4)' },
                                            }}
                                        >
                                            {t('Book Now')}
                                        </Button>
                                    </Stack>

                                    {/* Deposit */}
                                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                        <ShieldOutlinedIcon sx={{ fontSize: 13, color: '#FF85B3' }} />
                                        <Typography sx={{ fontSize: 11, color: '#999' }}>
                                            {t('Deposit')}: ₩{formatPrice(salon.depositAmount)}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        );
                    })}
                </Stack>
            </Stack>
        </Stack>
    );
};

export default NearbySalons;