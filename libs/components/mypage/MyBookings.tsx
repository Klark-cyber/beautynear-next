import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Stack, Box, Typography, Chip, Pagination as MuiPagination, IconButton } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_MY_BOOKINGS, GET_COMMENTS } from '../../../apollo/user/query';
import { CANCEL_BOOKING, CREATE_COMMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { initializeApollo } from '../../../apollo/client';
import { BookingStatus } from '../../enums/booking.enum';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

/* Filter tablar → BookingStatus mapping */
const FILTER_TABS = [
    { label: 'All', value: 'ALL' },
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
];

// Status → badge ko'rinishi (rasmga mos)
const statusBadge = (status: BookingStatus): { label: string; cls: string } => {
    switch (status) {
        case BookingStatus.PENDING:
        case BookingStatus.CONFIRMED:
            return { label: 'Upcoming', cls: 'upcoming' };
        case BookingStatus.COMPLETED:
            return { label: 'Completed', cls: 'completed' };
        case BookingStatus.CANCELLED:
            return { label: 'Cancelled', cls: 'cancelled' };
        default:
            return { label: status, cls: 'upcoming' };
    }
};

/* ─── Component ───────────────────────────────────────────────────────── */

const MyBookings: NextPage = () => {
    const router = useRouter();
    const { t } = useTranslation('common');
    const user = useReactiveVar(userVar);

    const [activeTab, setActiveTab] = useState<string>('UPCOMING');
    const [bookings, setBookings] = useState<any[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const limit = 6;

    // ⚠️ YANGI — sharh yozilgan xizmat/salonlar ro'yxati (qayta yozdirmaslik uchun)
    const [reviewedRefIds, setReviewedRefIds] = useState<string[]>([]);
    const [rateModalBooking, setRateModalBooking] = useState<any | null>(null);
    const [rateStars, setRateStars] = useState(5);
    const [rateText, setRateText] = useState('');
    const [rateSubmitting, setRateSubmitting] = useState(false);

    /** APOLLO **/
    const { refetch } = useQuery(GET_MY_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: { input: { page, limit, sort: 'bookingDate', direction: 'DESC', search: {} } },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setBookings(data?.getMyBookings?.list ?? []);
            setTotal(data?.getMyBookings?.metaCounter?.[0]?.total ?? 0);
        },
    });

    const [cancelBooking] = useMutation(CANCEL_BOOKING);
    const [createComment] = useMutation(CREATE_COMMENT);

    // Har bir COMPLETED bron uchun — foydalanuvchi allaqachon sharh qoldirganmi tekshiramiz
    useEffect(() => {
        const completedSalonIds = Array.from(
            new Set(bookings.filter((b) => b.bookingStatus === BookingStatus.COMPLETED).map((b) => b.salonId)),
        );
        if (!completedSalonIds.length || !user?._id) return;

        const client = initializeApollo();
        Promise.all(
            completedSalonIds.map((salonId) =>
                client
                    .query({
                        query: GET_COMMENTS,
                        variables: { input: { page: 1, limit: 100, sort: 'createdAt', direction: 'DESC', search: { commentRefId: salonId, commentGroup: 'SALON' } } },
                        fetchPolicy: 'network-only',
                    })
                    .then(({ data }) => {
                        const mine = (data?.getComments?.list ?? []).some((c: T) => c.memberId === user._id);
                        return mine ? salonId : null;
                    })
                    .catch(() => null),
            ),
        ).then((results) => setReviewedRefIds(results.filter(Boolean) as string[]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookings, user?._id]);

    /** HANDLERS **/
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
                await refetch();
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

    /** Filter (frontend-side) **/
    const filtered = useMemo(() => {
        if (activeTab === 'ALL') return bookings;
        if (activeTab === 'UPCOMING') {
            return bookings.filter(
                (b) => b.bookingStatus === BookingStatus.PENDING || b.bookingStatus === BookingStatus.CONFIRMED,
            );
        }
        if (activeTab === 'COMPLETED') return bookings.filter((b) => b.bookingStatus === BookingStatus.COMPLETED);
        if (activeTab === 'CANCELLED') return bookings.filter((b) => b.bookingStatus === BookingStatus.CANCELLED);
        return bookings;
    }, [bookings, activeTab]);

    const paginationHandler = useCallback((_e: any, value: number) => {
        setPage(value);
    }, []);

    return (
        <Box component="div" className="mypage-content">
            {/* Sarlavha */}
            <Typography className="content-title">{t('My Bookings')}</Typography>
            <Typography className="content-subtitle">{t('Manage your appointments')}</Typography>

            {/* Filter tablar */}
            <Stack direction="row" gap={1.5} className="filter-tabs">
                {FILTER_TABS.map((tab) => (
                    <Box
                        key={tab.value}
                        component="div"
                        className={`filter-tab ${activeTab === tab.value ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            {/* Booking cardlar */}
            {filtered.length === 0 ? (
                <Stack alignItems="center" className="no-data">
                    <Box component="div" className="no-data-emoji">📅</Box>
                    <Typography className="no-data-title">{t('No bookings found')}</Typography>
                    <Typography className="no-data-desc">{t('Your appointments will appear here')}</Typography>
                </Stack>
            ) : (
                <Stack className="booking-list">
                    {filtered.map((booking) => {
                        const badge = statusBadge(booking.bookingStatus);
                        const svc = booking.serviceData;
                        const salon = booking.salonData;
                        return (
                            <Stack key={booking._id} direction="row" className="booking-card">
                                {/* Rasm */}
                                <Box
                                    component="div"
                                    className="booking-img"
                                    style={{ backgroundImage: `url(${imgUrl(salon?.salonImages?.[0])})` }}
                                />

                                {/* O'rta: ma'lumot */}
                                <Stack className="booking-info" flex={1}>
                                    <Typography className="booking-service">{svc?.serviceTitle ?? t('Service')}</Typography>

                                    <Stack direction="row" alignItems="center" gap={0.5} className="booking-salon">
                                        <LocationOnIcon sx={{ fontSize: 17 }} />
                                        <Typography className="booking-salon-name">{salon?.salonTitle ?? t('Salon')}</Typography>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 1 }}>
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <CalendarMonthOutlinedIcon sx={{ fontSize: 17, color: '#888' }} />
                                            <Typography className="booking-datetime">
                                                {moment(booking.bookingDate).format('MMM DD, YYYY')} · {booking.bookingTime}
                                            </Typography>
                                        </Stack>
                                        {svc?.serviceDuration && (
                                            <Box component="div" className="booking-dur-chip">
                                                {svc.serviceDuration} {t('min')}
                                            </Box>
                                        )}
                                    </Stack>
                                </Stack>

                                {/* O'ng: status + narx + View + Cancel/Rate */}
                                <Stack className="booking-right" alignItems="flex-end" justifyContent="space-between">
                                    <Chip label={t(badge.label)} size="small" className={`status-badge ${badge.cls}`} />
                                    <Typography className="booking-price">₩{formatPrice(booking.totalAmount)}</Typography>

                                    {(booking.bookingStatus === BookingStatus.PENDING || booking.bookingStatus === BookingStatus.CONFIRMED) && (
                                        <Box component="div" className="cancel-btn" onClick={() => cancelHandler(booking)}>
                                            {t('Cancel Booking')}
                                        </Box>
                                    )}

                                    {booking.bookingStatus === BookingStatus.COMPLETED && !reviewedRefIds.includes(booking.salonId) && (
                                        <Box component="div" className="rate-btn" onClick={() => openRateModal(booking)}>
                                            ⭐ {t('Rate & Review')}
                                        </Box>
                                    )}

                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        gap={0.25}
                                        className="view-details"
                                        onClick={() => router.push(`/salons/${booking.salonId}`)}
                                    >
                                        <Typography className="vd-text">{t('View Details')}</Typography>
                                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                                    </Stack>
                                </Stack>
                            </Stack>
                        );
                    })}
                </Stack>
            )}

            {/* Pagination */}
            {total > limit && (
                <Stack alignItems="center" sx={{ mt: 4 }}>
                    <MuiPagination
                        page={page}
                        count={Math.ceil(total / limit)}
                        onChange={paginationHandler}
                        shape="circular"
                        sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
                    />
                </Stack>
            )}

            {/* ⚠️ YANGI — Rate & Review modal */}
            {rateModalBooking && (
                <Box component="div" className="rate-modal-backdrop" onClick={() => setRateModalBooking(null)}>
                    <Stack className="rate-modal" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="rate-modal-head">
                            <Typography className="rate-modal-title">{t('Rate Your Experience')}</Typography>
                            <IconButton size="small" onClick={() => setRateModalBooking(null)}><CloseIcon /></IconButton>
                        </Stack>

                        <Typography className="rate-modal-salon">{rateModalBooking.salonData?.salonTitle}</Typography>

                        <Stack direction="row" gap={0.5} className="rate-modal-stars">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <IconButton key={n} onClick={() => setRateStars(n)}>
                                    <StarIcon sx={{ fontSize: 32, color: n <= rateStars ? '#FFB800' : '#e0e0e0' }} />
                                </IconButton>
                            ))}
                        </Stack>

                        <textarea
                            className="rate-modal-textarea"
                            placeholder={t('Share details about your experience...')}
                            value={rateText}
                            onChange={(e) => setRateText(e.target.value)}
                            rows={4}
                        />

                        <Box
                            component="div"
                            className={`rate-modal-submit ${!rateText.trim() || rateSubmitting ? 'disabled' : ''}`}
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

export default MyBookings;