import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import AppsIcon from '@mui/icons-material/Apps';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import Face3OutlinedIcon from '@mui/icons-material/Face3Outlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_MEMBER, GET_SALONS, GET_SERVICES, GET_AGENTS, GET_BOOKED_SLOTS, GET_MY_BOOKINGS, GET_COMMENTS } from '../../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE, CREATE_BOOKING } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { useChatContext } from '../../context/ChatContext';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { initializeApollo } from '../../../apollo/client';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
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
    { label: 'Saved', href: '/saved', icon: <BookmarkBorderIcon sx={{ fontSize: 22 }} />, color: '#3EA043' },
];

interface Props {
    memberId: string;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileSpecialistDetail = ({ memberId }: Props) => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);
    const { openChatWith } = useChatContext();

    const [specialist, setSpecialist] = useState<any>(null);
    const [salons, setSalons] = useState<any[]>([]);
    // ⚠️ birinchi salon — booking va statistikada "asosiy" sifatida ishlatiladi
    const salon = salons[0] ?? null;
    const [services, setServices] = useState<any[]>([]);
    const [similarSpecialists, setSimilarSpecialists] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [commentTotal, setCommentTotal] = useState(0);
    const [aboutExpanded, setAboutExpanded] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    // ⚠️ tanlangan xizmat qaysi salonga tegishli bo'lsa, o'sha ishlatiladi
    // (avval har doim BIRINCHI salon ishlatilardi — bir nechta salonli
    // specialist'lar uchun xato edi)
    const selectedServiceObjEarly = services.find((s) => s._id === selectedService);
    const activeSalonId = selectedServiceObjEarly?.salonId ?? salon?._id;
    const [exploreOpen, setExploreOpen] = useState(false);
    const [reviewsOpen, setReviewsOpen] = useState(false);
    const [allComments, setAllComments] = useState<any[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Booking
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState<'form' | 'confirmed'>('form');
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedDate, setSelectedDate] = useState(moment().add(1, 'day'));
    const [selectedTime, setSelectedTime] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
    const [bookedTimesForDate, setBookedTimesForDate] = useState<string[]>([]);

    /** APOLLO REQUESTS **/
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);
    const [createBooking] = useMutation(CREATE_BOOKING);

    useQuery(GET_MEMBER, {
        fetchPolicy: 'network-only',
        variables: { input: memberId },
        skip: !memberId,
        onCompleted: (data: T) => {
            if (data?.getMember) {
                setSpecialist(data.getMember);
                setIsFollowing(Boolean(data.getMember.meFollowed?.[0]?.myFollowing));
            }
        },
    });

    // ⚠️ TUZATILDI: avval limit:1 edi — agar specialist bir nechta salonga
    // ega bo'lsa (masalan Justin — 4 ta), faqat 1 tasi ko'rinardi
    useQuery(GET_SALONS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 8, sort: 'createdAt', direction: 'DESC', search: { memberId } } },
        skip: !memberId,
        onCompleted: (data: T) => setSalons(data?.getSalons?.list ?? []),
    });

    // Barcha salonlarga tegishli xizmatlarni yig'amiz (booking uchun)
    useEffect(() => {
        if (salons.length === 0) return;
        const client = initializeApollo();
        Promise.all(
            salons.map((s) =>
                client
                    .query({
                        query: GET_SERVICES,
                        variables: { input: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: { salonId: s._id } } },
                        fetchPolicy: 'network-only',
                    })
                    .then((res) => res.data?.getServices?.list ?? [])
                    .catch(() => []),
            ),
        ).then((lists) => setServices(lists.flat()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salons]);

    useQuery(GET_AGENTS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 4, sort: 'createdAt', direction: 'DESC', search: specialist ? { memberSpecialty: specialist.memberSpecialty } : undefined } },
        skip: !specialist,
        onCompleted: (data: T) => setSimilarSpecialists((data?.getAgents?.list ?? []).filter((s: T) => s._id !== memberId)),
    });

    // ⚠️ TUZATILDI: avval SALON sharhlaridan olinar edi — noto'g'ri edi,
    // backend'da specialist uchun ALOHIDA CommentGroup.MEMBER mavjud ekan
    const [memberRating, setMemberRating] = useState(0);
    useQuery(GET_COMMENTS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: { commentRefId: memberId, commentGroup: 'MEMBER' } } },
        skip: !memberId,
        onCompleted: (data: T) => {
            setComments(data?.getComments?.list ?? []);
            setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
        },
    });

    // Haqiqiy o'rtacha reytingni hisoblaymiz (barcha Justin'ga tegishli
    // sharhlar bo'yicha, faqat preview uchun yuklangan 3 tasi emas)
    useEffect(() => {
        if (!memberId) return;
        const client = initializeApollo();
        client
            .query({
                query: GET_COMMENTS,
                variables: { input: { page: 1, limit: 200, sort: 'createdAt', direction: 'DESC', search: { commentRefId: memberId, commentGroup: 'MEMBER' } } },
                fetchPolicy: 'network-only',
            })
            .then(({ data }) => {
                const list = data?.getComments?.list ?? [];
                if (list.length === 0) return setMemberRating(0);
                const avg = list.reduce((sum: number, c: any) => sum + (c.commentRating ?? 5), 0) / list.length;
                setMemberRating(Math.round(avg * 10) / 10);
            })
            .catch(() => setMemberRating(0));
    }, [memberId]);

    // Band vaqtlar (hamma mijozlar bo'yicha, xavfsiz)
    useEffect(() => {
        if (!activeSalonId) return;
        const client = initializeApollo();
        client
            .query({
                query: GET_BOOKED_SLOTS,
                variables: { salonId: activeSalonId, date: selectedDate.format('YYYY-MM-DD') },
                fetchPolicy: 'network-only',
            })
            .then(({ data }) => setBookedTimesForDate(data?.getBookedSlots ?? []))
            .catch(() => setBookedTimesForDate([]));
    }, [activeSalonId, selectedDate]);

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

    /** HANDLERS **/
    const requireAuth = () => {
        if (!user?._id) {
            router.push('/account/join');
            return false;
        }
        return true;
    };

    // ⚠️ YANGI — avval Share tugmasi hech narsa qilmasdi. Endi mobil
    // brauzerlarning o'zida tayyor bo'lgan Web Share API ishlatiladi
    // (qo'llab-quvvatlamasa — havolani nusxalash bilan zaxira variant).
    const shareHandler = async () => {
        const shareUrl = window.location.href;
        const shareData = {
            title: specialist?.memberNick ?? t('Specialist'),
            text: t('Check out this specialist on BeautyNear!'),
            url: shareUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl);
                alert(t('Link copied to clipboard!'));
            } else {
                // ⚠️ YANGI — HTTP (xavfsiz bo'lmagan) muhitda navigator.share
                // VA navigator.clipboard ikkalasi ham mavjud bo'lmaydi (undefined),
                // shuning uchun oldingi kod HECH QANDAY xabarsiz jim qolardi.
                // window.prompt — xavfsizlik talab qilmaydigan yagona zaxira.
                window.prompt(t('Copy this link:'), shareUrl);
            }
        } catch (err) {
            console.log('ERROR, shareHandler:', err);
            window.prompt(t('Copy this link:'), shareUrl);
        }
    };

    // ⚠️ YANGI — 1-ga-1 shaxsiy chatni ochish (Desktop bilan bir xil)
    const messageHandler = () => {
        if (!user?._id) {
            router.push('/account/join');
            return;
        }
        if (!specialist?._id) return;
        openChatWith({
            memberId: specialist._id,
            nick: specialist.memberNick,
            image: specialist.memberImage,
        });
    };

    const followHandler = async () => {
        if (!requireAuth()) return;
        try {
            if (isFollowing) await unsubscribe({ variables: { input: { followingId: memberId } } });
            else await subscribe({ variables: { input: { followingId: memberId } } });
            setIsFollowing((prev) => !prev);
            // ⚠️ TUZATILDI: avval faqat tugma holati o'zgarar, "Followers"
            // soni sahifani qayta yuklamaguncha eskicha qolib qolardi
            setSpecialist((prev: any) =>
                prev ? { ...prev, memberFollowers: (prev.memberFollowers ?? 0) + (isFollowing ? -1 : 1) } : prev,
            );
        } catch (err) {
            console.log('ERROR, followHandler:', err);
        }
    };

    const selectedServiceObj = selectedServiceObjEarly;

    const openReviewsHandler = async () => {
        setReviewsOpen(true);
        setReviewsLoading(true);
        try {
            const client = initializeApollo();
            const { data } = await client.query({
                query: GET_COMMENTS,
                variables: { input: { page: 1, limit: 50, sort: 'createdAt', direction: 'DESC', search: { commentRefId: memberId, commentGroup: 'MEMBER' } } },
                fetchPolicy: 'network-only',
            });
            setAllComments(data?.getComments?.list ?? []);
        } catch (err) {
            console.log('ERROR, openReviewsHandler:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    const confirmBookingHandler = async () => {
        if (!selectedTime || !selectedServiceObj) return;
        setBookingLoading(true);
        try {
            const result = await createBooking({
                variables: {
                    input: {
                        serviceId: selectedServiceObj._id,
                        salonId: selectedServiceObj.salonId, // ⚠️ TUZATILDI: xizmatning haqiqiy saloni
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

    if (!specialist) {
        return (
            <Box id="mobile-specialist-detail">
                <Stack alignItems="center" justifyContent="center" sx={{ height: '60vh' }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#999' }}>{t('Loading...')}</Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box component="div" id="mobile-specialist-detail">
            {/* ═══ HERO ═══ */}
            <Box component="div" className="spd-hero">
                <Box component="div" className="spd-hero-bg" style={{ backgroundImage: `url(${imgUrl(salon?.salonImages?.[0], '/img/banner/hero.jpg')})` }} />
                <Box component="div" className="spd-hero-overlay" />
                <IconButton className="spd-icon-btn spd-back" onClick={() => router.push('/specialist')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton className="spd-icon-btn spd-share" onClick={shareHandler}>
                    <ShareIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Box component="div" className="spd-avatar" style={{ backgroundImage: `url(${imgUrl(specialist.memberImage)})` }} />
            </Box>

            {/* ═══ PROFIL MA'LUMOTI ═══ */}
            <Stack alignItems="center" className="spd-profile">
                <Box component="div" className="spd-agent-badge">{t('AGENT')}</Box>
                <Typography className="spd-name">{specialist.memberNick}</Typography>
                <Typography className="spd-specialty">{(specialist.memberSpecialty ?? []).join(' • ')}</Typography>
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon key={n} sx={{ fontSize: 14, color: n <= Math.round(memberRating) ? '#FFB800' : '#e0e0e0' }} />
                    ))}
                    <Typography className="spd-rating-text">{memberRating.toFixed(1)} ({t('from')} {commentTotal} {t('reviews')})</Typography>
                </Stack>
            </Stack>

            {/* ═══ STATISTIKA ═══ */}
            <Stack direction="row" className="spd-stats-row">
                <Stack alignItems="center" className="spd-stat-box">
                    <PeopleAltOutlinedIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
                    <Typography className="spd-stat-num">{((specialist.memberFollowers ?? 0) / 1000).toFixed(1)}K</Typography>
                    <Typography className="spd-stat-label">{t('Followers')}</Typography>
                </Stack>
                <Stack alignItems="center" className="spd-stat-box">
                    <StorefrontOutlinedIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
                    <Typography className="spd-stat-num">{salons.length}</Typography>
                    <Typography className="spd-stat-label">{t('Salon')}</Typography>
                </Stack>
                <Stack alignItems="center" className="spd-stat-box">
                    <StarIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
                    <Typography className="spd-stat-num">{memberRating.toFixed(1)}</Typography>
                    <Typography className="spd-stat-label">{t('Rating')}</Typography>
                </Stack>
                <Stack alignItems="center" className="spd-stat-box">
                    <AccessTimeIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
                    <Typography className="spd-stat-num">{specialist.memberExperience ?? 0}</Typography>
                    <Typography className="spd-stat-label">{t('Years Exp.')}</Typography>
                </Stack>
            </Stack>

            {/* ═══ FOLLOW + MESSAGE TUGMALARI ═══ */}
            <Stack direction="row" gap={1} sx={{ margin: '16px 20px 0' }}>
                <Box component="div" className={`spd-follow-btn ${isFollowing ? 'following' : ''}`} onClick={followHandler} sx={{ flex: 1 }}>
                    {isFollowing ? t('Following') : `+ ${t('Follow')}`}
                </Box>
                <IconButton className="spd-message-btn" onClick={messageHandler}>
                    <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </Stack>

            {/* ═══ ABOUT ME ═══ */}
            {specialist.memberDesc && (
                <Box component="div" className="spd-about">
                    <Typography className="spd-section-title">{t('About Me')}</Typography>
                    <Typography className={`spd-about-text ${aboutExpanded ? 'expanded' : ''}`}>{specialist.memberDesc}</Typography>
                    {!aboutExpanded && (
                        <Typography className="spd-readmore" onClick={() => setAboutExpanded(true)}>{t('Read more')}</Typography>
                    )}
                </Box>
            )}

            {/* ═══ MY SALON(S) ═══ */}
            {salons.length > 0 && (
                <Box component="div" className="spd-section">
                    <Typography className="spd-section-title">{t(salons.length > 1 ? 'My Salons' : 'My Salon')}</Typography>
                    <Stack gap={1.25} sx={{ mt: 1 }}>
                        {salons.map((s) => (
                            <Stack key={s._id} className="spd-salon-card" onClick={() => router.push(`/salons/${s._id}`)}>
                                <Box component="div" className="spd-salon-img" style={{ backgroundImage: `url(${imgUrl(s.salonImages?.[0], '/img/banner/hero.jpg')})` }} />
                                <Stack direction="row" alignItems="center" justifyContent="space-between" className="spd-salon-info">
                                    <Box sx={{ minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <Typography className="spd-salon-name">{s.salonTitle}</Typography>
                                            <Box component="div" className="spd-salon-open">{t('Open')}</Box>
                                        </Stack>
                                        <Typography className="spd-salon-addr">{s.salonAddress}</Typography>
                                        <Stack direction="row" alignItems="center" gap={0.3} sx={{ mt: 0.3 }}>
                                            <StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
                                            <Typography className="spd-salon-rating">{(s.salonRating ?? 0).toFixed(1)} ({s.salonComments ?? 0} {t('reviews')})</Typography>
                                        </Stack>
                                    </Box>
                                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* ═══ REVIEWS — Justin'ning o'ziga (MEMBER guruhi) tegishli sharhlar ═══ */}
            {commentTotal > 0 && (
                <Box component="div" className="spd-section">
                    <Typography className="spd-section-title">{t('Reviews')}</Typography>
                    {comments.slice(0, 2).map((c: any) => (
                        <Stack key={c._id} direction="row" gap={1.25} className="spd-review-item">
                            <Box component="div" className="spd-review-avatar" style={{ backgroundImage: `url(${imgUrl(c.memberData?.memberImage)})` }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" gap={0.75}>
                                    <Typography className="spd-review-name">{c.memberData?.memberNick}</Typography>
                                    <Stack direction="row" gap={0.1}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <StarIcon key={n} sx={{ fontSize: 10, color: n <= (c.commentRating ?? 5) ? '#FFB800' : '#e0e0e0' }} />
                                        ))}
                                    </Stack>
                                </Stack>
                                <Typography className="spd-review-text">{c.commentContent}</Typography>
                            </Box>
                        </Stack>
                    ))}
                    <Typography className="spd-viewall-link" onClick={openReviewsHandler}>
                        {t('View all reviews')} ({commentTotal}) →
                    </Typography>
                </Box>
            )}

            {/* ═══ SERVICES — bron uchun tanlash ═══ */}
            {services.length > 0 && (
                <Box component="div" className="spd-section">
                    <Typography className="spd-section-title">{t('Services')}</Typography>
                    <Stack gap={0}>
                        {services.map((svc) => {
                            const isSelected = selectedService === svc._id;
                            return (
                                <Stack
                                    key={svc._id}
                                    direction="row"
                                    alignItems="center"
                                    gap={1.25}
                                    className="spd-service-row"
                                    onClick={() => setSelectedService((prev) => (prev === svc._id ? '' : svc._id))}
                                >
                                    <Box component="div" className={`spd-service-radio ${isSelected ? 'checked' : ''}`}>
                                        {isSelected && <CheckCircleIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />}
                                    </Box>
                                    <Box component="div" className="spd-service-img" style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0], '/img/banner/hero.jpg')})` }} />
                                    <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography className="spd-service-name">{svc.serviceTitle}</Typography>
                                        <Typography className="spd-service-dur">{svc.serviceDuration} {t('min')}</Typography>
                                    </Box>
                                    <Typography className="spd-service-price">₩{formatPrice(svc.servicePrice)}</Typography>
                                </Stack>
                            );
                        })}
                    </Stack>
                </Box>
            )}

            {/* ═══ PORTFOLIO ═══ */}
            {(specialist.memberPortfolio?.length ?? 0) > 0 && (
                <Box component="div" className="spd-section">
                    <Typography className="spd-section-title">{t('Portfolio')}</Typography>
                    <Stack direction="row" gap={1} className="spd-portfolio-grid">
                        {specialist.memberPortfolio.slice(0, 4).map((img: string, i: number) => {
                            const isLast = i === 3 && specialist.memberPortfolio.length > 4;
                            return (
                                <Box key={i} component="div" className="spd-portfolio-item" style={{ backgroundImage: `url(${imgUrl(img)})` }}>
                                    {isLast && (
                                        <Box component="div" className="spd-portfolio-more">+{specialist.memberPortfolio.length - 4}</Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            )}

            {/* ═══ SIMILAR SPECIALISTS ═══ */}
            {similarSpecialists.length > 0 && (
                <Box component="div" className="spd-section">
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography className="spd-section-title">{t('Similar Specialists')}</Typography>
                        <Typography className="spd-viewall-link" onClick={() => router.push('/specialist')}>{t('View all')}</Typography>
                    </Stack>
                    <Stack direction="row" gap={1.25} className="spd-similar-row">
                        {similarSpecialists.map((s) => (
                            <Stack key={s._id} className="spd-similar-card" onClick={() => router.push(`/specialist/detail?id=${s._id}`)}>
                                <Box component="div" className="spd-similar-avatar" style={{ backgroundImage: `url(${imgUrl(s.memberImage)})` }} />
                                <Typography className="spd-similar-name">{s.memberNick}</Typography>
                                <Typography className="spd-similar-specialty">{(s.memberSpecialty ?? [])[0]}</Typography>
                                <Stack direction="row" alignItems="center" gap={0.3}>
                                    <StarIcon sx={{ fontSize: 11, color: '#FFB800' }} />
                                    <Typography className="spd-similar-rating">{(s.salonRating ?? 4.8).toFixed(1)}</Typography>
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* ═══ STICKY BOOKING / BOTTOM NAV ═══ */}
            {selectedServiceObj ? (
                <Stack direction="row" alignItems="center" justifyContent="space-between" className="spd-sticky-bar">
                    <Box>
                        <Typography className="spd-sticky-name">{selectedServiceObj.serviceTitle}</Typography>
                        <Typography className="spd-sticky-price">₩{formatPrice(selectedServiceObj.servicePrice)}</Typography>
                    </Box>
                    <Box component="div" className="spd-book-btn" onClick={() => { if (requireAuth()) { setBookingStep('form'); setSelectedTime(''); setBookingOpen(true); } }}>
                        {t('Book Now')}
                    </Box>
                </Stack>
            ) : (
                <Stack direction="row" className="spd-bottom-nav">
                    <Stack alignItems="center" className="spd-nav-item" onClick={() => router.push('/')}>
                        <HomeIcon sx={{ fontSize: 22 }} />
                        <Typography className="spd-nav-label">{t('Home')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="spd-nav-item" onClick={() => setExploreOpen(true)}>
                        <AppsIcon sx={{ fontSize: 22 }} />
                        <Typography className="spd-nav-label">{t('Explore')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="spd-nav-item" onClick={() => router.push('/mypage?category=myFavorites')}>
                        <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                        <Typography className="spd-nav-label">{t('Favorites')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="spd-nav-item" onClick={() => router.push('/mypage')}>
                        <PersonIcon sx={{ fontSize: 22 }} />
                        <Typography className="spd-nav-label">{t('My Page')}</Typography>
                    </Stack>
                </Stack>
            )}

            {/* ═══ EXPLORE MENYUSI ═══ */}
            {exploreOpen && (
                <Box component="div" className="spd-explore-backdrop" onClick={() => setExploreOpen(false)}>
                    <Stack className="spd-explore-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="spd-explore-head">
                            <Typography className="spd-explore-title">{t('Explore')}</Typography>
                            <IconButton onClick={() => setExploreOpen(false)}><CloseIcon /></IconButton>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} className="spd-explore-grid">
                            {EXPLORE_ITEMS.map((item) => (
                                <Stack
                                    key={item.href}
                                    alignItems="center"
                                    gap={0.75}
                                    className="spd-explore-item"
                                    onClick={() => { setExploreOpen(false); router.push(item.href); }}
                                >
                                    <Box component="div" className="spd-explore-icon" sx={{ background: `${item.color}18`, color: item.color }}>
                                        {item.icon}
                                    </Box>
                                    <Typography className="spd-explore-label">{t(item.label)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            )}

            {/* ═══ BOOKING VARAQASI ═══ */}
            {bookingOpen && (
                <Box component="div" className="spd-booking-backdrop" onClick={() => setBookingOpen(false)}>
                    <Stack className="spd-booking-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Box component="div" className="spd-sheet-handle" />

                        {bookingStep === 'form' ? (
                            <>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" className="spd-sheet-head">
                                    <IconButton onClick={() => setBookingOpen(false)}><CloseIcon /></IconButton>
                                    <Typography className="spd-sheet-title">{t('Booking')}</Typography>
                                    <Box sx={{ width: 40 }} />
                                </Stack>

                                <Stack className="spd-sheet-body">
                                    <Stack direction="row" alignItems="center" gap={0.75} className="spd-step-head">
                                        <Box component="div" className="spd-step-num">1</Box>
                                        <Typography className="spd-step-title">{t('Select Date')}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <IconButton size="small" onClick={() => setMonthOffset((p) => Math.max(0, p - 1))}><ChevronLeftIcon /></IconButton>
                                        <Typography className="spd-month-label">{currentMonth.format('MMMM YYYY')}</Typography>
                                        <IconButton size="small" onClick={() => setMonthOffset((p) => p + 1)}><ChevronRightIcon /></IconButton>
                                    </Stack>
                                    <Stack direction="row" className="spd-cal-dow-row">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <Typography key={i} className="spd-cal-dow">{d}</Typography>
                                        ))}
                                    </Stack>
                                    <Stack direction="row" flexWrap="wrap" className="spd-cal-grid">
                                        {calendarDays.map(({ date: d, inMonth }) => {
                                            const isPast = d.isBefore(moment(), 'day');
                                            const isSelected = d.isSame(selectedDate, 'day');
                                            return (
                                                <Stack
                                                    key={d.format('YYYY-MM-DD')}
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    className={`spd-cal-cell ${isSelected ? 'selected' : ''} ${isPast || !inMonth ? 'disabled' : ''}`}
                                                    onClick={() => !isPast && inMonth && setSelectedDate(d)}
                                                >
                                                    <Typography className="spd-cal-num">{d.format('D')}</Typography>
                                                </Stack>
                                            );
                                        })}
                                    </Stack>

                                    <Stack direction="row" alignItems="center" gap={0.75} className="spd-step-head" sx={{ mt: 2 }}>
                                        <Box component="div" className="spd-step-num">2</Box>
                                        <Typography className="spd-step-title">{t('Select Time')}</Typography>
                                    </Stack>
                                    <Stack direction="row" flexWrap="wrap" gap={0.75} className="spd-time-grid">
                                        {TIME_SLOTS.map((slot) => {
                                            const isBooked = bookedTimesForDate.includes(slot);
                                            const isSelected = selectedTime === slot;
                                            return (
                                                <Box
                                                    key={slot}
                                                    component="div"
                                                    className={`spd-time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'disabled' : ''}`}
                                                    onClick={() => !isBooked && setSelectedTime(slot)}
                                                >
                                                    {slot}
                                                </Box>
                                            );
                                        })}
                                    </Stack>

                                    <Stack direction="row" alignItems="center" justifyContent="space-between" className="spd-deposit-row">
                                        <Typography className="spd-deposit-label">{t('Deposit')} <span>({t('Non-refundable')})</span></Typography>
                                        <Typography className="spd-deposit-amount">₩10,000</Typography>
                                    </Stack>

                                    <Box
                                        component="div"
                                        className={`spd-confirm-btn ${!selectedTime || bookingLoading ? 'disabled' : ''}`}
                                        onClick={() => selectedTime && !bookingLoading && confirmBookingHandler()}
                                    >
                                        {bookingLoading ? t('Processing...') : t('Confirm & Pay Deposit')}
                                    </Box>
                                </Stack>
                            </>
                        ) : (
                            <Stack className="spd-confirmed-view" alignItems="center">
                                <Box component="div" className="spd-confirm-icon"><CheckCircleIcon sx={{ fontSize: 44, color: '#fff' }} /></Box>
                                <Typography className="spd-confirmed-title">{t('Booking Confirmed!')}</Typography>
                                <Typography className="spd-confirmed-sub">{t('Your appointment has been successfully booked.')}</Typography>

                                <Stack className="spd-confirmed-details">
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Specialist')}</Typography><Typography className="v">{specialist.memberNick}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Service')}</Typography><Typography className="v">{selectedServiceObj?.serviceTitle}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Date')}</Typography><Typography className="v">{selectedDate.format('MMM DD, YYYY (ddd)')}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Time')}</Typography><Typography className="v">{selectedTime}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Deposit Paid')}</Typography><Typography className="v">₩10,000</Typography></Stack>
                                </Stack>

                                <Box component="div" className="spd-confirmed-btn primary" onClick={() => router.push('/mypage?category=myBookings')}>{t('Go to My Bookings')}</Box>
                                <Box component="div" className="spd-confirmed-btn" onClick={() => { setBookingOpen(false); setBookingStep('form'); }}>{t('Continue Browsing')}</Box>
                            </Stack>
                        )}
                    </Stack>
                </Box>
            )}

            {/* ═══ BARCHA SHARHLAR VARAG'I ═══ */}
            {reviewsOpen && (
                <Box component="div" className="spd-booking-backdrop" onClick={() => setReviewsOpen(false)}>
                    <Stack className="spd-booking-sheet spd-reviews-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Box component="div" className="spd-sheet-handle" />
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="spd-sheet-head">
                            <IconButton onClick={() => setReviewsOpen(false)}><CloseIcon /></IconButton>
                            <Typography className="spd-sheet-title">{t('Reviews')} ({commentTotal})</Typography>
                            <Box sx={{ width: 40 }} />
                        </Stack>
                        <Stack className="spd-sheet-body">
                            {reviewsLoading && <Typography sx={{ textAlign: 'center', color: '#999', py: 4 }}>{t('Loading...')}</Typography>}
                            {!reviewsLoading && allComments.length === 0 && <Typography sx={{ textAlign: 'center', color: '#999', py: 4 }}>{t('No reviews yet')}</Typography>}
                            {allComments.map((c: any) => (
                                <Stack key={c._id} direction="row" gap={1.25} className="spd-full-review-item">
                                    <Box component="div" className="spd-review-avatar" style={{ backgroundImage: `url(${imgUrl(c.memberData?.memberImage)})` }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <Typography className="spd-review-name">{c.memberData?.memberNick}</Typography>
                                            <Stack direction="row" gap={0.1}>
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <StarIcon key={n} sx={{ fontSize: 10, color: n <= (c.commentRating ?? 5) ? '#FFB800' : '#e0e0e0' }} />
                                                ))}
                                            </Stack>
                                        </Stack>
                                        <Typography className="spd-review-time">{moment(c.createdAt).fromNow()}</Typography>
                                        <Typography className="spd-review-text">{c.commentContent}</Typography>
                                    </Box>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default MobileSpecialistDetail;