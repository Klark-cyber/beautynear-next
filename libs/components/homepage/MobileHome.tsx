import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, Badge, Menu, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import AppsIcon from '@mui/icons-material/Apps';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import Face3OutlinedIcon from '@mui/icons-material/Face3Outlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Navigation, Autoplay } from 'swiper';
import moment from 'moment';
import { GET_SALONS, GET_SERVICES, GET_BOARD_ARTICLES, GET_NOTICES, GET_MY_BOOKINGS } from '../../../apollo/user/query';
import { LIKE_TARGET_SALON, LIKE_TARGET_SERVICE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../../libs/config';
import { T } from '../../../libs/types/common';
import { Salon } from '../../../libs/types/salon/salon';
import { Service } from '../../../libs/types/service/service';
import { BoardArticle } from '../../../libs/types/board-article/board-article';
import { Notice } from '../../../libs/types/notice/notice';
import { logOut } from '../../auth';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';
import { getUserCoords, hasUserLocation, requestUserLocation, calcDistanceKm, formatDistance } from '../../geo';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const CATEGORIES = [
    { label: 'All', emoji: '✨', value: 'ALL' },
    { label: 'Hair', emoji: '✂️', value: 'HAIR' },
    { label: 'Nails', emoji: '💅', value: 'NAIL' },
    { label: 'Facial', emoji: '🧑', value: 'FACIAL' },
    { label: 'Clinic', emoji: '➕', value: 'CLINIC' },
    { label: 'Massage', emoji: '🌿', value: 'MASSAGE' },
    { label: 'Spa', emoji: '🪷', value: 'SPA' },
    { label: 'Makeup', emoji: '💄', value: 'MAKEUP' },
    { label: 'Brows', emoji: '👁️', value: 'BROWS' },
];

const HOW_IT_WORKS = [
    { step: 1, title: 'Search', desc: 'Find the best salons or clinics near you', icon: '🔍' },
    { step: 2, title: 'Choose & Book', desc: 'Pick your service, check reviews and book', icon: '📅' },
    { step: 3, title: 'Visit & Glow', desc: 'Pay a small deposit and enjoy your beauty time', icon: '✨' },
];

// ⚠️ v8'da modullar ROOT paketdan import qilinadi va SwiperCore.use()
// orqali ro'yxatdan o'tkazilishi SHART
SwiperCore.use([Navigation, Autoplay]);

const AVATARS = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&q=80',
];

