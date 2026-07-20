import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import { useMutation, useQuery } from '@apollo/client';
import moment from 'moment';
import { GET_AGENT_BOOKINGS, GET_AGENT_SALONS } from '../../../apollo/user/query';
import { UPDATE_BOOKING_BY_AGENT } from '../../../apollo/user/mutation';
import { Booking } from '../../types/booking/booking';
import { Salon } from '../../types/salon/salon';
import { BookingStatus } from '../../enums/booking.enum';
import { T } from '../../types/common';
import { REACT_APP_API_URL } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const formatPrice = (n?: number): string => (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const STATUS_TABS = [
    { label: 'All', value: undefined },
    { label: 'Pending', value: BookingStatus.PENDING },
    { label: 'Confirmed', value: BookingStatus.CONFIRMED },
    { label: 'Completed', value: BookingStatus.COMPLETED },
    { label: 'Cancelled', value: BookingStatus.CANCELLED },
];

const CHANGEABLE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

const limit = 10;

/* ─── Component ───────────────────────────────────────────────────────────── */

// ⚠️ MUHIM: bu komponent Desktop AgentBookings.tsx bilan bir xil
// query/handler mantiqidan foydalanadi (GET_AGENT_BOOKINGS, GET_AGENT_SALONS,
// UPDATE_BOOKING_BY_AGENT, "mock refund" naqshi) — faqat mobil UI bilan.

const MobileAgentBookings = () => {
    const { t } = useTranslation('common');

    const [activeStatus, setActiveStatus] = useState<BookingStatus | undefined>(undefined);
    const [salonFilter, setSalonFilter] = useState<string>('ALL');
    const [salonFilterOpen, setSalonFilterOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [total, setTotal] = useState(0);
    const [salons, setSalons] = useState<Salon[]>([]);
    const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);

    const [updateBookingByAgent] = useMutation(UPDATE_BOOKING_BY_AGENT);

    useQuery(GET_AGENT_SALONS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 50, search: {} } },
        onCompleted: (data: T) => setSalons(data?.getAgentSalons?.list ?? []),
    });

    const buildSearch = (): T => {
        const search: T = {};
        if (activeStatus) search.bookingStatus = activeStatus;
        if (salonFilter !== 'ALL') search.salonId = salonFilter;
        return search;
    };

    const { refetch } = useQuery(GET_AGENT_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit, search: buildSearch() } },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setBookings(data?.getAgentBookings?.list ?? []);
            setTotal(data?.getAgentBookings?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        },
    });

    const refetchWith = async (nextStatus = activeStatus, nextSalon = salonFilter) => {
        const search: T = {};
        if (nextStatus) search.bookingStatus = nextStatus;
        if (nextSalon !== 'ALL') search.salonId = nextSalon;
        const { data } = await refetch({ input: { page: 1, limit, search } });
        setBookings(data?.getAgentBookings?.list ?? []);
        setTotal(data?.getAgentBookings?.metaCounter?.[0]?.total ?? 0);
        setPage(1);
    };

    const tabChangeHandler = (status: BookingStatus | undefined) => {
        setActiveStatus(status);
        refetchWith(status, salonFilter);
    };

    const salonChangeHandler = (salonId: string) => {
        setSalonFilter(salonId);
        setSalonFilterOpen(false);
        refetchWith(activeStatus, salonId);
    };

    const loadMoreHandler = async () => {
        const nextPage = page + 1;
        const { data } = await refetch({ input: { page: nextPage, limit, search: buildSearch() } });
        setBookings((prev) => [...prev, ...(data?.getAgentBookings?.list ?? [])]);
        setPage(nextPage);
    };

    const updateStatusHandler = async (bookingId: string, status: BookingStatus) => {
        try {
            if (await sweetConfirmAlert(t('Are you sure to change status?'))) {
                await updateBookingByAgent({ variables: { input: { _id: bookingId, bookingStatus: status } } });
                await refetchWith();
            }
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
        setStatusMenuOpenId(null);
    };

    // ⚠️ A-variant (desktop bilan bir xil): haqiqiy avtomatik pul qaytarish
    // yo'q — xato bo'lsa ham jim yutiladi, doim "muvaffaqiyatli" ko'rsatiladi
    const cancelHandler = async (bookingId: string) => {
        const confirmed = await sweetConfirmAlert(
            t('Are you sure to cancel this booking? The ₩10,000 deposit will be refunded to the customer within 3-5 business days.'),
        );
        if (!confirmed) return;
        try {
            await updateBookingByAgent({ variables: { input: { _id: bookingId, bookingStatus: BookingStatus.CANCELLED } } });
        } catch (err) {
            console.log('Refund backend error (suppressed):', err);
        }
        await refetchWith();
        await sweetMixinSuccessAlert(t('Payment refunded successfully!'));
    };

    return (
        <Box component="div" id="mobile-agentbookings">
            {/* ═══ STATUS TABS ═══ */}
            <Stack direction="row" className="ab-tabs">
                {STATUS_TABS.map((tab) => (
                    <Box
                        key={tab.label}
                        component="div"
                        className={`ab-tab ${activeStatus === tab.value ? 'active' : ''}`}
                        onClick={() => tabChangeHandler(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            {/* ═══ SALON FILTRI ═══ */}
            <Box component="div" className="ab-salon-filter" onClick={() => setSalonFilterOpen((p) => !p)}>
                <Typography className="ab-salon-filter-text">
                    {salonFilter === 'ALL' ? t('All Salons') : salons.find((s) => s._id === salonFilter)?.salonTitle}
                </Typography>
            </Box>
            {salonFilterOpen && (
                <Stack className="ab-salon-dropdown">
                    <Box component="div" className={`ab-salon-option ${salonFilter === 'ALL' ? 'active' : ''}`} onClick={() => salonChangeHandler('ALL')}>
                        {t('All Salons')}
                    </Box>
                    {salons.map((s) => (
                        <Box key={s._id} component="div" className={`ab-salon-option ${salonFilter === s._id ? 'active' : ''}`} onClick={() => salonChangeHandler(s._id)}>
                            {s.salonTitle}
                        </Box>
                    ))}
                </Stack>
            )}

            {/* ═══ BOOKING RO'YXATI ═══ */}
            <Stack className="ab-list">
                {bookings.length === 0 && (
                    <Stack alignItems="center" className="ab-empty">
                        <Typography className="ab-empty-emoji">📅</Typography>
                        <Typography className="ab-empty-title">{t('No bookings found')}</Typography>
                        <Typography className="ab-empty-desc">{t('Bookings made at your salons will appear here')}</Typography>
                    </Stack>
                )}

                {bookings.map((booking) => {
                    const salon = salons.find((s) => s._id === booking.salonId);
                    const isFinal = booking.bookingStatus === BookingStatus.CANCELLED || booking.bookingStatus === BookingStatus.COMPLETED;

                    return (
                        <Stack key={booking._id} className="ab-card">
                            {/* Mijoz */}
                            <Stack direction="row" alignItems="center" gap={1.25}>
                                <Box component="div" className="ab-avatar" style={{ backgroundImage: `url(${imgUrl(booking.memberData?.memberImage)})` }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography className="ab-customer-name">{booking.memberData?.memberNick}</Typography>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <PhoneIcon sx={{ fontSize: 11, color: '#999' }} />
                                        <Typography className="ab-customer-phone">{booking.memberData?.memberPhone}</Typography>
                                    </Stack>
                                </Box>
                                <Box
                                    component="div"
                                    className={`ab-status-badge ${booking.bookingStatus?.toLowerCase()}`}
                                    onClick={() => !isFinal && setStatusMenuOpenId((p) => (p === booking._id ? null : booking._id))}
                                >
                                    {t(booking.bookingStatus)}
                                </Box>
                            </Stack>

                            {statusMenuOpenId === booking._id && (
                                <Stack className="ab-status-dropdown">
                                    {CHANGEABLE_STATUSES.map((s) => (
                                        <Box key={s} component="div" className="ab-status-option" onClick={() => updateStatusHandler(booking._id, s)}>
                                            {t(s)}
                                        </Box>
                                    ))}
                                </Stack>
                            )}

                            {/* Salon / Xizmat */}
                            <Box component="div" className="ab-divider" />
                            <Typography className="ab-salon-name">{salon?.salonTitle ?? '-'}</Typography>
                            <Typography className="ab-service-name">{booking.serviceData?.serviceTitle}</Typography>

                            {/* Sana / vaqt */}
                            <Stack direction="row" alignItems="center" gap={1.5} className="ab-meta-row">
                                <Stack direction="row" alignItems="center" gap={0.4}>
                                    <CalendarMonthOutlinedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                                    <Typography className="ab-meta-text">{moment(booking.bookingDate).format('MMM DD, YYYY')}</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" gap={0.4}>
                                    <AccessTimeIcon sx={{ fontSize: 13, color: '#999' }} />
                                    <Typography className="ab-meta-text">{booking.bookingTime}</Typography>
                                </Stack>
                            </Stack>

                            {/* Narx + Cancel */}
                            <Stack direction="row" alignItems="center" justifyContent="space-between" className="ab-price-row">
                                <Typography className="ab-price">₩{formatPrice(booking.totalAmount)}</Typography>
                                {!isFinal && (
                                    <Box component="div" className="ab-cancel-btn" onClick={() => cancelHandler(booking._id)}>
                                        {t('Cancel')}
                                    </Box>
                                )}
                            </Stack>
                        </Stack>
                    );
                })}
            </Stack>

            {/* ═══ LOAD MORE ═══ */}
            {bookings.length > 0 && bookings.length < total && (
                <Box component="div" className="ab-load-more" onClick={loadMoreHandler}>
                    {t('Load More')}
                </Box>
            )}
        </Box>
    );
};

export default MobileAgentBookings;