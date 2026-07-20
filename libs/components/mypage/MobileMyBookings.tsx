import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_MY_BOOKINGS } from '../../../apollo/user/query';
import { CANCEL_BOOKING, CREATE_COMMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { BookingStatus } from '../../enums/booking.enum';

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};
const formatPrice = (n?: number): string => (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const TABS = [
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Canceled', value: 'CANCELED' },
];

const MobileMyBookings = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [activeTab, setActiveTab] = useState('UPCOMING');
    const [bookings, setBookings] = useState<any[]>([]);
    const [total, setTotal] = useState(0);

    const [rateModalBooking, setRateModalBooking] = useState<any | null>(null);
    const [rateStars, setRateStars] = useState(5);
    const [rateText, setRateText] = useState('');
    const [rateSubmitting, setRateSubmitting] = useState(false);
    const [reviewedRefIds, setReviewedRefIds] = useState<string[]>([]);

    const [cancelBooking] = useMutation(CANCEL_BOOKING);
    const [createComment] = useMutation(CREATE_COMMENT);

    // ⚠️ Backend faqat BITTA bookingStatus qiymatini filtrlaydi (massiv emas).
    // "Upcoming" — PENDING+CONFIRMED ikkalasini o'z ichiga oladi, shuning
    // uchun bu holatda filtrsiz olib, keyin client tomonda filtrlanadi.
    const buildSearch = useCallback((): T => {
        if (activeTab === 'COMPLETED') return { bookingStatus: 'COMPLETED' };
        if (activeTab === 'CANCELED') return { bookingStatus: 'CANCELLED' };
        return {};
    }, [activeTab]);

    const visibleBookings = activeTab === 'UPCOMING'
        ? bookings.filter((b) => b.bookingStatus === 'PENDING' || b.bookingStatus === 'CONFIRMED')
        : bookings;

    const { refetch } = useQuery(GET_MY_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 20, sort: 'bookingDate', direction: 'DESC', search: buildSearch() } },
        onCompleted: (data: T) => {
            setBookings(data?.getMyBookings?.list ?? []);
            setTotal(data?.getMyBookings?.metaCounter?.[0]?.total ?? 0);
        },
    });

    useEffect(() => {
        refetch({ input: { page: 1, limit: 20, sort: 'bookingDate', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
            setBookings(data?.getMyBookings?.list ?? []);
            setTotal(data?.getMyBookings?.metaCounter?.[0]?.total ?? 0);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const cancelHandler = async (booking: any) => {
        try {
            const bookingDateTime = moment(booking.bookingDate);
            const [h, m] = booking.bookingTime.split(':').map(Number);
            bookingDateTime.set({ hour: h, minute: m });
            const hoursLeft = bookingDateTime.diff(moment(), 'hours', true);
            const willRefund = hoursLeft > 24;
            const msg = willRefund
                ? t('Cancel this booking? Your deposit will be fully refunded (more than 24h before appointment).')
                : t('Cancel this booking? Your deposit will NOT be refunded (less than 24h before appointment).');

            if (await sweetConfirmAlert(msg)) {
                await cancelBooking({ variables: { input: booking._id } });
                await sweetMixinSuccessAlert(t('Booking cancelled.'));
                const { data } = await refetch({ input: { page: 1, limit: 20, sort: 'bookingDate', direction: 'DESC', search: buildSearch() } });
                setBookings(data?.getMyBookings?.list ?? []);
            }
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    const openRateModal = (booking: any) => {
        setRateModalBooking(booking);
        setRateStars(5);
        setRateText('');
    };

    const submitRatingHandler = async () => {
        if (!rateModalBooking || !rateText.trim()) return;
        setRateSubmitting(true);
        try {
            await createComment({
                variables: {
                    input: {
                        commentGroup: 'SALON',
                        commentRefId: rateModalBooking.salonId,
                        commentContent: rateText.trim(),
                        commentRating: rateStars,
                    },
                },
            });
            setReviewedRefIds((prev) => [...prev, rateModalBooking.salonId]);
            setRateModalBooking(null);
            await sweetMixinSuccessAlert(t('Thank you for your review!'));
        } catch (err: any) {
            sweetErrorHandling(err).then();
        } finally {
            setRateSubmitting(false);
        }
    };

    return (
        <Box component="div" id="mobile-mybookings">
            {/* ═══ TABS ═══ */}
            <Stack direction="row" className="mb-tabs">
                {TABS.map((tb) => (
                    <Box
                        key={tb.value}
                        component="div"
                        className={`mb-tab ${activeTab === tb.value ? 'active' : ''}`}
                        onClick={() => setActiveTab(tb.value)}
                    >
                        {t(tb.label)}
                    </Box>
                ))}
            </Stack>

            {/* ═══ BOOKING KARTALARI ═══ */}
            <Stack className="mb-list">
                {visibleBookings.length === 0 && (
                    <Stack alignItems="center" className="mb-empty">
                        <Typography className="mb-empty-emoji">📅</Typography>
                        <Typography className="mb-empty-title">{t('No bookings found')}</Typography>
                    </Stack>
                )}

                {visibleBookings.map((b) => {
                    const salon = b.salonData;
                    const svc = b.serviceData;
                    const isUpcoming = b.bookingStatus === 'PENDING' || b.bookingStatus === 'CONFIRMED';
                    const isCompleted = b.bookingStatus === 'COMPLETED';
                    const alreadyReviewed = reviewedRefIds.includes(b.salonId);

                    return (
                        <Stack key={b._id} className="mb-card">
                            <Box component="div" className="mb-card-img" style={{ backgroundImage: `url(${imgUrl(salon?.salonImages?.[0])})` }}>
                                <Box component="div" className={`mb-status-badge ${b.bookingStatus?.toLowerCase()}`}>
                                    {t(isUpcoming ? 'Upcoming' : isCompleted ? 'Completed' : 'Canceled')}
                                </Box>
                            </Box>

                            <Box component="div" className="mb-card-body">
                                <Typography className="mb-salon-name">{salon?.salonTitle ?? t('Salon')}</Typography>
                                <Typography className="mb-service-name">{svc?.serviceTitle ?? t('Service')}</Typography>

                                <Stack direction="row" alignItems="center" gap={1.5} className="mb-meta-row">
                                    <Stack direction="row" alignItems="center" gap={0.4}>
                                        <CalendarMonthOutlinedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                                        <Typography className="mb-meta-text">{moment(b.bookingDate).format('MMM DD, YYYY (ddd)')}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.4}>
                                        <AccessTimeIcon sx={{ fontSize: 13, color: '#999' }} />
                                        <Typography className="mb-meta-text">{b.bookingTime}</Typography>
                                    </Stack>
                                </Stack>
                                <Stack direction="row" alignItems="center" gap={0.4}>
                                    <LocationOnIcon sx={{ fontSize: 13, color: '#999' }} />
                                    <Typography className="mb-meta-text">{salon?.salonAddress}</Typography>
                                </Stack>

                                <Stack direction="row" alignItems="center" justifyContent="space-between" className="mb-price-row">
                                    <Typography className="mb-price">₩{formatPrice(b.totalAmount ?? 10000)}</Typography>
                                    <Typography className="mb-deposit-label">{t('Deposit Paid')}</Typography>
                                </Stack>

                                <Stack direction="row" gap={1} className="mb-actions">
                                    <Box component="div" className="mb-btn-outline" onClick={() => router.push(`/salons/${b.salonId}`)}>
                                        {t('View Details')}
                                    </Box>
                                    {isUpcoming && (
                                        <Box component="div" className="mb-btn-cancel" onClick={() => cancelHandler(b)}>
                                            {t('Cancel Booking')}
                                        </Box>
                                    )}
                                    {isCompleted && !alreadyReviewed && (
                                        <Box component="div" className="mb-btn-rate" onClick={() => openRateModal(b)}>
                                            {t('Rate & Review')}
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>

            {/* ═══ RATE & REVIEW MODAL ═══ */}
            {rateModalBooking && (
                <Box component="div" className="mb-rate-backdrop" onClick={() => setRateModalBooking(null)}>
                    <Stack className="mb-rate-modal" onClick={(e: any) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="mb-rate-head">
                            <Typography className="mb-rate-title">{t('Rate Your Experience')}</Typography>
                            <IconButton size="small" onClick={() => setRateModalBooking(null)}><CloseIcon /></IconButton>
                        </Stack>
                        <Typography className="mb-rate-salon">{rateModalBooking.salonData?.salonTitle}</Typography>
                        <Stack direction="row" gap={0.5} className="mb-rate-stars">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <IconButton key={n} onClick={() => setRateStars(n)}>
                                    <StarIcon sx={{ fontSize: 30, color: n <= rateStars ? '#FFB800' : '#e0e0e0' }} />
                                </IconButton>
                            ))}
                        </Stack>
                        <textarea
                            className="mb-rate-textarea"
                            placeholder={t('Share details about your experience...')}
                            value={rateText}
                            onChange={(e) => setRateText(e.target.value)}
                            rows={4}
                        />
                        <Box
                            component="div"
                            className={`mb-rate-submit ${!rateText.trim() || rateSubmitting ? 'disabled' : ''}`}
                            onClick={() => !rateSubmitting && rateText.trim() && submitRatingHandler()}
                        >
                            {rateSubmitting ? t('Submitting...') : t('Submit Review')}
                        </Box>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default MobileMyBookings;