import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation } from 'swiper';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_SERVICE, GET_SERVICES, GET_COMMENTS, GET_BOOKED_SLOTS, GET_MY_BOOKINGS } from '../../../apollo/user/query';
import { LIKE_TARGET_SERVICE, CREATE_BOOKING, CREATE_COMMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { initializeApollo } from '../../../apollo/client';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { Service } from '../../types/service/service';
import { Comment } from '../../types/comment/comment';
import { toggleSavedService, isServiceSaved } from '../../utils';

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

interface Props {
    serviceId: string;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileServiceDetail = ({ serviceId }: Props) => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [service, setService] = useState<Service | null>(null);
    const [similarServices, setSimilarServices] = useState<Service[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentTotal, setCommentTotal] = useState(0);
    const [aboutExpanded, setAboutExpanded] = useState(false);
    const [savedTick, setSavedTick] = useState(0);

    // Booking
    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState<'form' | 'confirmed'>('form');
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedDate, setSelectedDate] = useState(moment().add(1, 'day'));
    const [selectedTime, setSelectedTime] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
    const [bookedTimesForDate, setBookedTimesForDate] = useState<string[]>([]);

    // Rate & Review
    const [myOwnReview, setMyOwnReview] = useState<Comment | null>(null);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [rateFormOpen, setRateFormOpen] = useState(false);
    const [rateStars, setRateStars] = useState(5);
    const [rateText, setRateText] = useState('');
    const [rateSubmitting, setRateSubmitting] = useState(false);
    const [reviewsOpen, setReviewsOpen] = useState(false);
    const [allComments, setAllComments] = useState<Comment[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    /** APOLLO REQUESTS **/
    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);
    const [createBooking] = useMutation(CREATE_BOOKING);
    const [createComment] = useMutation(CREATE_COMMENT);

    useQuery(GET_SERVICE, {
        fetchPolicy: 'network-only',
        variables: { input: serviceId },
        skip: !serviceId,
        onCompleted: (data: T) => setService(data?.getService ?? null),
    });

    useQuery(GET_SERVICES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 8, sort: 'serviceRank', direction: 'DESC', search: service ? { typeList: [service.serviceType] } : undefined } },
        skip: !service,
        onCompleted: (data: T) => setSimilarServices((data?.getServices?.list ?? []).filter((s: Service) => s._id !== serviceId)),
    });

    useQuery(GET_COMMENTS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: { commentRefId: serviceId, commentGroup: 'SERVICE' } } },
        skip: !serviceId,
        onCompleted: (data: T) => {
            setComments(data?.getComments?.list ?? []);
            setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
        },
    });

    // ⚠️ YANGI — PC versiyadagi kabi: rate qilish faqat COMPLETED
    // bron mavjud bo'lgandagina ruxsat etiladi
    useQuery(GET_MY_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 30, sort: 'createdAt', direction: 'DESC', search: { serviceId } } },
        skip: !serviceId || !user?._id,
        onCompleted: (data: T) => setMyBookings(data?.getMyBookings?.list ?? []),
    });

    // Band vaqtlarni yuklash (hamma mijozlar bo'yicha, xavfsiz)
    useEffect(() => {
        if (!service?.salonId) return;
        const client = initializeApollo();
        client
            .query({
                query: GET_BOOKED_SLOTS,
                variables: { salonId: service.salonId, date: selectedDate.format('YYYY-MM-DD') },
                fetchPolicy: 'network-only',
            })
            .then(({ data }) => setBookedTimesForDate(data?.getBookedSlots ?? []))
            .catch(() => setBookedTimesForDate([]));
    }, [service?.salonId, selectedDate]);

    // Rate eligibility — COMPLETED bron bormi va hali sharh yozilmaganmi
    useEffect(() => {
        if (!user?._id || !serviceId) return;
        const client = initializeApollo();
        client
            .query({
                query: GET_COMMENTS,
                variables: { input: { page: 1, limit: 100, sort: 'createdAt', direction: 'DESC', search: { commentRefId: serviceId, commentGroup: 'SERVICE' } } },
                fetchPolicy: 'network-only',
            })
            .then(({ data }) => {
                const own = (data?.getComments?.list ?? []).find((c: Comment) => c.memberId === user._id);
                setMyOwnReview(own ?? null);
            })
            .catch(() => { });
    }, [serviceId, user?._id]);

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

    const likeHandler = () => {
        if (!requireAuth() || !service) return;
        likeTargetService({ variables: { input: serviceId } }).then(() => {
            setService((prev) => (prev ? { ...prev, meLiked: [{ memberId: user._id, likeRefId: serviceId, myFavorite: !prev.meLiked?.[0]?.myFavorite }] } : prev));
        });
    };

    const confirmBookingHandler = async () => {
        if (!selectedTime || !service) return;
        setBookingLoading(true);
        try {
            const result = await createBooking({
                variables: {
                    input: {
                        serviceId,
                        salonId: service.salonId,
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

    const submitRatingHandler = async () => {
        if (!rateText.trim()) return;
        setRateSubmitting(true);
        try {
            await createComment({
                variables: {
                    input: {
                        commentGroup: 'SERVICE',
                        commentRefId: serviceId,
                        commentContent: rateText.trim(),
                        commentRating: rateStars,
                    },
                },
            });
            setRateFormOpen(false);
            setRateText('');
            setRateStars(5);
            setMyOwnReview({ commentRating: rateStars, commentContent: rateText.trim() } as Comment);
        } catch (err: any) {
            alert(err?.message ?? 'Something went wrong');
        } finally {
            setRateSubmitting(false);
        }
    };

    const openReviewsHandler = async () => {
        setReviewsOpen(true);
        setReviewsLoading(true);
        try {
            const client = initializeApollo();
            const { data } = await client.query({
                query: GET_COMMENTS,
                variables: { input: { page: 1, limit: 50, sort: 'createdAt', direction: 'DESC', search: { commentRefId: serviceId, commentGroup: 'SERVICE' } } },
                fetchPolicy: 'network-only',
            });
            setAllComments(data?.getComments?.list ?? []);
        } catch (err) {
            console.log('ERROR, openReviewsHandler:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    // ⚠️ TUZATILDI: avval faqat login qilinganligi tekshirilardi — endi
    // PC versiyadagi kabi, FAQAT COMPLETED bron mavjud bo'lgandagina
    // (va hali sharh yozilmagan bo'lsa) rate qilish mumkin.
    const hasCompletedBooking = myBookings.some((b) => b.bookingStatus === 'COMPLETED');
    const canRate = hasCompletedBooking && !myOwnReview;

    if (!service) {
        return (
            <Box id="mobile-service-detail">
                <Stack alignItems="center" justifyContent="center" sx={{ height: '60vh' }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#999' }}>{t('Loading...')}</Typography>
                </Stack>
            </Box>
        );
    }

    const liked = service.meLiked?.[0]?.myFavorite;

    return (
        <Box component="div" id="mobile-service-detail">
            {/* ═══ GALEREYA ═══ */}
            <Box component="div" className="svd-gallery">
                <Swiper slidesPerView={1} loop={(service.serviceImages?.length ?? 0) > 1} className="svd-swiper">
                    {(service.serviceImages?.length ? service.serviceImages : ['']).map((img, i) => (
                        <SwiperSlide key={i}>
                            <Box component="div" className="svd-gallery-img" style={{ backgroundImage: `url(${imgUrl(img)})` }} />
                        </SwiperSlide>
                    ))}
                </Swiper>
                <IconButton className="svd-icon-btn svd-back" onClick={() => router.push('/service')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Stack direction="row" gap={1} className="svd-top-actions">
                    <IconButton className="svd-icon-btn"><ShareIcon sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton className="svd-icon-btn" onClick={likeHandler}>
                        {liked ? <FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Stack>
            </Box>

            {/* ═══ ASOSIY MA'LUMOT ═══ */}
            <Box component="div" className="svd-info-card">
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                        <Typography className="svd-title">{service.serviceTitle}</Typography>
                        <Box component="div" className="svd-type-badge">{t(service.serviceType)}</Box>
                    </Box>
                    <IconButton onClick={() => { toggleSavedService(serviceId); setSavedTick((p) => p + 1); }}>
                        {isServiceSaved(serviceId) ? <BookmarkIcon sx={{ fontSize: 24, color: '#FF4D8D' }} /> : <BookmarkBorderIcon sx={{ fontSize: 24, color: '#ccc' }} />}
                    </IconButton>
                </Stack>

                <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
                    <StarIcon sx={{ fontSize: 15, color: '#FFB800' }} />
                    <Typography className="svd-rating">{(service.serviceRating || 0).toFixed(1)} ({commentTotal} {t('reviews')})</Typography>
                    <Typography className="svd-dot">•</Typography>
                    <AccessTimeIcon sx={{ fontSize: 13, color: '#999' }} />
                    <Typography className="svd-dur">{service.serviceDuration} {t('min')}</Typography>
                </Stack>

                <Typography className="svd-price">₩{formatPrice(service.servicePrice)}</Typography>

                {/* Offered at [Salon] */}
                {service.salonData && (
                    <Stack direction="row" alignItems="center" gap={1.25} className="svd-salon-card" onClick={() => router.push(`/salons/${service.salonId}`)}>
                        <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                            <Typography className="svd-salon-label">{t('Offered at')}</Typography>
                            <Typography className="svd-salon-name">{service.salonData.salonTitle}</Typography>
                            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                                <LocationOnIcon sx={{ fontSize: 13, color: '#999' }} />
                                <Typography className="svd-salon-addr">{service.salonData.salonAddress}</Typography>
                            </Stack>
                        </Box>
                        <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                    </Stack>
                )}

                {/* About */}
                {service.serviceDesc && (
                    <Box component="div" className="svd-about">
                        <Typography className="svd-section-title">{t('About')}</Typography>
                        <Typography className={`svd-about-text ${aboutExpanded ? 'expanded' : ''}`}>{service.serviceDesc}</Typography>
                        {!aboutExpanded && (
                            <Typography className="svd-readmore" onClick={() => setAboutExpanded(true)}>{t('Read more')}</Typography>
                        )}
                    </Box>
                )}

                {/* Reviews */}
                <Box component="div" className="svd-reviews">
                    <Typography className="svd-section-title">{t('Reviews')}</Typography>

                    {comments.slice(0, 1).map((c) => (
                        <Stack key={c._id} direction="row" gap={1.25} className="svd-review-item">
                            <Box component="div" className="svd-review-avatar" style={{ backgroundImage: `url(${imgUrl(c.memberData?.memberImage, '/img/profile/defaultUser.svg')})` }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography className="svd-review-name">{c.memberData?.memberNick}</Typography>
                                <Typography className="svd-review-text">{c.commentContent}</Typography>
                            </Box>
                        </Stack>
                    ))}
                    {comments.length === 0 && <Typography className="svd-no-reviews">{t('No reviews yet')}</Typography>}

                    {canRate && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="svd-rate-prompt" onClick={() => setRateFormOpen(true)}>
                            <Box>
                                <Typography className="svd-rate-prompt-title">⭐ {t('Place to rate service')}</Typography>
                                <Typography className="svd-rate-prompt-desc">{t('You completed a visit here — share your experience!')}</Typography>
                            </Box>
                            <ChevronRightIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                        </Stack>
                    )}

                    {commentTotal > 0 && (
                        <Stack direction="row" alignItems="center" justifyContent="center" gap={0.3} className="svd-viewall" onClick={openReviewsHandler}>
                            <Typography>{t('View all reviews')} ({commentTotal})</Typography>
                            <ChevronRightIcon sx={{ fontSize: 16 }} />
                        </Stack>
                    )}
                </Box>

                {/* Similar Services */}
                {similarServices.length > 0 && (
                    <Box component="div" className="svd-similar">
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography className="svd-section-title">{t('Similar Services')}</Typography>
                            <Typography className="svd-viewall-link" onClick={() => router.push('/service')}>{t('View all')}</Typography>
                        </Stack>
                        <Stack direction="row" gap={1.25} className="svd-similar-row">
                            {similarServices.map((s) => {
                                const simLiked = s.meLiked?.[0]?.myFavorite;
                                return (
                                    <Stack key={s._id} className="svd-similar-card" onClick={() => router.push(`/service/${s._id}`)}>
                                        <Box component="div" className="svd-similar-img" style={{ backgroundImage: `url(${imgUrl(s.serviceImages?.[0])})` }}>
                                            <IconButton
                                                className="svd-similar-heart-btn"
                                                onClick={(e: any) => {
                                                    e.stopPropagation();
                                                    if (!requireAuth()) return;
                                                    likeTargetService({ variables: { input: s._id } }).then(() => {
                                                        setSimilarServices((prev) =>
                                                            prev.map((x) => (x._id === s._id ? { ...x, meLiked: [{ memberId: user._id, likeRefId: s._id, myFavorite: !simLiked }] } : x)),
                                                        );
                                                    });
                                                }}
                                            >
                                                {simLiked ? <FavoriteIcon sx={{ fontSize: 14, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 14, color: '#fff' }} />}
                                            </IconButton>
                                        </Box>
                                        <Typography className="svd-similar-title">{s.serviceTitle}</Typography>
                                        <Typography className="svd-similar-price">₩{formatPrice(s.servicePrice)}</Typography>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>

            {/* ═══ STICKY BOOKING PANEL ═══ */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="svd-sticky-bar">
                <Box>
                    <Typography className="svd-sticky-name">{service.serviceTitle}</Typography>
                    <Typography className="svd-sticky-price">₩{formatPrice(service.servicePrice)}</Typography>
                </Box>
                <Box component="div" className="svd-book-btn" onClick={() => { if (requireAuth()) { setBookingStep('form'); setSelectedTime(''); setBookingOpen(true); } }}>
                    {t('Book Now')}
                </Box>
            </Stack>

            {/* ═══ BOOKING VARAQASI ═══ */}
            {bookingOpen && (
                <Box component="div" className="svd-booking-backdrop" onClick={() => setBookingOpen(false)}>
                    <Stack className="svd-booking-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Box component="div" className="svd-sheet-handle" />

                        {bookingStep === 'form' ? (
                            <>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" className="svd-sheet-head">
                                    <IconButton onClick={() => setBookingOpen(false)}><CloseIcon /></IconButton>
                                    <Typography className="svd-sheet-title">{t('Booking')}</Typography>
                                    <Box sx={{ width: 40 }} />
                                </Stack>

                                <Stack className="svd-sheet-body">
                                    <Stack direction="row" alignItems="center" gap={0.75} className="svd-step-head">
                                        <Box component="div" className="svd-step-num">1</Box>
                                        <Typography className="svd-step-title">{t('Select Date')}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <IconButton size="small" onClick={() => setMonthOffset((p) => Math.max(0, p - 1))}><ChevronLeftIcon /></IconButton>
                                        <Typography className="svd-month-label">{currentMonth.format('MMMM YYYY')}</Typography>
                                        <IconButton size="small" onClick={() => setMonthOffset((p) => p + 1)}><ChevronRightIcon /></IconButton>
                                    </Stack>
                                    <Stack direction="row" className="svd-cal-dow-row">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                            <Typography key={i} className="svd-cal-dow">{d}</Typography>
                                        ))}
                                    </Stack>
                                    <Stack direction="row" flexWrap="wrap" className="svd-cal-grid">
                                        {calendarDays.map(({ date: d, inMonth }) => {
                                            const isPast = d.isBefore(moment(), 'day');
                                            const isSelected = d.isSame(selectedDate, 'day');
                                            return (
                                                <Stack
                                                    key={d.format('YYYY-MM-DD')}
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    className={`svd-cal-cell ${isSelected ? 'selected' : ''} ${isPast || !inMonth ? 'disabled' : ''}`}
                                                    onClick={() => !isPast && inMonth && setSelectedDate(d)}
                                                >
                                                    <Typography className="svd-cal-num">{d.format('D')}</Typography>
                                                </Stack>
                                            );
                                        })}
                                    </Stack>

                                    <Stack direction="row" alignItems="center" gap={0.75} className="svd-step-head" sx={{ mt: 2 }}>
                                        <Box component="div" className="svd-step-num">2</Box>
                                        <Typography className="svd-step-title">{t('Select Time')}</Typography>
                                    </Stack>
                                    <Stack direction="row" flexWrap="wrap" gap={0.75} className="svd-time-grid">
                                        {TIME_SLOTS.map((slot) => {
                                            const isBooked = bookedTimesForDate.includes(slot);
                                            const isSelected = selectedTime === slot;
                                            return (
                                                <Box
                                                    key={slot}
                                                    component="div"
                                                    className={`svd-time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'disabled' : ''}`}
                                                    onClick={() => !isBooked && setSelectedTime(slot)}
                                                >
                                                    {slot}
                                                </Box>
                                            );
                                        })}
                                    </Stack>

                                    <Stack direction="row" alignItems="center" justifyContent="space-between" className="svd-deposit-row">
                                        <Typography className="svd-deposit-label">{t('Deposit')} <span>({t('Non-refundable')})</span></Typography>
                                        <Typography className="svd-deposit-amount">₩10,000</Typography>
                                    </Stack>

                                    <Box
                                        component="div"
                                        className={`svd-confirm-btn ${!selectedTime || bookingLoading ? 'disabled' : ''}`}
                                        onClick={() => selectedTime && !bookingLoading && confirmBookingHandler()}
                                    >
                                        {bookingLoading ? t('Processing...') : t('Confirm & Pay Deposit')}
                                    </Box>
                                </Stack>
                            </>
                        ) : (
                            <Stack className="svd-confirmed-view" alignItems="center">
                                <Box component="div" className="svd-confirm-icon"><CheckCircleIcon sx={{ fontSize: 44, color: '#fff' }} /></Box>
                                <Typography className="svd-confirmed-title">{t('Booking Confirmed!')}</Typography>
                                <Typography className="svd-confirmed-sub">{t('Your appointment has been successfully booked.')}</Typography>

                                <Stack className="svd-confirmed-details">
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Service')}</Typography><Typography className="v">{service.serviceTitle}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Date')}</Typography><Typography className="v">{selectedDate.format('MMM DD, YYYY (ddd)')}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Time')}</Typography><Typography className="v">{selectedTime}</Typography></Stack>
                                    <Stack direction="row" justifyContent="space-between"><Typography className="k">{t('Deposit Paid')}</Typography><Typography className="v">₩10,000</Typography></Stack>
                                </Stack>

                                <Box component="div" className="svd-confirmed-btn primary" onClick={() => router.push('/mypage?category=myBookings')}>{t('Go to My Bookings')}</Box>
                                <Box component="div" className="svd-confirmed-btn" onClick={() => { setBookingOpen(false); setBookingStep('form'); }}>{t('Continue Browsing')}</Box>
                            </Stack>
                        )}
                    </Stack>
                </Box>
            )}

            {/* ═══ RATE FORMASI ═══ */}
            {rateFormOpen && (
                <Box component="div" className="svd-booking-backdrop" onClick={() => setRateFormOpen(false)}>
                    <Stack className="svd-booking-sheet svd-rate-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Box component="div" className="svd-sheet-handle" />
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="svd-sheet-head">
                            <IconButton onClick={() => setRateFormOpen(false)}><CloseIcon /></IconButton>
                            <Typography className="svd-sheet-title">{t('Rate Your Experience')}</Typography>
                            <Box sx={{ width: 40 }} />
                        </Stack>
                        <Stack className="svd-sheet-body" alignItems="center">
                            <Typography className="svd-rate-salon-name">{service.serviceTitle}</Typography>
                            <Stack direction="row" gap={0.5} className="svd-rate-stars">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <IconButton key={n} onClick={() => setRateStars(n)}>
                                        <StarIcon sx={{ fontSize: 34, color: n <= rateStars ? '#FFB800' : '#e0e0e0' }} />
                                    </IconButton>
                                ))}
                            </Stack>
                            <textarea
                                className="svd-rate-textarea"
                                placeholder={t('Share details about your experience...')}
                                value={rateText}
                                onChange={(e) => setRateText(e.target.value)}
                                rows={4}
                            />
                            <Box
                                component="div"
                                className={`svd-confirm-btn ${!rateText.trim() || rateSubmitting ? 'disabled' : ''}`}
                                onClick={() => !rateSubmitting && rateText.trim() && submitRatingHandler()}
                                sx={{ width: '100%', mt: 2 }}
                            >
                                {rateSubmitting ? t('Submitting...') : t('Submit Review')}
                            </Box>
                        </Stack>
                    </Stack>
                </Box>
            )}

            {/* ═══ BARCHA SHARHLAR ═══ */}
            {reviewsOpen && (
                <Box component="div" className="svd-booking-backdrop" onClick={() => setReviewsOpen(false)}>
                    <Stack className="svd-booking-sheet svd-reviews-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Box component="div" className="svd-sheet-handle" />
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="svd-sheet-head">
                            <IconButton onClick={() => setReviewsOpen(false)}><CloseIcon /></IconButton>
                            <Typography className="svd-sheet-title">{t('Reviews')} ({commentTotal})</Typography>
                            <Box sx={{ width: 40 }} />
                        </Stack>
                        <Stack className="svd-sheet-body">
                            {reviewsLoading && <Typography sx={{ textAlign: 'center', color: '#999', py: 4 }}>{t('Loading...')}</Typography>}
                            {!reviewsLoading && allComments.length === 0 && <Typography sx={{ textAlign: 'center', color: '#999', py: 4 }}>{t('No reviews yet')}</Typography>}
                            {allComments.map((c) => (
                                <Stack key={c._id} direction="row" gap={1.25} className="svd-full-review-item">
                                    <Box component="div" className="svd-review-avatar" style={{ backgroundImage: `url(${imgUrl(c.memberData?.memberImage, '/img/profile/defaultUser.svg')})` }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography className="svd-review-name">{c.memberData?.memberNick}</Typography>
                                        <Typography className="svd-review-time">{moment(c.createdAt).fromNow()}</Typography>
                                        <Typography className="svd-review-text">{c.commentContent}</Typography>
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

export default MobileServiceDetail;