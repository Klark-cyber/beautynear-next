import React, { useCallback, useMemo, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Stack, Box, Typography, Chip, Pagination as MuiPagination } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import moment from 'moment';
import { useQuery } from '@apollo/client';
import { GET_MY_BOOKINGS } from '../../../apollo/user/query';
import { BookingStatus } from '../../enums/booking.enum';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const imgUrl = (raw?: string, fallback = '/img/banner/default.jpg'): string => {
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

    const [activeTab, setActiveTab] = useState<string>('UPCOMING');
    const [bookings, setBookings] = useState<any[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const limit = 6;

    /** APOLLO **/
    useQuery(GET_MY_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: { input: { page, limit, sort: 'bookingDate', direction: 'DESC', search: {} } },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setBookings(data?.getMyBookings?.list ?? []);
            setTotal(data?.getMyBookings?.metaCounter?.[0]?.total ?? 0);
        },
    });

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

                                {/* O'ng: status + narx + View */}
                                <Stack className="booking-right" alignItems="flex-end" justifyContent="space-between">
                                    <Chip label={t(badge.label)} size="small" className={`status-badge ${badge.cls}`} />
                                    <Typography className="booking-price">₩{formatPrice(booking.totalAmount)}</Typography>
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
        </Box>
    );
};

export default MyBookings;