const EXPLORE_ITEMS = [
    { label: 'Salons', href: '/salons', icon: <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />, color: '#FF4D8D' },
    { label: 'Services', href: '/service', icon: <ContentCutOutlinedIcon sx={{ fontSize: 22 }} />, color: '#9B59B6' },
    { label: 'Specialists', href: '/specialist', icon: <Face3OutlinedIcon sx={{ fontSize: 22 }} />, color: '#2980B9' },
    { label: 'Community', href: '/community', icon: <ForumOutlinedIcon sx={{ fontSize: 22 }} />, color: '#F57C00' },
    { label: 'Saved', href: '/saved', icon: <BookmarkBorderIcon sx={{ fontSize: 22 }} />, color: '#3EA043' },
    // ⚠️ YANGI — CS markazi (Notice/Event/FAQ'dan xabardor bolish uchun)
    { label: 'Support Center', href: '/cs', icon: <SupportAgentOutlinedIcon sx={{ fontSize: 22 }} />, color: '#16A085' },
    // ⚠️ YANGI — avval /messages sahifasiga hech qanday doimiy havola yoq edi
    { label: 'Messages', href: '/messages', icon: <ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />, color: '#FF4D8D' },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileHome = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [activeCategory, setActiveCategory] = useState('ALL');
    const [exploreOpen, setExploreOpen] = useState(false);
    const [anchorUser, setAnchorUser] = useState<null | HTMLElement>(null);
    // ⚠️ YANGI — avval qongiroqcha shunchaki dekorativ nuqta edi
    const { unreadCount } = useNotificationSocket();

    // ⚠️ YANGI — haqiqiy geolokatsiya: avval "Seoul, Korea" hardcoded,
    // "0.4 km" ham hardcoded edi. Endi GPS orqali haqiqiy joylashuv olinadi.
    const [showGeoBar, setShowGeoBar] = useState(false);
    // ⚠️ YANGI — avval bu joyda har doim SOXTA ma'lumot ko'rsatilardi
    // (moment().add(2, 'days') + tasodifiy salon nomi). Endi haqiqiy,
    // eng yaqin kelayotgan bron ko'rsatiladi.
    const [nearestBooking, setNearestBooking] = useState<any>(null);

    useQuery(GET_MY_BOOKINGS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 20, sort: 'bookingDate', direction: 'ASC', search: {} } },
        skip: !user?._id,
        onCompleted: (data: T) => {
            const list = data?.getMyBookings?.list ?? [];
            const now = moment();
            const upcoming = list
                .filter((b: any) => (b.bookingStatus === 'PENDING' || b.bookingStatus === 'CONFIRMED'))
                .filter((b: any) => {
                    const dt = moment(b.bookingDate);
                    const [h, m] = (b.bookingTime ?? '00:00').split(':').map(Number);
                    dt.set({ hour: h, minute: m });
                    return dt.isAfter(now);
                })
                .sort((a: any, b: any) => moment(a.bookingDate).diff(moment(b.bookingDate)));
            setNearestBooking(upcoming[0] ?? null);
        },
    });
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (hasUserLocation()) {
            setUserCoords(getUserCoords());
        } else {
            setShowGeoBar(true);
        }
    }, []);

    const allowLocationHandler = () => {
        requestUserLocation(() => {
            setUserCoords(getUserCoords());
            setShowGeoBar(false);
        });
    };

    const skipLocationHandler = () => setShowGeoBar(false);

    // ⚠️ YANGI — Desktop Top.tsx bilan bir xil til almashtirish mexanizmi
    const langChoiceHandler = useCallback(
        async (locale: string) => {
            localStorage.setItem('locale', locale);
            await router.push(router.asPath, router.asPath, { locale });
        },
        [router],
    );
    const [salons, setSalons] = useState<Salon[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [clinics, setClinics] = useState<Salon[]>([]);
    const [articles, setArticles] = useState<BoardArticle[]>([]);
    const [events, setEvents] = useState<Notice[]>([]);

    /** APOLLO REQUESTS **/
    const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);
    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);

    useQuery(GET_SALONS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 8, sort: 'salonRank', direction: 'DESC', search: {} } },
        onCompleted: (data: T) => setSalons(data?.getSalons?.list ?? []),
    });

    useQuery(GET_SERVICES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 8, sort: 'serviceRank', direction: 'DESC', search: {} } },
        onCompleted: (data: T) => setServices(data?.getServices?.list ?? []),
    });

    useQuery(GET_SALONS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 8, sort: 'salonViews', direction: 'DESC', search: { typeList: ['CLINIC', 'SKIN'] } } },
        onCompleted: (data: T) => setClinics(data?.getSalons?.list ?? []),
    });

    useQuery(GET_BOARD_ARTICLES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 2, sort: 'createdAt', direction: 'DESC', search: {} } },
        onCompleted: (data: T) => setArticles(data?.getBoardArticles?.list ?? []),
    });

    useQuery(GET_NOTICES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 2, search: { noticeType: 'EVENT' } } },
        onCompleted: (data: T) => setEvents(data?.getNotices?.list ?? []),
    });

    /** HANDLERS **/
    const categoryHandler = (value: string) => {
        setActiveCategory(value);
        if (value === 'ALL') {
            router.push('/salons');
        } else {
            router.push(`/salons?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', direction: 'DESC', search: { typeList: [value] } })}`);
        }
    };

    const likeSalonHandler = async (id: string) => {
        try {
            if (!user?._id) return router.push('/account/join');
            await likeTargetSalon({ variables: { input: id } });
            // ⚠️ TUZATILDI: avval butun ro'yxat refetch orqali almashtirilar
            // edi — bu Swiper'ni qayta hisoblashga majbur qilib, "sakrab"
            // ko'rinishga sabab bo'lardi. Endi faqat shu bitta elementning
            // holati mahalliy (optimistik) yangilanadi.
            setClinics((prev) =>
                prev.map((c) =>
                    c._id === id
                        ? { ...c, meLiked: [{ memberId: user._id, likeRefId: id, myFavorite: !c.meLiked?.[0]?.myFavorite }] }
                        : c,
                ),
            );
        } catch (err) {
            console.log('ERROR, likeSalonHandler:', err);
        }
    };

    const likeServiceHandler = async (id: string) => {
        try {
            if (!user?._id) return router.push('/account/join');
            await likeTargetService({ variables: { input: id } });
            setServices((prev) =>
                prev.map((s) =>
                    s._id === id
                        ? { ...s, meLiked: [{ memberId: user._id, likeRefId: id, myFavorite: !s.meLiked?.[0]?.myFavorite }] }
                        : s,
                ),
            );
        } catch (err) {
            console.log('ERROR, likeServiceHandler:', err);
        }
    };

    return (
        <Box component="div" id="mobile-home">
            {/* ═══ HERO (header endi shu ichida, uzluksiz fon rasmi ustida) ═══ */}
            <Box component="div" className="mh-hero">
                <Box component="div" className="mh-hero-bg" style={{ backgroundImage: `url(/img/mobile/hero-bg.jpg)` }} />
                <Box component="div" className="mh-hero-overlay" />

                {/* Header — endi hero fon rasmi ustida joylashgan */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="mh-header">
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <Typography className="mh-logo-emoji">🌸</Typography>
                        <Typography className="mh-logo-text">BeautyNear</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1.5}>
                        <Stack direction="row" alignItems="center" className="mh-lang-tabs">
                            {['kr', 'en', 'ru'].map((code) => (
                                <Box
                                    key={code}
                                    component="div"
                                    className={`mh-lang-tab ${router.locale === code ? 'active' : ''}`}
                                    onClick={() => langChoiceHandler(code)}
                                >
                                    {code.toUpperCase()}
                                </Box>
                            ))}
                        </Stack>
                        <IconButton onClick={() => router.push('/notifications')} sx={{ p: 0.5 }}>
                            <Badge badgeContent={unreadCount} color="error" max={9}>
                                <NotificationsNoneIcon sx={{ color: '#333', fontSize: 24 }} />
                            </Badge>
                        </IconButton>
                        {user?._id ? (
                            <>
                                <Box
                                    component="div"
                                    className="mh-avatar"
                                    onClick={(e: React.MouseEvent<HTMLElement>) => setAnchorUser(e.currentTarget)}
                                    style={{ backgroundImage: `url(${imgUrl(user?.memberImage, '/img/profile/defaultUser.svg')})` }}
                                />
                                <Menu anchorEl={anchorUser} open={Boolean(anchorUser)} onClose={() => setAnchorUser(null)}>
                                    <MenuItem onClick={() => { setAnchorUser(null); router.push('/mypage'); }}>{t('My Page')}</MenuItem>
                                    <MenuItem onClick={() => { setAnchorUser(null); logOut(); }}>{t('Logout')}</MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Box component="div" className="mh-login-btn" onClick={() => router.push('/account/join')}>
                                {t('Login')}
                            </Box>
                        )}
                    </Stack>
                </Stack>

                <Stack direction="row" alignItems="center" gap={0.5} className="mh-location-pill" onClick={() => router.push('/salons')}>
                    <LocationOnIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
                    <Typography className="mh-location-text">{userCoords ? t('My Location') : t('Seoul, Korea')}</Typography>
                    <KeyboardArrowDownIcon sx={{ fontSize: 16, color: '#888' }} />
                </Stack>

                {/* ⚠️ YANGI — GPS ruxsati so'raluvchi panel (faqat hali ruxsat berilmagan bo'lsa) */}
                {showGeoBar && (
                    <Stack direction="row" alignItems="center" gap={1} className="mh-geo-bar">
                        <MyLocationIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                        <Typography className="mh-geo-text">{t('Allow location access to see salons near you')}</Typography>
                        <Box component="div" className="mh-geo-allow" onClick={allowLocationHandler}>{t('Allow')}</Box>
                        <Box component="div" className="mh-geo-skip" onClick={skipLocationHandler}>{t('Skip')}</Box>
                    </Stack>
                )}

                <Box component="div" className="mh-hero-text">
                    <Typography className="mh-h1">
                        {t('Find Your')}<br />{t('Perfect Beauty Spot')}<br /><span className="pink">{t('Right Around You')}</span>
                    </Typography>
                    <Typography className="mh-hero-sub">{t('Discover premium Korean salons, clinics and beauty experts near your location.')}</Typography>
                </Box>

                <Stack direction="row" alignItems="center" gap={1} className="mh-search-bar" onClick={() => router.push('/salons')}>
                    <SearchIcon sx={{ color: '#aaa', fontSize: 20 }} />
                    <Typography className="mh-search-placeholder">{t('Search salons, clinics or services...')}</Typography>
                    <Box component="div" className="mh-search-btn"><SearchIcon sx={{ color: '#fff', fontSize: 18 }} /></Box>
                </Stack>

                {/* Floating card — eng yaqin kelayotgan bron (haqiqiy) */}
                {nearestBooking ? (
                    <Box component="div" className="mh-float-card mh-float-booking" onClick={() => router.push('/mypage?category=myBookings')}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <CheckCircleIcon sx={{ fontSize: 13, color: '#3EA043' }} />
                            <Typography className="mh-float-label">{t(nearestBooking.bookingStatus === 'CONFIRMED' ? 'Booking Confirmed' : 'Booking Pending')}</Typography>
                        </Stack>
                        <Typography className="mh-float-title">{nearestBooking.salonData?.salonTitle}</Typography>
                        <Typography className="mh-float-sub">{moment(nearestBooking.bookingDate).format('MMM DD, YYYY')} · {nearestBooking.bookingTime}</Typography>
                    </Box>
                ) : (
                    <Box component="div" className="mh-float-card mh-float-empty" onClick={() => router.push('/salons')}>
                        <Typography className="mh-float-empty-emoji">📅</Typography>
                        <Typography className="mh-float-empty-text">{t('No booking yet')}</Typography>
                    </Box>
                )}

                <Stack direction="row" className="mh-stats-row">
                    <Stack direction="row" alignItems="center" gap={0.75} className="mh-stat">
                        <Stack direction="row" className="mh-avatar-row">
                            {AVATARS.map((src, i) => (
                                <Box key={i} component="div" className={`mh-stat-av av${i}`}>
                                    <img src={src} alt={`customer-${i}`} />
                                </Box>
                            ))}
                        </Stack>
                        <Box component="div">
                            <Typography className="mh-stat-num">10K+</Typography>
                            <Typography className="mh-stat-label">{t('Happy Customers')}</Typography>
                        </Box>
                    </Stack>
                    <Stack alignItems="center" className="mh-stat">
                        <Stack direction="row" alignItems="center" gap={0.3}>
                            <StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
                            <Typography className="mh-stat-num">4.9</Typography>
                        </Stack>
                        <Typography className="mh-stat-label">{t('Average Rating')}</Typography>
                    </Stack>
                </Stack>

                {/* Floating card — Special Offer */}
                <Box component="div" className="mh-float-card mh-float-offer" onClick={() => router.push('/salons')}>
                    <Typography className="mh-offer-label">{t('Special Offer')} 🎁</Typography>
                    <Typography className="mh-offer-pct">20% OFF</Typography>
                    <Typography className="mh-offer-sub">{t('For New Customers')}</Typography>
                    <Typography className="mh-offer-cta">{t('Claim Now')} →</Typography>
                </Box>
            </Box>

            {/* ═══ CATEGORY CHIPS ═══ */}
            <Stack direction="row" className="mh-category-row">
                {CATEGORIES.map((cat) => (
                    <Stack key={cat.value} alignItems="center" gap={0.5} className="mh-cat-item" onClick={() => categoryHandler(cat.value)}>
                        <Box component="div" className={`mh-cat-circle ${activeCategory === cat.value ? 'active' : ''}`}>
                            <Typography className="mh-cat-emoji">{cat.emoji}</Typography>
                        </Box>
                        <Typography className={`mh-cat-label ${activeCategory === cat.value ? 'active' : ''}`}>{t(cat.label)}</Typography>
                    </Stack>
                ))}
            </Stack>

            {/* ═══ VIDEO BANNER — haqiqiy, avtomatik ijro etiluvchi video ═══ */}
            <Box component="div" className="mh-video-banner">
                <video
                    className="mh-video-el"
                    src="/video/salon-promo.mp4"
                    poster="/img/banner/hero.jpg"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
                />
                <Box component="div" className="mh-video-overlay" />
                <Typography className="mh-video-eyebrow">{t('FEATURED SALONS')}</Typography>
                <Typography className="mh-video-title">{t('Beauty in Motion')}</Typography>
                <Typography className="mh-video-sub">{t('Watch real transformations from salons near you')}</Typography>
            </Box>

            {/* ═══ HOW IT WORKS ═══ */}
            <Box component="div" className="mh-section">
                <Stack direction="row" alignItems="center" className="mh-section-head">
                    <Typography className="mh-section-title">{t('How It Works')}</Typography>
                </Stack>
                <Stack direction="row" className="mh-hiw-row">
                    {HOW_IT_WORKS.map((step) => (
                        <Stack key={step.step} className="mh-hiw-card">
                            <Box component="div" className="mh-hiw-num">{step.step}</Box>
                            <Typography className="mh-hiw-icon">{step.icon}</Typography>
                            <Typography className="mh-hiw-title">{t(step.title)}</Typography>
                            <Typography className="mh-hiw-desc">{t(step.desc)}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Box>

            {/* ═══ TRENDING SERVICES ═══ */}
            <Box component="div" className="mh-section">
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="mh-section-head">
                    <Typography className="mh-section-title">{t('Trending Services')}</Typography>
                    <Typography className="mh-view-all" onClick={() => router.push('/service')}>{t('View All')}</Typography>
                </Stack>
                <Swiper
                    slidesPerView={2.3}
                    spaceBetween={12}
                    loop
                    autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    className="mh-swiper"
                >
                    {services.map((svc) => {
                        const liked = svc.meLiked?.[0]?.myFavorite;
                        return (
                            <SwiperSlide key={svc._id}>
                                <Stack className="mh-ts-card" onClick={() => router.push(`/service/${svc._id}`)}>
                                    <Box component="div" className="mh-ts-img" style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }}>
                                        <Box component="div" className="mh-ts-badge">{t('Trending')}</Box>
                                        <IconButton className="mh-ts-like" onClick={(e: any) => { e.stopPropagation(); likeServiceHandler(svc._id); }}>
                                            {liked ? <FavoriteIcon className="mh-heart-icon liked" sx={{ fontSize: 15, color: '#FF4D8D' }} /> : <FavoriteBorderIcon className="mh-heart-icon" sx={{ fontSize: 15, color: '#fff' }} />}
                                        </IconButton>
                                    </Box>
                                    <Typography className="mh-ts-title">{svc.serviceTitle}</Typography>
                                    <Typography className="mh-ts-desc">{svc.serviceDesc}</Typography>
                                    <Typography className="mh-ts-price">₩{formatPrice(svc.servicePrice)}</Typography>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <StarIcon sx={{ fontSize: 11, color: '#FFB800' }} />
                                        <Typography className="mh-ts-rating">{(svc.serviceRating ?? 4.5).toFixed(1)}</Typography>
                                    </Stack>
                                </Stack>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </Box>

            {/* ═══ FEATURED CLINICS ═══ */}
            <Box component="div" className="mh-section">
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="mh-section-head">
                    <Typography className="mh-section-title">{t('Featured Clinics')}</Typography>
                    <Typography className="mh-view-all" onClick={() => router.push('/salons?input=' + JSON.stringify({ page: 1, limit: 9, search: { typeList: ['CLINIC', 'SKIN'] } }))}>{t('View All')}</Typography>
                </Stack>
                <Swiper
                    slidesPerView={2.3}
                    spaceBetween={12}
                    loop
                    autoplay={{ delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    className="mh-swiper"
                >
                    {clinics.map((clinic) => {
                        const liked = clinic.meLiked?.[0]?.myFavorite;
                        return (
                            <SwiperSlide key={clinic._id}>
                                <Stack className="mh-fc-card" onClick={() => router.push(`/salons/${clinic._id}`)}>
                                    <Box component="div" className="mh-fc-img" style={{ backgroundImage: `url(${imgUrl(clinic.salonImages?.[0])})` }}>
                                        <Box component="div" className="mh-fc-open">{t('Open')}</Box>
                                        <IconButton className="mh-fc-like" onClick={(e: any) => { e.stopPropagation(); likeSalonHandler(clinic._id); }}>
                                            {liked ? <FavoriteIcon className="mh-heart-icon liked" sx={{ fontSize: 15, color: '#FF4D8D' }} /> : <FavoriteBorderIcon className="mh-heart-icon" sx={{ fontSize: 15, color: '#fff' }} />}
                                        </IconButton>
                                    </Box>
                                    <Typography className="mh-fc-title">{clinic.salonTitle}</Typography>
                                    <Typography className="mh-fc-desc">{clinic.salonAddress}</Typography>
                                    <Stack direction="row" alignItems="center" gap={0.5} className="mh-fc-meta">
                                        <StarIcon sx={{ fontSize: 11, color: '#FFB800' }} />
                                        <Typography className="mh-fc-rating">4.9</Typography>
                                        <Typography className="mh-fc-dot">·</Typography>
                                        <Typography className="mh-fc-dist">0.3 km</Typography>
                                    </Stack>
                                    <Box component="div" className="mh-fc-book">{t('Book Now')}</Box>
                                </Stack>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </Box>

            {/* ═══ POPULAR SALONS ═══ */}
            <Box component="div" className="mh-section">
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="mh-section-head">
                    <Typography className="mh-section-title">{t('Popular Salons Near You')}</Typography>
                    <Typography className="mh-view-all" onClick={() => router.push('/salons')}>{t('View All')}</Typography>
                </Stack>
                <Swiper
                    slidesPerView={2.3}
                    spaceBetween={12}
                    loop
                    autoplay={{ delay: 4900, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    className="mh-swiper"
                >
                    {salons.map((salon) => (
                        <SwiperSlide key={salon._id}>
                            <Stack className="mh-ps-card" onClick={() => router.push(`/salons/${salon._id}`)}>
                                <Box component="div" className="mh-ps-img" style={{ backgroundImage: `url(${imgUrl(salon.salonImages?.[0])})` }}>
                                    <Box component="div" className="mh-ps-open">{t('Open')}</Box>
                                </Box>
                                <Typography className="mh-ps-title">{salon.salonTitle}</Typography>
                                <Typography className="mh-ps-desc">{salon.salonAddress}</Typography>
                                <Stack direction="row" alignItems="center" gap={0.5} className="mh-ps-meta">
                                    <StarIcon sx={{ fontSize: 11, color: '#FFB800' }} />
                                    <Typography className="mh-ps-rating">{(salon.salonRating ?? 0).toFixed(1)}</Typography>
                                    <Typography className="mh-ps-dot">·</Typography>
                                    <Typography className="mh-ps-dist">
                                        {userCoords ? formatDistance(calcDistanceKm(userCoords.lat, userCoords.lng, salon.salonLatitude, salon.salonLongitude)) || '—' : '—'}
                                    </Typography>
                                </Stack>
                                <Typography className="mh-ps-deposit">{t('Deposit')} ₩{formatPrice(salon.depositAmount ?? 10000)}</Typography>
                            </Stack>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </Box>

            {/* ═══ COMMUNITY + EVENTS (2 ustunli) ═══ */}
            <Box component="div" className="mh-section">
                <Stack direction="row" gap={1.5} className="mh-two-col">
                    <Box component="div" className="mh-col">
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="mh-section-head">
                            <Typography className="mh-section-title sm">{t('Community Highlights')}</Typography>
                            <Typography className="mh-view-all sm" onClick={() => router.push('/community')}>{t('View All')}</Typography>
                        </Stack>
                        {articles.map((a) => (
                            <Stack key={a._id} direction="row" gap={1} className="mh-community-item" onClick={() => router.push(`/community/detail?id=${a._id}`)}>
                                <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" alignItems="center" gap={0.5}>
                                        <Box component="div" className="mh-avatar-sm" style={{ backgroundImage: `url(${imgUrl(a.memberData?.memberImage, '/img/profile/defaultUser.svg')})` }} />
                                        <Typography className="mh-community-name">{a.memberData?.memberNick}</Typography>
                                    </Stack>
                                    <Typography className="mh-community-text">{a.articleContent}</Typography>
                                </Box>
                                <Box component="div" className="mh-community-img" style={{ backgroundImage: `url(${imgUrl(a.articleImage)})` }} />
                            </Stack>
                        ))}
                    </Box>

                    <Box component="div" className="mh-col">
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="mh-section-head">
                            <Typography className="mh-section-title sm">{t('Upcoming Events')}</Typography>
                            <Typography className="mh-view-all sm" onClick={() => router.push('/cs')}>{t('View All')}</Typography>
                        </Stack>
                        {events.map((ev) => (
                            <Stack key={ev._id} direction="row" gap={1} className="mh-event-item">
                                <Stack alignItems="center" className="mh-event-date">
                                    <Typography className="mh-event-day">{moment(ev.createdAt).format('DD')}</Typography>
                                    <Typography className="mh-event-month">{moment(ev.createdAt).format('MMM').toUpperCase()}</Typography>
                                </Stack>
                                <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography className="mh-event-title">{ev.noticeTitle}</Typography>
                                    <Typography className="mh-event-desc">{ev.noticeContent}</Typography>
                                    <Box component="div" className="mh-event-btn">{t('Join Event')}</Box>
                                </Box>
                            </Stack>
                        ))}
                    </Box>
                </Stack>
            </Box>

            {/* ═══ APP DOWNLOAD ═══ */}
            <Box component="div" className="mh-app-banner">
                <Box component="div" className="mh-app-left">
                    <Typography className="mh-app-title">{t('Beauty in your pocket')}</Typography>
                    <Typography className="mh-app-sub">{t('Download the app and book your beauty anytime, anywhere.')}</Typography>
                    <Stack gap={0.75} className="mh-app-buttons">
                        <Box component="div" className="mh-app-btn">🍎 {t('App Store')}</Box>
                        <Box component="div" className="mh-app-btn">▶ {t('Google Play')}</Box>
                    </Stack>
                </Box>

                {/* Telefon mockuplari — BeautyNear kontenti bilan */}
                <Box component="div" className="mh-app-phones">
                    <Box component="div" className="mh-phone mh-phone-back">
                        <Box component="div" className="mh-phone-notch" />
                        <Stack className="mh-phone-screen">
                            <Typography className="mh-phone-greet">{t('Hello, Jessica')} 👋</Typography>
                            <Box component="div" className="mh-phone-search" />
                            <Stack direction="row" gap={0.5}>
                                <Box component="div" className="mh-phone-card" />
                                <Box component="div" className="mh-phone-card" />
                            </Stack>
                        </Stack>
                    </Box>
                    <Box component="div" className="mh-phone mh-phone-front">
                        <Box component="div" className="mh-phone-notch" />
                        <Stack className="mh-phone-screen">
                            <Typography className="mh-phone-greet">{t('Bookings')}</Typography>
                            <Box component="div" className="mh-phone-booking-card">
                                <Typography className="mh-phone-booking-title">Glow Skin Clinic</Typography>
                                <Typography className="mh-phone-booking-time">May 24, 2:00 PM</Typography>
                            </Box>
                            <Box component="div" className="mh-phone-booking-card">
                                <Typography className="mh-phone-booking-title">Chic Salon</Typography>
                                <Typography className="mh-phone-booking-time">May 26, 11:00 AM</Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* ═══ BOTTOM NAV ═══ */}
            <Stack direction="row" className="mh-bottom-nav">
                <Stack alignItems="center" className="mh-nav-item active">
                    <HomeIcon sx={{ fontSize: 22 }} />
                    <Typography className="mh-nav-label">{t('Home')}</Typography>
                </Stack>
                <Stack alignItems="center" className="mh-nav-item" onClick={() => setExploreOpen(true)}>
                    <AppsIcon sx={{ fontSize: 22 }} />
                    <Typography className="mh-nav-label">{t('Explore')}</Typography>
                </Stack>
                <Stack alignItems="center" className="mh-nav-item" onClick={() => router.push('/mypage?category=myFavorites')}>
                    <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                    <Typography className="mh-nav-label">{t('Favorites')}</Typography>
                </Stack>
                <Stack alignItems="center" className="mh-nav-item" onClick={() => router.push('/mypage')}>
                    <PersonIcon sx={{ fontSize: 22 }} />
                    <Typography className="mh-nav-label">{t('My Page')}</Typography>
                </Stack>
            </Stack>

            {/* ═══ EXPLORE MENYUSI (pastdan chiquvchi) ═══ */}
            {exploreOpen && (
                <Box component="div" className="mh-explore-backdrop" onClick={() => setExploreOpen(false)}>
                    <Stack className="mh-explore-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="mh-explore-head">
                            <Typography className="mh-explore-title">{t('Explore')}</Typography>
                            <IconButton onClick={() => setExploreOpen(false)}><CloseIcon /></IconButton>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} className="mh-explore-grid">
                            {EXPLORE_ITEMS.map((item) => (
                                <Stack
                                    key={item.href}
                                    alignItems="center"
                                    gap={0.75}
                                    className="mh-explore-item"
                                    onClick={() => { setExploreOpen(false); router.push(item.href); }}
                                >
                                    <Box component="div" className="mh-explore-icon" sx={{ background: `${item.color}18`, color: item.color }}>
                                        {item.icon}
                                    </Box>
                                    <Typography className="mh-explore-label">{t(item.label)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default MobileHome;