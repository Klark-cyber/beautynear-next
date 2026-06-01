import React, { useState } from 'react';
import { Stack, Box, Typography, Button, IconButton, Avatar, AvatarGroup } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import StarIcon from '@mui/icons-material/Star';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import AddIcon from '@mui/icons-material/Add';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useMutation } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import { GET_SERVICES } from '../../../apollo/user/query';
import { LIKE_TARGET_SERVICE } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Service } from '../../types/service/service';
import { REACT_APP_API_URL } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';
import { userVar } from '../../../apollo/store';
import useDeviceDetect from '../../hooks/useDeviceDetect';

// Fake specialist avatars for card (in real app, from memberData)
const FAKE_AVATARS = [
    '/img/profile/defaultUser.svg',
    '/img/profile/defaultUser.svg',
    '/img/profile/defaultUser.svg',
];

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
            input: { page: 1, limit: 8, sort: 'serviceLikes', direction: 'DESC', search: {} },
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

    // Mobile: horizontal scroll small cards
    if (device === 'mobile') {
        return (
            <Stack sx={{ py: 4, background: '#fff' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, mb: 2 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{t('Trending Services')}</Typography>
                    <Link href="/services">
                        <Typography sx={{ fontSize: 12, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer' }}>{t('View all')}</Typography>
                    </Link>
                </Stack>
                <Stack direction="row" gap={1.5} sx={{ px: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {services.map((svc) => {
                        const img = svc.serviceImages?.[0] ? `${REACT_APP_API_URL}/${svc.serviceImages[0]}` : '/img/banner/default.jpg';
                        return (
                            <Stack
                                key={svc._id}
                                onClick={() => router.push(`/services/${svc._id}`)}
                                sx={{ flexShrink: 0, width: 130, borderRadius: 3, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', cursor: 'pointer' }}
                            >
                                <Box component="div" sx={{ position: 'relative', height: 110, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                    <Box component="div" sx={{ position: 'absolute', top: 6, left: 6, background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)', borderRadius: 1.5, px: 0.75, py: 0.25 }}>
                                        <Typography sx={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>🔥 {t('Trending')}</Typography>
                                    </Box>
                                </Box>
                                <Box component="div" sx={{ p: 1 }}>
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a', mb: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.serviceTitle}</Typography>
                                    <Typography sx={{ fontSize: 11, color: '#FF4D8D', fontWeight: 600 }}>₩{svc.servicePrice?.toLocaleString()}~</Typography>
                                </Box>
                            </Stack>
                        );
                    })}
                </Stack>
            </Stack>
        );
    }

    // Desktop: big cards with Swiper
    return (
        <Stack sx={{ py: 7, px: 4, background: '#fff' }}>
            <Stack sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box component="div">
                        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', mb: 0.25 }}>{t('Trending Services')}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#888' }}>{t('Most loved beauty treatments this week')}</Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" gap={2}>
                        <Link href="/services">
                            <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#FF4D8D' }}>{t('View all services')}</Typography>
                                <Typography sx={{ color: '#FF4D8D' }}>→</Typography>
                            </Stack>
                        </Link>
                        <Stack direction="row" gap={0.5}>
                            <Box component="div" className="swiper-trending-prev" sx={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,77,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { background: '#FF4D8D', borderColor: '#FF4D8D', '& svg': { color: '#fff' } } }}>
                                <WestIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
                            </Box>
                            <Box component="div" className="swiper-trending-next" sx={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,77,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { background: '#FF4D8D', borderColor: '#FF4D8D', '& svg': { color: '#fff' } } }}>
                                <EastIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
                            </Box>
                        </Stack>
                    </Stack>
                </Stack>

                <Swiper
                    slidesPerView="auto"
                    spaceBetween={20}
                    modules={[Autoplay, Navigation]}
                    navigation={{ nextEl: '.swiper-trending-next', prevEl: '.swiper-trending-prev' }}
                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                >
                    {services.map((svc) => {
                        const img = svc.serviceImages?.[0] ? `${REACT_APP_API_URL}/${svc.serviceImages[0]}` : '/img/banner/default.jpg';
                        const liked = svc.meLiked?.[0]?.myFavorite;

                        return (
                            <SwiperSlide key={svc._id} style={{ width: 280 }}>
                                <Stack
                                    sx={{
                                        width: 280,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        background: '#fff',
                                        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                                        border: '1px solid rgba(255,77,141,0.08)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 48px rgba(255,77,141,0.15)', borderColor: 'rgba(255,77,141,0.2)' },
                                    }}
                                >
                                    {/* Image */}
                                    <Box
                                        component="div"
                                        onClick={() => router.push(`/services/${svc._id}`)}
                                        sx={{ position: 'relative', height: 220, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' }}
                                    >
                                        {/* Trending badge */}
                                        <Box component="div" sx={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)', borderRadius: 2, px: 1.25, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <WhatshotIcon sx={{ fontSize: 12, color: '#fff' }} />
                                            <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{t('Trending')}</Typography>
                                        </Box>

                                        {/* Like */}
                                        <IconButton
                                            onClick={(e: any) => { e.stopPropagation(); likeHandler(svc._id); }}
                                            sx={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', width: 32, height: 32, transition: 'all 0.2s', '&:hover': { background: '#fff', transform: 'scale(1.1)' } }}
                                        >
                                            {liked ? <FavoriteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 16, color: '#666' }} />}
                                        </IconButton>

                                        {/* Specialist avatars + count */}
                                        <Stack direction="row" justifyContent="space-between" alignItems="center"
                                            sx={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                                            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 10, border: '2px solid #fff' } }}>
                                                {FAKE_AVATARS.map((av, i) => <Avatar key={i} src={av} />)}
                                            </AvatarGroup>
                                            <Box component="div" sx={{ background: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1, py: 0.25 }}>
                                                <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>
                                                    {svc.serviceViews >= 1000 ? `${(svc.serviceViews / 1000).toFixed(1)}K+` : `${svc.serviceViews}+`}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Info */}
                                    <Box component="div" sx={{ p: 2 }}>
                                        <Typography
                                            onClick={() => router.push(`/services/${svc._id}`)}
                                            sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 0.25, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', '&:hover': { color: '#FF4D8D' } }}
                                        >
                                            {svc.serviceTitle}
                                        </Typography>

                                        {svc.serviceDesc && (
                                            <Typography sx={{ fontSize: 12, color: '#888', mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {svc.serviceDesc}
                                            </Typography>
                                        )}

                                        {/* Price + discount */}
                                        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
                                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#FF4D8D' }}>
                                                ₩{svc.servicePrice?.toLocaleString()}~
                                            </Typography>
                                            <Box component="div" sx={{ background: 'rgba(255,77,141,0.1)', borderRadius: 1.5, px: 1, py: 0.25 }}>
                                                <Typography sx={{ fontSize: 11, color: '#FF4D8D', fontWeight: 700 }}>20% OFF</Typography>
                                            </Box>
                                        </Stack>

                                        {/* Stats */}
                                        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
                                            <Stack direction="row" alignItems="center" gap={0.25}>
                                                <RemoveRedEyeIcon sx={{ fontSize: 13, color: '#999' }} />
                                                <Typography sx={{ fontSize: 12, color: '#999' }}>
                                                    {svc.serviceViews >= 1000 ? `${(svc.serviceViews / 1000).toFixed(1)}K` : svc.serviceViews}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" gap={0.25}>
                                                <FavoriteBorderIcon sx={{ fontSize: 13, color: '#999' }} />
                                                <Typography sx={{ fontSize: 12, color: '#999' }}>
                                                    {svc.serviceLikes >= 1000 ? `${(svc.serviceLikes / 1000).toFixed(1)}K` : svc.serviceLikes}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" gap={0.25}>
                                                <StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
                                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333' }}>
                                                    {svc.serviceRating > 0 ? svc.serviceRating.toFixed(1) : '4.9'}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        {/* Buttons */}
                                        <Stack direction="row" gap={1}>
                                            <Button
                                                fullWidth
                                                onClick={() => router.push(`/salons/${svc.salonId}`)}
                                                sx={{
                                                    background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
                                                    color: '#fff', fontWeight: 700, fontSize: 12,
                                                    borderRadius: 2.5,
                                                    boxShadow: '0 3px 12px rgba(255,77,141,0.3)',
                                                    transition: 'all 0.25s',
                                                    '&:hover': { transform: 'scale(1.03)', boxShadow: '0 6px 20px rgba(255,77,141,0.4)' },
                                                }}
                                            >
                                                {t('Book Now')}
                                            </Button>
                                            <IconButton
                                                sx={{
                                                    width: 36, height: 36,
                                                    border: '1.5px solid rgba(255,77,141,0.3)',
                                                    borderRadius: 2,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { background: 'rgba(255,77,141,0.08)', borderColor: '#FF4D8D' },
                                                }}
                                            >
                                                <AddIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                                            </IconButton>
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