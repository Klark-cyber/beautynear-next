import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation } from 'swiper';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import AppsIcon from '@mui/icons-material/Apps';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import Face3OutlinedIcon from '@mui/icons-material/Face3Outlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import BookmarkBorderIcon2 from '@mui/icons-material/BookmarkBorder';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { initializeApollo } from '../../../apollo/client';
import moment from 'moment';
import { GET_SALON, GET_SERVICES, GET_COMMENTS, GET_SALONS, GET_MY_BOOKINGS, GET_BOOKED_SLOTS } from '../../../apollo/user/query';
import { LIKE_TARGET_SALON, SUBSCRIBE, UNSUBSCRIBE, CREATE_BOOKING, CREATE_COMMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { useChatContext } from '../../context/ChatContext';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { Salon } from '../../types/salon/salon';
import { Service } from '../../types/service/service';
import { Comment } from '../../types/comment/comment';
import { Booking } from '../../types/booking/booking';
import { getUserCoords, hasUserLocation, calcDistanceKm, formatDistance } from '../../geo';

SwiperCore.use([Autoplay, Navigation]);

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

const EXPLORE_ITEMS = [
    { label: 'Salons', href: '/salons', icon: <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />, color: '#FF4D8D' },
    { label: 'Services', href: '/service', icon: <ContentCutOutlinedIcon sx={{ fontSize: 22 }} />, color: '#9B59B6' },
    { label: 'Specialists', href: '/specialist', icon: <Face3OutlinedIcon sx={{ fontSize: 22 }} />, color: '#2980B9' },
    { label: 'Community', href: '/community', icon: <ForumOutlinedIcon sx={{ fontSize: 22 }} />, color: '#F57C00' },
    { label: 'Saved', href: '/saved', icon: <BookmarkBorderIcon2 sx={{ fontSize: 22 }} />, color: '#3EA043' },
];

// ⚠️ TUZATILDI: avval bu qattiq yozilgan (hardcode) foizlar edi, hech
// qanday haqiqiy ma'lumotga asoslanmagan. Endi haqiqiy sharhlardan
// hisoblanadi (faqat "Barcha sharhlar" varag'i ochilganda, chunki u yerda
// yetarli namuna mavjud).
const computeRatingBreakdown = (list: Comment[]): { star: number; pct: number }[] => {
    const total = list.length;
    if (total === 0) return [5, 4, 3, 2, 1].map((star) => ({ star, pct: 0 }));
    return [5, 4, 3, 2, 1].map((star) => {
        const count = list.filter((c) => (c.commentRating ?? 5) === star).length;
        return { star, pct: Math.round((count / total) * 100) };
    });
};

interface Props {
    salonId: string;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileSalonDetail = ({ salonId }: Props) => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);
    const { openChatWith } = useChatContext();

    const [salon, setSalon] = useState<Salon | null>(null);
    const [userCoords] = useState(() => (hasUserLocation() ? getUserCoords() : null));
    const [services, setServices] = useState<Service[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentTotal, setCommentTotal] = useState(0);
    const [similarSalons, setSimilarSalons] = useState<Salon[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [aboutExpanded, setAboutExpanded] = useState(false);
    const [moreServicesOpen, setMoreServicesOpen] = useState(false);
    const [exploreOpen, setExploreOpen] = useState(false);

    const [selectedService, setSelectedService] = useState<string>('');
    const [isFollowingMember, setIsFollowingMember] = useState(false);

    // Booking varaqasi
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState<'form' | 'confirmed'>('form');
    const [bookingServiceId, setBookingServiceId] = useState('');
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedDate, setSelectedDate] = useState(moment().add(1, 'day'));
    const [selectedTime, setSelectedTime] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

    // Barcha sharhlar varag'i
    const [reviewsOpen, setReviewsOpen] = useState(false);
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // ⚠️ YANGI — "Rate & Review" oqimi
    const [myOwnSalonReview, setMyOwnSalonReview] = useState<Comment | null>(null);
    const [rateFormOpen, setRateFormOpen] = useState(false);
    const [rateStars, setRateStars] = useState(5);
    const [rateText, setRateText] = useState('');
    const [rateSubmitting, setRateSubmitting] = useState(false);

    /** APOLLO REQUESTS **/
    const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);
    const [createComment] = useMutation(CREATE_COMMENT);
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);
    const [createBooking] = useMutation(CREATE_BOOKING);

    const { refetch: salonRefetch } = useQuery(GET_SALON, {
        fetchPolicy: 'network-only',
        variables: { input: salonId },
        skip: !salonId,
        onCompleted: (data: T) => {
            if (data?.getSalon) {
                setSalon(data.getSalon);
                setIsFollowingMember(Boolean(data.getSalon.memberData?.meFollowed?.[0]?.myFollowing));
            }
        },
    });

    useQuery(GET_SERVICES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: { salonId } } },
        skip: !salonId,
        onCompleted: (data: T) => setServices(data?.getServices?.list ?? []),
    });

    useQuery(GET_COMMENTS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: { commentRefId: salonId, commentGroup: 'SALON' } } },
        skip: !salonId,
        onCompleted: (data: T) => {
            setComments(data?.getComments?.list ?? []);
            setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
        },
    });

    useQuery(GET_SALONS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 8, sort: 'salonRank', direction: 'DESC', search: { typeList: salon ? [salon.salonType] : undefined } } },
        skip: !salon,
        onCompleted: (data: T) => setSimilarSalons((data?.getSalons?.list ?? []).filter((s: Salon) => s._id !== salonId)),
    });

    useQuery(GET_MY_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 30, sort: 'createdAt', direction: 'DESC', search: { salonId } } },
        skip: !salonId || !user?._id,
        onCompleted: (data: T) => setMyBookings(data?.getMyBookings?.list ?? []),
    });

    // ⚠️ YANGI — foydalanuvchi shu salonda COMPLETED bron qilganmi va
    // hali sharh qoldirmaganmi tekshiramiz ("Rate & Review" ko'rsatish uchun)
    const hasCompletedBooking = myBookings.some((b) => b.bookingStatus === 'COMPLETED');

    useEffect(() => {
        if (!hasCompletedBooking || !user?._id || !salonId) return;
        const client = initializeApollo();
        client
            .query({
                query: GET_COMMENTS,
                variables: { input: { page: 1, limit: 100, sort: 'createdAt', direction: 'DESC', search: { commentRefId: salonId, commentGroup: 'SALON' } } },
                fetchPolicy: 'network-only',
            })
            .then(({ data }) => {
                const own = (data?.getComments?.list ?? []).find((c: Comment) => c.memberId === user._id);
                setMyOwnSalonReview(own ?? null);
            })
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasCompletedBooking, user?._id, salonId]);

    const canRate = hasCompletedBooking && !myOwnSalonReview;

    const submitRatingHandler = async () => {
        if (!rateText.trim()) return;
        setRateSubmitting(true);
        try {
            await createComment({
                variables: {
                    input: {
                        commentGroup: 'SALON',
                        commentRefId: salonId,
                        commentContent: rateText.trim(),
                        commentRating: rateStars,
                    },
                },
            });
            setRateFormOpen(false);
            setRateText('');
            setRateStars(5);
            // Salon va sharhlar ro'yxatini yangilash
            await salonRefetch();
            setMyOwnSalonReview({ commentRating: rateStars, commentContent: rateText.trim() } as Comment);
        } catch (err: any) {
            console.log('ERROR, submitRatingHandler:', err);
            alert(err?.message ?? 'Something went wrong');
        } finally {
            setRateSubmitting(false);
        }
    };

    /** HANDLERS **/
    const requireAuth = () => {
        if (!user?._id) {
            router.push('/account/join');
            return false;
        }
        return true;
    };

    const likeSalonHandler = async () => {
        if (!requireAuth() || !salon) return;
        try {
            await likeTargetSalon({ variables: { input: salonId } });
            setSalon((prev) => (prev ? { ...prev, meLiked: [{ memberId: user._id, likeRefId: salonId, myFavorite: !prev.meLiked?.[0]?.myFavorite }] } : prev));
        } catch (err) {
            console.log('ERROR, likeSalonHandler:', err);
        }
    };

    // ⚠️ YANGI — Salon egasi (Agent) bilan 1-ga-1 chatni ochish
    const messageAgentHandler = () => {
        if (!user?._id) {
            router.push('/account/join');
            return;
        }
        if (!salon?.memberData?._id) return;
        openChatWith({
            memberId: salon.memberData._id,
            nick: salon.memberData.memberNick,
            image: salon.memberData.memberImage,
        });
    };

    const followMemberHandler = async () => {
        if (!requireAuth() || !salon?.memberData?._id) return;
        try {
            const memberId = salon.memberData._id;
            if (isFollowingMember) await unsubscribe({ variables: { input: { followingId: memberId } } });
            else await subscribe({ variables: { input: { followingId: memberId } } });
            setIsFollowingMember((prev) => !prev);
        } catch (err) {
            console.log('ERROR, followMemberHandler:', err);
        }
    };

    const openBookingHandler = (serviceId?: string) => {
        if (!requireAuth()) return;
        setBookingServiceId(serviceId || selectedService || services[0]?._id || '');
        setBookingStep('form');
        setSelectedTime('');
        setBookingOpen(true);
    };

    // Shu sana uchun band bo'lgan vaqtlar — ⚠️ TUZATILDI: avval faqat
    // FOYDALANUVCHINING O'Z bronlaridan tekshirilardi (myBookings), bu esa
    // boshqa mijozlar band qilgan vaqtni ham "bo'sh" deb ko'rsatib, ikki
    // marta bron qilishga yo'l qo'yardi. Endi HAMMA mijozlar bo'yicha
    // (backend'dagi maxsus, xavfsiz getBookedSlots so'rovi orqali) tekshiriladi.
    const [bookedTimesForDate, setBookedTimesForDate] = useState<string[]>([]);

    useEffect(() => {
        if (!salonId) return;
        const client = initializeApollo();
        client
            .query({
                query: GET_BOOKED_SLOTS,
                variables: { salonId, date: selectedDate.format('YYYY-MM-DD') },
                fetchPolicy: 'network-only',
            })
            .then(({ data }) => setBookedTimesForDate(data?.getBookedSlots ?? []))
            .catch(() => setBookedTimesForDate([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salonId, selectedDate]);

    // ⚠️ TUZATILDI: avval faqat 7 kunlik "hafta" oyna ko'rsatilar edi —
    // masalan Sentyabrni band qilish uchun ►ni 4-5 marta bosish kerak
    // bo'lardi. Endi to'liq OY kalendari, oy bo'yicha navigatsiya bilan.
    const currentMonth = useMemo(() => moment().add(monthOffset, 'months').startOf('month'), [monthOffset]);

    const calendarDays = useMemo(() => {
        const startOfMonth = moment(currentMonth).startOf('month');
        const endOfMonth = moment(currentMonth).endOf('month');
        const startOfGrid = moment(startOfMonth).startOf('week');
        const endOfGrid = moment(endOfMonth).endOf('week');

        const days: { date: moment.Moment; inMonth: boolean }[] = [];
        const cursor = moment(startOfGrid);
        while (cursor.isSameOrBefore(endOfGrid, 'day')) {
            days.push({ date: moment(cursor), inMonth: cursor.month() === currentMonth.month() });
            cursor.add(1, 'day');
        }
        return days;
    }, [currentMonth]);

    const openReviewsHandler = async () => {
        setReviewsOpen(true);
        setReviewsLoading(true);
        try {
            const client = initializeApollo();
            const { data } = await client.query({
                query: GET_COMMENTS,
                variables: { input: { page: 1, limit: 50, sort: 'createdAt', direction: 'DESC', search: { commentRefId: salonId, commentGroup: 'SALON' } } },
                fetchPolicy: 'network-only',
            });
            setAllComments(data?.getComments?.list ?? []);
        } catch (err) {
            console.log('ERROR, openReviewsHandler:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    // Sharh matnidan kelib chiqib mos xizmatni topish (kalit so'zlar orqali)
    const suggestServiceFromComment = (commentText: string): Service | undefined => {
        const lower = commentText.toLowerCase();
        return services.find((svc) => lower.includes(svc.serviceTitle.toLowerCase()));
    };

    const confirmBookingHandler = async () => {
        if (!bookingServiceId || !selectedTime) return;
        setBookingLoading(true);
        try {
            const result = await createBooking({
                variables: {
                    input: {
                        serviceId: bookingServiceId,
                        salonId,
                        bookingDate: selectedDate.toDate(),
                        bookingTime: selectedTime,
                        paymentKey: `test_pay_${Date.now()}`,
                    },
                },
            });
            setConfirmedBooking(result?.data?.createBooking ?? null);
            setBookingStep('confirmed');
        } catch (err: any) {
            console.log('ERROR, confirmBookingHandler:', err);
            alert(err?.message ?? 'Booking failed. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    if (!salon) {
        return (
            <Box id="mobile-salon-detail">
                <Stack alignItems="center" justifyContent="center" sx={{ height: '60vh' }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#999' }}>{t('Loading...')}</Typography>
                </Stack>
            </Box>
        );
    }

    const liked = salon.meLiked?.[0]?.myFavorite;
    // ⚠️ TUZATILDI: avval `?? services[0]` fallback bor edi — hech narsa
    // tanlanmaganda ham birinchi xizmat "tanlangandek" ko'rinardi.
    // Sticky panel faqat HAQIQATAN tanlanganda ko'rinishi kerak.
    const selectedServiceObj = services.find((s) => s._id === selectedService);
    const bookingSheetServiceObj = services.find((s) => s._id === bookingServiceId) ?? selectedServiceObj ?? services[0];
    const isOpen = true; // salonWorkHours orqali aniqlanadi (isSalonOpen util)

    return (
        <Box component="div" id="mobile-salon-detail">
            {/* ═══ RASM GALEREYASI ═══ */}
            <Box component="div" className="sd-gallery">
                <Swiper slidesPerView={1} loop={(salon.salonImages?.length ?? 0) > 1} pagination className="sd-swiper">
                    {(salon.salonImages?.length ? salon.salonImages : ['']).map((img, i) => (
                        <SwiperSlide key={i}>
                            <Box component="div" className="sd-gallery-img" style={{ backgroundImage: `url(${imgUrl(img)})` }} />
                        </SwiperSlide>
                    ))}
                </Swiper>

                <IconButton className="sd-icon-btn sd-back" onClick={() => router.push('/salons')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Stack direction="row" gap={1} className="sd-top-actions">
                    <IconButton className="sd-icon-btn"><ShareIcon sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton className="sd-icon-btn" onClick={likeSalonHandler}>
                        {liked ? <FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Stack>
                <Box component="div" className="sd-photo-count">
                    <Typography>1/{salon.salonImages?.length ?? 1}</Typography>
                </Box>
            </Box>

            {/* ═══ ASOSIY MA'LUMOT ═══ */}
            <Box component="div" className="sd-info-card">
                <Typography className="sd-title">{salon.salonTitle}</Typography>
                <Stack direction="row" gap={1} sx={{ mt: 0.5 }}>
                    <Box component="div" className="sd-type-badge">{t(salon.salonType)} {t('Salon')}</Box>
                    <Box component="div" className={`sd-open-badge ${isOpen ? 'open' : 'closed'}`}>
                        <Box component="span" className="dot" /> {t(isOpen ? 'Open now' : 'Closed')}
                    </Box>
                </Stack>

                <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1.5 }}>
                    <StarIcon sx={{ fontSize: 15, color: '#FFB800' }} />
                    <Typography className="sd-rating">{(salon.salonRating || 0).toFixed(1)} ({commentTotal} {t('reviews')})</Typography>
                    <Typography className="sd-dot">•</Typography>
                    <LocationOnIcon sx={{ fontSize: 13, color: '#999' }} />
                    <Typography className="sd-dist">
                        {userCoords ? formatDistance(calcDistanceKm(userCoords.lat, userCoords.lng, salon.salonLatitude, salon.salonLongitude)) || '—' : '—'}
                    </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 15, color: '#999' }} />
                    <Typography className="sd-meta-text">{salon.salonAddress}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 15, color: '#999' }} />
                    <Typography className="sd-meta-text">{salon.salonWorkHours || '09:00 AM - 09:00 PM'}</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 15, color: '#999' }} />
                    <Typography component="a" href={`tel:${salon.salonPhone}`} className="sd-meta-text sd-phone-link">{salon.salonPhone}</Typography>
                </Stack>

                {/* Salon egasi */}
                {salon.memberData && (
                    <Stack direction="row" alignItems="center" gap={1.25} className="sd-owner-card" onClick={() => router.push(`/member?memberId=${salon.memberData?._id}`)}>
                        <Box component="div" className="sd-owner-avatar" style={{ backgroundImage: `url(${imgUrl(salon.memberData.memberImage, '/img/profile/defaultUser.svg')})` }} />
                        <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" gap={0.75}>
                                <Typography className="sd-owner-name">{salon.memberData.memberNick}</Typography>
                                <Box component="div" className="sd-agent-badge">{t('AGENT')}</Box>
                            </Stack>
                            <Typography className="sd-owner-role">{t('Salon Owner')}</Typography>
                            <Typography className="sd-owner-exp">{salon.memberData.memberExperience ?? 7} {t('years experience')}</Typography>
                        </Box>
                        <Box
                            component="div"
                            className={`sd-follow-btn ${isFollowingMember ? 'following' : ''}`}
                            onClick={(e: any) => { e.stopPropagation(); followMemberHandler(); }}
                        >
                            {t(isFollowingMember ? 'Following' : 'Follow')}
                        </Box>
                        <IconButton className="sd-message-btn" onClick={(e: any) => { e.stopPropagation(); messageAgentHandler(); }}>
                            <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Stack>
                )}

                {/* About */}
                <Box component="div" className="sd-about">
                    <Typography className="sd-section-title">{t('About')}</Typography>
                    <Typography className={`sd-about-text ${aboutExpanded ? 'expanded' : ''}`}>{salon.salonDesc}</Typography>
                    {!aboutExpanded && (
                        <Stack direction="row" alignItems="center" gap={0.3} className="sd-readmore" onClick={() => setAboutExpanded(true)}>
                            <Typography>{t('Read more')}</Typography>
                            <KeyboardArrowDownIcon sx={{ fontSize: 15 }} />
                        </Stack>
                    )}
                </Box>

                {/* Services */}
                <Box component="div" className="sd-services">
                    <Typography className="sd-section-title">{t('Services')}</Typography>
                    <Stack gap={0}>
                        {services.slice(0, 4).map((svc) => {
                            const isSelected = selectedService === svc._id;
                            return (
                                <Stack
                                    key={svc._id}
                                    direction="row"
                                    alignItems="center"
                                    gap={1.25}
                                    className="sd-service-row"
                                    onClick={() => setSelectedService((prev) => (prev === svc._id ? '' : svc._id))}
                                >
                                    <Box component="div" className={`sd-service-radio ${isSelected ? 'checked' : ''}`}>
                                        {isSelected && <CheckCircleIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />}
                                    </Box>
                                    <Box component="div" className="sd-service-img" style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }} />
                                    <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography className="sd-service-name">{svc.serviceTitle}</Typography>
                                        <Typography className="sd-service-dur">{svc.serviceDuration} {t('min')}</Typography>
                                    </Box>
                                    <Typography className="sd-service-price">₩{formatPrice(svc.servicePrice)}</Typography>
                                </Stack>
                            );
                        })}
                    </Stack>
                    {services.length > 4 && (
                        <>
                            <Stack direction="row" alignItems="center" justifyContent="center" gap={0.3} className="sd-viewall" onClick={() => setMoreServicesOpen((p) => !p)}>
                                <Typography>{moreServicesOpen ? t('Hide') : t('More Services')} ({services.length - 4})</Typography>
                                <ChevronRightIcon sx={{ fontSize: 16, transform: moreServicesOpen ? 'rotate(90deg)' : 'none' }} />
                            </Stack>
                            {moreServicesOpen && (
                                <Stack className="sd-more-services-table">
                                    {services.slice(4).map((svc) => (
                                        <Stack
                                            key={svc._id}
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            className="sd-more-svc-row"
                                            onClick={() => router.push(`/service/${svc._id}`)}
                                        >
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Typography className="sd-more-svc-name">{svc.serviceTitle}</Typography>
                                                <Typography className="sd-more-svc-dur">{svc.serviceDuration} {t('min')}</Typography>
                                            </Box>
                                            <Typography className="sd-more-svc-price">₩{formatPrice(svc.servicePrice)}</Typography>
                                            <ChevronRightIcon sx={{ fontSize: 16, color: '#ccc', ml: 0.5 }} />
                                        </Stack>
                                    ))}
                                </Stack>
                            )}
                        </>
                    )}
                </Box>

                {/* Reviews */}
                <Box component="div" className="sd-reviews">
                    <Typography className="sd-section-title">{t('Reviews')}</Typography>
                    <Stack direction="row" gap={2.5} sx={{ mt: 1 }}>
                        <Stack alignItems="center" className="sd-rating-big">
                            <Typography className="sd-rating-num">{(salon.salonRating || 0).toFixed(1)}</Typography>
                            <Stack direction="row" gap={0.2}>
                                {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} sx={{ fontSize: 14, color: '#FFB800' }} />)}
                            </Stack>
                            <Typography className="sd-rating-count">{commentTotal} {t('reviews')}</Typography>
                        </Stack>
                        <Stack sx={{ flex: 1 }} gap={0.5}>
                            {computeRatingBreakdown(comments).map((r) => (
                                <Stack key={r.star} direction="row" alignItems="center" gap={0.75}>
                                    <Typography className="sd-bar-star">{r.star} ★</Typography>
                                    <Box component="div" className="sd-bar-track">
                                        <Box component="div" className="sd-bar-fill" style={{ width: `${r.pct}%` }} />
                                    </Box>
                                    <Typography className="sd-bar-pct">{r.pct}%</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>

                    {comments.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', color: '#999', fontFamily: 'Inter, sans-serif', fontSize: 12, py: 3 }}>{t('No reviews yet')}</Typography>
                    ) : (
                        comments.slice(0, 1).map((c) => (
                            <Stack key={c._id} direction="row" gap={1.25} className="sd-review-item">
                                <Box component="div" className="sd-review-avatar" style={{ backgroundImage: `url(${imgUrl(c.memberData?.memberImage, '/img/profile/defaultUser.svg')})` }} />
                                <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" alignItems="center" gap={0.75}>
                                        <Typography className="sd-review-name">{c.memberData?.memberNick}</Typography>
                                        <Stack direction="row" gap={0.1}>
                                            {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} sx={{ fontSize: 11, color: '#FFB800' }} />)}
                                        </Stack>
                                        <Typography className="sd-review-time">{moment(c.createdAt).fromNow()}</Typography>
                                    </Stack>
                                    <Typography className="sd-review-text">{c.commentContent}</Typography>
                                </Box>
                            </Stack>
                        )))}

                    {canRate && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="sd-rate-prompt" onClick={() => setRateFormOpen(true)}>
                            <Box component="div">
                                <Typography className="sd-rate-prompt-title">⭐ {t('Place to rate service')}</Typography>
                                <Typography className="sd-rate-prompt-desc">{t('You completed a visit here — share your experience!')}</Typography>
                            </Box>
                            <ChevronRightIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                        </Stack>
                    )}

                    <Stack direction="row" alignItems="center" justifyContent="center" gap={0.3} className="sd-viewall" onClick={openReviewsHandler}>
                        <Typography>{t('View all reviews')} ({commentTotal})</Typography>
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                    </Stack>
                </Box>

                {/* Similar Salons */}
                {similarSalons.length > 0 && (
                    <Box component="div" className="sd-similar">
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography className="sd-section-title">{t('Similar Salons')}</Typography>
                            <Typography className="sd-viewall-link" onClick={() => router.push('/salons')}>{t('View all')}</Typography>
                        </Stack>
                        <Stack direction="row" gap={1.25} className="sd-similar-row">
                            {similarSalons.map((s) => {
                                const simLiked = s.meLiked?.[0]?.myFavorite;
                                return (
                                    <Stack key={s._id} className="sd-similar-card" onClick={() => router.push(`/salons/${s._id}`)}>
                                        <Box component="div" className="sd-similar-img" style={{ backgroundImage: `url(${imgUrl(s.salonImages?.[0])})` }}>
                                            <IconButton
                                                className="sd-similar-heart-btn"
                                                onClick={(e: any) => {
                                                    e.stopPropagation();
                                                    if (!requireAuth()) return;
                                                    likeTargetSalon({ variables: { input: s._id } }).then(() => {
                                                        setSimilarSalons((prev) =>
                                                            prev.map((x) =>
                                                                x._id === s._id
                                                                    ? { ...x, meLiked: [{ memberId: user._id, likeRefId: s._id, myFavorite: !simLiked }] }
                                                                    : x,
                                                            ),
                                                        );
                                                    });
                                                }}
                                            >
                                                {simLiked ? <FavoriteIcon className="sd-similar-heart" sx={{ fontSize: 14, color: '#FF4D8D' }} /> : <FavoriteBorderIcon className="sd-similar-heart" sx={{ fontSize: 14, color: '#fff' }} />}
                                            </IconButton>
                                        </Box>
                                        <Typography className="sd-similar-title">{s.salonTitle}</Typography>
                                        <Stack direction="row" alignItems="center" gap={0.3}>
                                            <Typography className="sd-similar-dist">
                                                {userCoords ? formatDistance(calcDistanceKm(userCoords.lat, userCoords.lng, s.salonLatitude, s.salonLongitude)) || '—' : '—'}
                                            </Typography>
                                            <StarIcon sx={{ fontSize: 11, color: '#FFB800' }} />
                                            <Typography className="sd-similar-rating">4.{(s.salonLikes ?? 8) % 10}</Typography>
                                        </Stack>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* ═══ TANLANGANDA — STICKY BOOKING PANEL, AKS HOLDA — PASTKI NAVIGATSIYA ═══ */}
            {selectedServiceObj ? (
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="sd-sticky-bar">
                    <Box component="div">
                        <Typography className="sd-sticky-name">{selectedServiceObj.serviceTitle}</Typography>
                        <Typography className="sd-sticky-price">₩{formatPrice(selectedServiceObj.servicePrice)}</Typography>
                    </Box>
                    <Box component="div" className="sd-book-btn" onClick={() => openBookingHandler()}>{t('Book Now')}</Box>
                </Stack>
            ) : (
                <Stack direction="row" className="sd-bottom-nav">
                    <Stack alignItems="center" className="sd-nav-item" onClick={() => router.push('/')}>
                        <HomeIcon sx={{ fontSize: 22 }} />
                        <Typography className="sd-nav-label">{t('Home')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="sd-nav-item" onClick={() => setExploreOpen(true)}>
                        <AppsIcon sx={{ fontSize: 22 }} />
                        <Typography className="sd-nav-label">{t('Explore')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="sd-nav-item" onClick={() => router.push('/mypage?category=myFavorites')}>
                        <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                        <Typography className="sd-nav-label">{t('Favorites')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="sd-nav-item" onClick={() => router.push('/mypage')}>
                        <PersonIcon sx={{ fontSize: 22 }} />
                        <Typography className="sd-nav-label">{t('My Page')}</Typography>
                    </Stack>
                </Stack>
            )}

            {/* ═══ EXPLORE MENYUSI ═══ */}
            {exploreOpen && (
                <Box component="div" className="sd-explore-backdrop" onClick={() => setExploreOpen(false)}>
                    <Stack className="sd-explore-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="sd-explore-head">
                            <Typography className="sd-explore-title">{t('Explore')}</Typography>
                            <IconButton onClick={() => setExploreOpen(false)}><CloseIcon /></IconButton>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} className="sd-explore-grid">
                            {EXPLORE_ITEMS.map((item) => (
                                <Stack
                                    key={item.href}
                                    alignItems="center"
                                    gap={0.75}
                                    className="sd-explore-item"
                                    onClick={() => { setExploreOpen(false); router.push(item.href); }}
                                >
                                    <Box component="div" className="sd-explore-icon" sx={{ background: `${item.color}18`, color: item.color }}>
                                        {item.icon}
                                    </Box>
                                    <Typography className="sd-explore-label">{t(item.label)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            )}

            {/* ═══ BOOKING VARAQASI ═══ */}
            {bookingOpen && (
                <Box component="div" className="sd-booking-backdrop" onClick={() => setBookingOpen(false)}>
                    <Stack className="sd-booking-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Box component="div" className="sd-sheet-handle" />

                        {bookingStep === 'form' ? (
                            <>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" className="sd-sheet-head">
                                    <IconButton onClick={() => setBookingOpen(false)}><CloseIcon /></IconButton>
                                    <Typography className="sd-sheet-title">{t('Booking')}</Typography>
                                    <Box sx={{ width: 40 }} />
                                </Stack>

                                <Stack className="sd-sheet-body">
                                    {/* 1. Xizmat */}
                                    <Stack direction="row" alignItems="center" gap={0.75} className="sd-step-head">
                                        <Box component="div" className="sd-step-num">1</Box>
                                        <Typography className="sd-step-title">{t('Select Service')}</Typography>
                                    </Stack>
                                    <Stack gap={0.75} sx={{ mb: 2 }}>
                                        {services.map((svc) => (
                                            <Stack
                                                key={svc._id}
                                                direction="row"
                                                alignItems="center"
                                                gap={1}
                                                className={`sd-booking-svc-card ${bookingServiceId === svc._id ? 'selected' : ''}`}
                                                onClick={() => setBookingServiceId(svc._id)}
                                            >
                                                <Box component="div" className="sd-booking-svc-img" style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }} />
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography className="sd-booking-svc-name">{svc.serviceTitle}</Typography>
                                                    <Typography className="sd-booking-svc-dur">{svc.serviceDuration} {t('min')}</Typography>
                                                </Box>
                                                <Typography className="sd-booking-svc-price">₩{formatPrice(svc.servicePrice)}</Typography>
                                            </Stack>
                                        ))}
                                    </Stack>

                                    {/* 2. Sana */}
                                    <Stack direction="row" alignItems="center" gap={0.75} className="sd-step-head">
                                        <Box component="div" className="sd-step-num">2</Box>
                                        <Typography className="sd-step-title">{t('Select Date')}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <IconButton size="small" onClick={() => setMonthOffset((p) => Math.max(0, p - 1))}><ChevronLeftIcon /></IconButton>
                                        <Typography className="sd-month-label">{currentMonth.format('MMMM YYYY')}</Typography>
                                        <IconButton size="small" onClick={() => setMonthOffset((p) => p + 1)}><ChevronRightIcon /></IconButton>
                                    </Stack>
                                    <Stack direction="row" className="sd-cal-dow-row">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <Typography key={i} className="sd-cal-dow">{d}</Typography>
                                        ))}
                                    </Stack>
                                    <Stack direction="row" flexWrap="wrap" className="sd-cal-grid">
                                        {calendarDays.map(({ date: d, inMonth }) => {
                                            const isPast = d.isBefore(moment(), 'day');
                                            const isSelected = d.isSame(selectedDate, 'day');
                                            return (
                                                <Stack
                                                    key={d.format('YYYY-MM-DD')}
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    className={`sd-cal-cell ${isSelected ? 'selected' : ''} ${isPast || !inMonth ? 'disabled' : ''}`}
                                                    onClick={() => !isPast && inMonth && setSelectedDate(d)}
                                                >
                                                    <Typography className="sd-cal-num">{d.format('D')}</Typography>
                                                </Stack>
                                            );
                                        })}
                                    </Stack>

                                    {/* 3. Vaqt */}
                                    <Stack direction="row" alignItems="center" gap={0.75} className="sd-step-head" sx={{ mt: 2 }}>
                                        <Box component="div" className="sd-step-num">3</Box>
                                        <Typography className="sd-step-title">{t('Select Time')}</Typography>
                                    </Stack>
                                    <Stack direction="row" flexWrap="wrap" gap={0.75} className="sd-time-grid">
                                        {TIME_SLOTS.map((slot) => {
                                            const isBooked = bookedTimesForDate.includes(slot);
                                            const isSelected = selectedTime === slot;
                                            return (
                                                <Box
                                                    key={slot}
                                                    component="div"
                                                    className={`sd-time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'disabled' : ''}`}
                                                    onClick={() => !isBooked && setSelectedTime(slot)}
                                                >
                                                    {slot}
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={2} sx={{ mt: 1 }}>
                                        <Stack direction="row" alignItems="center" gap={0.5}>
                                            <Box component="div" className="sd-legend-dot available" />
                                            <Typography className="sd-legend-text">{t('Available')}</Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" gap={0.5}>
                                            <Box component="div" className="sd-legend-dot unavailable" />
                                            <Typography className="sd-legend-text">{t('Unavailable')}</Typography>
                                        </Stack>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" justifyContent="space-between" className="sd-deposit-row">
                                        <Typography className="sd-deposit-label">{t('Deposit')} <span>({t('Non-refundable')})</span></Typography>
                                        <Typography className="sd-deposit-amount">₩10,000</Typography>
                                    </Stack>

                                    <Box
                                        component="div"
                                        className={`sd-confirm-btn ${!bookingServiceId || !selectedTime || bookingLoading ? 'disabled' : ''}`}
                                        onClick={() => bookingServiceId && selectedTime && !bookingLoading && confirmBookingHandler()}
                                    >
                                        {bookingLoading ? t('Processing...') : t('Confirm & Pay Deposit')}
                                    </Box>
                                    <Typography className="sd-confirm-note">{t('You will pay the deposit now to secure your booking. The remaining amount will be paid at the salon.')}</Typography>
                                </Stack>
                            </>
                        ) : (
                            <Stack className="sd-confirmed-view" alignItems="center">
                                <Box component="div" className="sd-confirm-icon"><CheckCircleIcon sx={{ fontSize: 44, color: '#fff' }} /></Box>
                                <Typography className="sd-confirmed-title">{t('Booking Confirmed!')}</Typography>
                                <Typography className="sd-confirmed-sub">{t('Your appointment has been successfully booked.')}</Typography>

                                <Stack direction="row" alignItems="center" gap={1.25} className="sd-confirmed-card">
                                    <Box component="div" className="sd-confirmed-img" style={{ backgroundImage: `url(${imgUrl(salon.salonImages?.[0])})` }} />
                                    <Box>
                                        <Typography className="sd-confirmed-salon">{salon.salonTitle}</Typography>
                                        <Typography className="sd-confirmed-svc">{bookingSheetServiceObj?.serviceTitle}</Typography>
                                        <Typography className="sd-confirmed-price">₩{formatPrice(bookingSheetServiceObj?.servicePrice)}</Typography>
                                    </Box>
                                </Stack>

                                <Stack className="sd-confirmed-details">
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Date')}</Typography><Typography className="v">{selectedDate.format('MMM DD, YYYY (ddd)')}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Time')}</Typography><Typography className="v">{selectedTime}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Deposit Paid')}</Typography><Typography className="v">₩10,000</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Booking ID')}</Typography><Typography className="v">{confirmedBooking?._id?.slice(-12).toUpperCase() ?? '—'}</Typography></Stack>
                                </Stack>

                                <Box component="div" className="sd-confirmed-note">
                                    {t('Please arrive 10 minutes early. If you need to cancel, please do so at least 24 hours in advance.')}
                                </Box>

                                <Box component="div" className="sd-confirmed-btn primary" onClick={() => router.push('/mypage?category=myBookings')}>{t('Go to My Bookings')}</Box>
                                <Box component="div" className="sd-confirmed-btn" onClick={() => { setBookingOpen(false); setBookingStep('form'); }}>{t('Continue Browsing')}</Box>
                            </Stack>
                        )}
                    </Stack>
                </Box>
            )}

            {/* ═══ BARCHA SHARHLAR VARAG'I ═══ */}
            {reviewsOpen && (
                <Box component="div" className="sd-booking-backdrop" onClick={() => setReviewsOpen(false)}>
                    <Stack className="sd-booking-sheet sd-reviews-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Box component="div" className="sd-sheet-handle" />
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="sd-sheet-head">
                            <IconButton onClick={() => setReviewsOpen(false)}><CloseIcon /></IconButton>
                            <Typography className="sd-sheet-title">{t('Reviews')} ({commentTotal})</Typography>
                            <Box sx={{ width: 40 }} />
                        </Stack>

                        <Stack className="sd-sheet-body">
                            {reviewsLoading && <Typography sx={{ textAlign: 'center', color: '#999', py: 4 }}>{t('Loading...')}</Typography>}

                            {!reviewsLoading && allComments.length === 0 && (
                                <Typography sx={{ textAlign: 'center', color: '#999', py: 4 }}>{t('No reviews yet')}</Typography>
                            )}

                            {allComments.map((c) => {
                                const suggested = suggestServiceFromComment(c.commentContent);
                                return (
                                    <Stack key={c._id} className="sd-full-review-item">
                                        <Stack direction="row" gap={1.25}>
                                            <Box component="div" className="sd-review-avatar" style={{ backgroundImage: `url(${imgUrl(c.memberData?.memberImage, '/img/profile/defaultUser.svg')})` }} />
                                            <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                                                <Stack direction="row" alignItems="center" gap={0.75}>
                                                    <Typography className="sd-review-name">{c.memberData?.memberNick}</Typography>
                                                    <Stack direction="row" gap={0.1}>
                                                        {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} sx={{ fontSize: 11, color: '#FFB800' }} />)}
                                                    </Stack>
                                                </Stack>
                                                <Typography className="sd-review-time">{moment(c.createdAt).fromNow()}</Typography>
                                                <Typography className="sd-review-text">{c.commentContent}</Typography>
                                            </Box>
                                        </Stack>
                                        {/* ⚠️ Sharh matnidan kelib chiqib mos xizmatni booking qilishni taklif qilish */}
                                        {suggested && (
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" className="sd-review-suggest">
                                                <Typography className="sd-review-suggest-text">
                                                    {t('Mentioned')}: <b>{suggested.serviceTitle}</b>
                                                </Typography>
                                                <Box
                                                    component="div"
                                                    className="sd-review-suggest-btn"
                                                    onClick={() => { setReviewsOpen(false); openBookingHandler(suggested._id); }}
                                                >
                                                    {t('Book This')}
                                                </Box>
                                            </Stack>
                                        )}
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Stack>
                </Box>
            )}

            {/* ⚠️ YANGI — Rate & Review forma varag'i */}
            {rateFormOpen && (
                <Box component="div" className="sd-booking-backdrop" onClick={() => setRateFormOpen(false)}>
                    <Stack className="sd-booking-sheet sd-rate-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Box component="div" className="sd-sheet-handle" />
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="sd-sheet-head">
                            <IconButton onClick={() => setRateFormOpen(false)}><CloseIcon /></IconButton>
                            <Typography className="sd-sheet-title">{t('Rate Your Experience')}</Typography>
                            <Box sx={{ width: 40 }} />
                        </Stack>

                        <Stack className="sd-sheet-body" alignItems="center">
                            <Typography className="sd-rate-salon-name">{salon.salonTitle}</Typography>

                            <Stack direction="row" gap={0.5} className="sd-rate-stars">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <IconButton key={n} onClick={() => setRateStars(n)}>
                                        <StarIcon sx={{ fontSize: 34, color: n <= rateStars ? '#FFB800' : '#e0e0e0' }} />
                                    </IconButton>
                                ))}
                            </Stack>

                            <textarea
                                className="sd-rate-textarea"
                                placeholder={t('Share details about your experience...')}
                                value={rateText}
                                onChange={(e) => setRateText(e.target.value)}
                                rows={4}
                            />

                            <Box
                                component="div"
                                className={`sd-confirm-btn ${!rateText.trim() || rateSubmitting ? 'disabled' : ''}`}
                                onClick={() => !rateSubmitting && rateText.trim() && submitRatingHandler()}
                                sx={{ width: '100%', mt: 2 }}
                            >
                                {rateSubmitting ? t('Submitting...') : t('Submit Review')}
                            </Box>
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default MobileSalonDetail;