import React, { useState } from 'react';
import { Stack, Box, Typography, Button, IconButton, Avatar } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation } from 'swiper';

import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import StarIcon from '@mui/icons-material/Star';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import { GET_SERVICES } from '../../../apollo/user/query';
import { LIKE_TARGET_SERVICE } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Service } from '../../types/service/service';
import { REACT_APP_API_URL } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';
import { userVar } from '../../../apollo/store';
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

// ⚠️ YANGI — avval FAKE_AVATARS (3 ta bir xil rasm) ishlatilardi
const imgUrl = (raw?: string): string => {
    if (!raw) return '/img/profile/defaultUser.svg';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const TrendingServices = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const user = useReactiveVar(userVar);
    const [services, setServices] = useState<Service[]>([]);

    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);

    const { refetch } = useQuery(GET_SERVICES, {
        fetchPolicy: 'cache-and-network',
        variables: {
            input: { page: 1, limit: 6, sort: 'serviceLikes', direction: 'DESC', search: {} },
        },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => setServices(data?.getServices?.list ?? []),
    });

    const likeHandler = async (id: string) => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await likeTargetService({ variables: { input: id } });
            await refetch();
            await sweetTopSmallSuccessAlert('success', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    };

    if (!services.length) return null;

    /** MOBILE **/
    if (device === 'mobile') {
        return (
            <Stack className="trending-services-section mobile">
                <Stack direction="row" justifyContent="space-between" alignItems="center" className="ts-header">
                    <Typography className="ts-title">{t('Trending Services')}</Typography>
                    <Link href="/service">
                        <Typography className="ts-viewall">{t('View all')}</Typography>
                    </Link>
                </Stack>
                <Stack direction="row" gap={1.5} className="ts-scroll">
                    {services.map((svc) => {
                        const raw = svc.serviceImages?.[0];
                        const img = raw ? (raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`) : '/img/banner/hero.jpg';
                        return (
                            <Stack key={svc._id} className="ts-card-mobile" onClick={() => router.push(`/service/${svc._id}`)}>
                                <Box component="div" className="tsm-img" style={{ backgroundImage: `url(${img})` }}>
                                    <Box component="div" className="tsm-badge">🔥 {t('Trending')}</Box>
                                </Box>
                                <Box component="div" className="tsm-info">
                                    <Typography className="tsm-name">{svc.serviceTitle}</Typography>
                                    <Typography className="tsm-price">₩{formatPrice(svc.servicePrice)}~</Typography>
                                </Box>
                            </Stack>
                        );
                    })}
                </Stack>
            </Stack>
        );
    }

    /** PC **/
    return (
        <Stack className="trending-services-section">
            <Stack className="ts-container">
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" className="ts-header">
                    <Stack>
                        <Typography className="ts-title">{t('Trending Services')}</Typography>
                        <Typography className="ts-subtitle">{t('Most loved beauty treatments this week')}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={2}>
                        <Link href="/service">
                            <Stack direction="row" alignItems="center" gap={0.5} className="ts-viewall">
                                <Typography className="tsv-text">{t('View all services')}</Typography>
                                <EastIcon sx={{ fontSize: 16 }} />
                            </Stack>
                        </Link>
                        <Stack direction="row" gap={0.75}>
                            <Box component="div" className="ts-arrow swiper-trending-prev"><WestIcon /></Box>
                            <Box component="div" className="ts-arrow swiper-trending-next"><EastIcon /></Box>
                        </Stack>
                    </Stack>
                </Stack>

                {/* Slider */}
                <Swiper
                    slidesPerView={5}
                    spaceBetween={20}
                    modules={[Autoplay, Navigation]}
                    navigation={{ nextEl: '.swiper-trending-next', prevEl: '.swiper-trending-prev' }}
                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                    loop={services.length > 4}
                >
                    {services.map((svc) => {
                        const raw = svc.serviceImages?.[0];
                        const img = raw ? (raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`) : '/img/banner/hero.jpg';
                        const liked = svc.meLiked?.[0]?.myFavorite;

                        return (
                            <SwiperSlide key={svc._id} className="ts-slide">
                                <Stack className="trending-card">
                                    {/* Image */}
                                    <Box component="div" className="tc-img" style={{ backgroundImage: `url(${img})` }}
                                        onClick={() => router.push(`/service/${svc._id}`)}>
                                        <Stack direction="row" alignItems="center" gap={0.5} className="tc-badge">
                                            <WhatshotIcon sx={{ fontSize: 12 }} />
                                            <Typography className="tcb-text">{t('Trending')}</Typography>
                                        </Stack>

                                        <IconButton className="tc-like" onClick={(e: any) => { e.stopPropagation(); likeHandler(svc._id); }}>
                                            {liked
                                                ? <FavoriteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />
                                                : <FavoriteBorderIcon sx={{ fontSize: 16, color: '#666' }} />}
                                        </IconButton>

                                        <Stack direction="row" justifyContent="space-between" alignItems="center" className="tc-overlay">
                                            {/* ⚠️ TUZATILDI: avval 3 ta bir xil SOXTA defaultUser rasm ko'rsatilardi */}
                                            <Stack direction="row" alignItems="center" gap={0.5}>
                                                <Avatar src={imgUrl(svc.memberData?.memberImage)} sx={{ width: 24, height: 24, border: '2px solid #fff' }} />
                                                <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                                                    {svc.memberData?.memberNick}
                                                </Typography>
                                            </Stack>
                                            <Box component="div" className="tc-views">
                                                {svc.serviceViews >= 1000 ? `${(svc.serviceViews / 1000).toFixed(1)}K+` : `${svc.serviceViews}+`}
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Info */}
                                    <Box component="div" className="tc-info">
                                        <Typography className="tc-name" onClick={() => router.push(`/service/${svc._id}`)}>
                                            {svc.serviceTitle}
                                        </Typography>

                                        {svc.serviceDesc && <Typography className="tc-desc">{svc.serviceDesc}</Typography>}

                                        <Stack direction="row" alignItems="center" gap={1} className="tc-price-row">
                                            <Typography className="tc-price">₩{formatPrice(svc.servicePrice)}~</Typography>
                                            <Box component="div" className="tc-discount">20% OFF</Box>
                                        </Stack>

                                        <Stack direction="row" alignItems="center" gap={1.5} className="tc-stats">
                                            <Stack direction="row" alignItems="center" gap={0.25}>
                                                <RemoveRedEyeIcon sx={{ fontSize: 13, color: '#999' }} />
                                                <Typography className="tcs-num">
                                                    {svc.serviceViews >= 1000 ? `${(svc.serviceViews / 1000).toFixed(1)}K` : svc.serviceViews}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" gap={0.25}>
                                                <FavoriteBorderIcon sx={{ fontSize: 13, color: '#999' }} />
                                                <Typography className="tcs-num">
                                                    {svc.serviceLikes >= 1000 ? `${(svc.serviceLikes / 1000).toFixed(1)}K` : svc.serviceLikes}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" gap={0.25}>
                                                <StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
                                                <Typography className="tcs-rating">
                                                    {svc.serviceRating > 0 ? svc.serviceRating.toFixed(1) : '4.9'}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        <Stack direction="row" gap={1}>
                                            <Button fullWidth className="tc-book-btn" onClick={() => router.push(`/salons/${svc.salonId}`)}>
                                                {t('Book Now')}
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </Stack>
        </Stack>
    );
};

export default TrendingServices;