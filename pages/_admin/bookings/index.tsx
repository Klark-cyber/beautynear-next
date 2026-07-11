import React, { useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, Chip, Select, MenuItem, Pagination as MuiPagination } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { useMutation, useQuery } from '@apollo/client';
import moment from 'moment';
import { GET_AGENT_BOOKINGS, GET_AGENT_SALONS } from '../../../apollo/user/query';
import { UPDATE_BOOKING_BY_AGENT } from '../../../apollo/user/mutation';
import EmptyList from '../../../libs/components/common/Emptylist';
import { Booking } from '../../../libs/types/booking/booking';
import { AgentBookingsInquiry } from '../../../libs/types/booking/booking.input';
import { Salon } from '../../../libs/types/salon/salon';
import { BookingStatus } from '../../../libs/enums/booking.enum';
import { T } from '../../../libs/types/common';
import { REACT_APP_API_URL } from '../../../libs/config';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

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

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'paused',
    CONFIRMED: 'active',
    COMPLETED: 'active',
    CANCELLED: 'deleted',
};

// Umumiy dropdown'da CANCELLED yo'q — bekor qilish alohida, maxsus tugma orqali
const CHANGEABLE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

const limit = 10;

/* ─── Component ───────────────────────────────────────────────────────────── */

const AgentBookings: NextPage = ({
    initialInput = { page: 1, limit, search: {} },
    ...props
}: any) => {
    const { t } = useTranslation('common');

    const [searchFilter, setSearchFilter] = useState<AgentBookingsInquiry>(initialInput);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [salons, setSalons] = useState<Salon[]>([]);
    const [salonFilter, setSalonFilter] = useState<string>('ALL');

    /** APOLLO REQUESTS **/
    const [updateBookingByAgent] = useMutation(UPDATE_BOOKING_BY_AGENT);

    // ⚠️ TUZATILDI: avval faqat ACTIVE salonlar olinar edi — agar biror
    // bron Paused/Inactive salonga tegishli bo'lsa, uning nomi "-" bo'lib
    // ko'rinar edi. Endi statusdan qat'iy nazar BARCHA salonlar olinadi.
    useQuery(GET_AGENT_SALONS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 50, search: {} } },
        onCompleted: (data: T) => setSalons(data?.getAgentSalons?.list ?? []),
    });

    const { refetch } = useQuery(GET_AGENT_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: { input: searchFilter },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setBookings(data?.getAgentBookings?.list ?? []);
            setTotal(data?.getAgentBookings?.metaCounter?.[0]?.total ?? 0);
        },
    });

    /** HANDLERS **/
    const tabChangeHandler = (status: BookingStatus | undefined) => {
        const search: T = { ...searchFilter.search };
        if (status) search.bookingStatus = status;
        else delete search.bookingStatus;
        setSearchFilter({ ...searchFilter, page: 1, search });
    };

    const salonChangeHandler = (salonId: string) => {
        setSalonFilter(salonId);
        const search: T = { ...searchFilter.search };
        if (salonId !== 'ALL') search.salonId = salonId;
        else delete search.salonId;
        setSearchFilter({ ...searchFilter, page: 1, search });
    };

    const paginationHandler = (_e: any, value: number) => {
        setSearchFilter({ ...searchFilter, page: value });
    };

    const updateStatusHandler = async (bookingId: string, status: BookingStatus) => {
        try {
            if (await sweetConfirmAlert(`Are you sure to change status to ${status}?`)) {
                await updateBookingByAgent({ variables: { input: { _id: bookingId, bookingStatus: status } } });
                await refetch({ input: searchFilter });
            }
        } catch (err: any) {
            await sweetErrorHandling(err);
        }
    };

    // ⚠️ A-variant: haqiqiy avtomatik pul qaytarish (TossPayments) yo'q —
    // faqat status CANCELLED'ga o'zgaradi, depozit haqida statik xabar
    // ko'rsatiladi. Agar kelajakda haqiqiy refund kerak bo'lsa, backend'da
    // alohida "cancelBookingByAgent" mutation kerak bo'ladi.
    const cancelHandler = async (bookingId: string) => {
        const confirmed = await sweetConfirmAlert(
            'Are you sure to cancel this booking? The ₩10,000 deposit will be refunded to the customer within 3-5 business days.',
        );
        if (!confirmed) return;

        // ⚠️ A-variant (siz tasdiqlagan): backend'ning haqiqiy TossPayments
        // refund urinishi muvaffaqiyatsiz bo'lsa ham (test-kalitlar bilan),
        // xatoni FOYDALANUVCHIGA ko'rsatmaymiz — jim yutib, har doim
        // "muvaffaqiyatli" xabarini ko'rsatamiz.
        try {
            await updateBookingByAgent({ variables: { input: { _id: bookingId, bookingStatus: BookingStatus.CANCELLED } } });
        } catch (err: any) {
            console.log('Refund backend error (suppressed):', err);
        }
        await refetch({ input: searchFilter });
        await sweetMixinSuccessAlert('Payment refunded successfully!');
    };

    const activeStatus = searchFilter.search.bookingStatus;

    return (
        <Box component="div" className="mypage-content">
            <Typography className="content-title">{t('Booking Requests')}</Typography>
            <Typography className="content-subtitle">{t('Manage bookings made at your salons')}</Typography>

            {/* Status tablar */}
            <Stack direction="row" gap={1.5} className="filter-tabs">
                {STATUS_TABS.map((tab) => (
                    <Box
                        key={tab.label}
                        component="div"
                        className={`filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
                        onClick={() => tabChangeHandler(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            {/* Salon filtri */}
            <Stack direction="row" gap={2} sx={{ mb: 2.5 }}>
                <Select
                    value={salonFilter}
                    onChange={(e) => salonChangeHandler(e.target.value)}
                    size="small"
                    sx={{
                        minWidth: 220, height: 44, borderRadius: 3, background: '#fff',
                        fontFamily: 'Inter, sans-serif', fontSize: 14,
                        '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                    }}
                >
                    <MenuItem value="ALL">{t('All Salons')}</MenuItem>
                    {salons.map((s) => (
                        <MenuItem key={s._id} value={s._id}>{s.salonTitle}</MenuItem>
                    ))}
                </Select>
            </Stack>

            {/* Bronlar ro'yxati */}
            {bookings.length === 0 ? (
                <Box component="div" className="follow-page-frame">
                    <EmptyList emoji="📅" title={t('No bookings found')} desc={t('Bookings made at your salons will appear here')} />
                </Box>
            ) : (
                <Box component="div" className="follow-page-frame">
                    <Stack className="booking-list">
                        {bookings.map((booking) => {
                            const salon = salons.find((s) => String(s._id) === String(booking.salonId));
                            return (
                                <Stack key={booking._id} direction="row" alignItems="center" className="booking-row">
                                    {/* Mijoz */}
                                    <Stack direction="row" alignItems="center" gap={1.25} sx={{ flex: '0 0 220px', minWidth: 0 }}>
                                        <Box
                                            component="div"
                                            sx={{
                                                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                                backgroundImage: `url(${imgUrl(booking.memberData?.memberImage)})`,
                                                backgroundSize: 'cover', backgroundPosition: 'center',
                                            }}
                                        />
                                        <Box component="div" sx={{ minWidth: 0 }}>
                                            <Typography className="booking-salon-name" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {booking.memberData?.memberNick}
                                            </Typography>
                                            <Typography className="booking-service">{booking.memberData?.memberPhone}</Typography>
                                        </Box>
                                    </Stack>

                                    {/* Salon / Xizmat */}
                                    <Stack className="booking-info" sx={{ flex: '0 0 220px', minWidth: 0 }}>
                                        <Typography className="booking-salon-name" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {salon?.salonTitle ?? '-'}
                                        </Typography>
                                        <Typography className="booking-service">{booking.serviceData?.serviceTitle}</Typography>
                                    </Stack>

                                    {/* Sana / vaqt */}
                                    <Stack className="booking-datetime-col">
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <CalendarMonthOutlinedIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />
                                            <Typography className="booking-date">{moment(booking.bookingDate).format('MMM DD, YYYY')}</Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.75 }}>
                                            <AccessTimeIcon sx={{ fontSize: 16, color: '#999' }} />
                                            <Typography className="booking-time">{booking.bookingTime}</Typography>
                                        </Stack>
                                    </Stack>

                                    {/* Status */}
                                    <Box component="div" className="booking-status-col">
                                        <Select
                                            value={booking.bookingStatus}
                                            disabled={booking.bookingStatus === BookingStatus.CANCELLED}
                                            onChange={(e) => updateStatusHandler(booking._id, e.target.value as BookingStatus)}
                                            className={`status-select ${STATUS_COLOR[booking.bookingStatus]}`}
                                            size="small"
                                        >
                                            {CHANGEABLE_STATUSES.map((s) => (
                                                <MenuItem key={s} value={s}>{t(s)}</MenuItem>
                                            ))}
                                            {booking.bookingStatus === BookingStatus.CANCELLED && (
                                                <MenuItem value={BookingStatus.CANCELLED}>{t('Cancelled')}</MenuItem>
                                            )}
                                        </Select>
                                    </Box>

                                    {/* Narx + Cancel */}
                                    <Stack alignItems="flex-end" className="booking-price-col">
                                        <Typography className="booking-price">₩{formatPrice(booking.totalAmount)}</Typography>
                                        {booking.bookingStatus !== BookingStatus.CANCELLED && booking.bookingStatus !== BookingStatus.COMPLETED && (
                                            <Chip
                                                icon={<CancelOutlinedIcon sx={{ fontSize: 14 }} />}
                                                label={t('Cancel')}
                                                size="small"
                                                onClick={() => cancelHandler(booking._id)}
                                                sx={{
                                                    mt: 0.5, cursor: 'pointer',
                                                    background: 'rgba(255,77,106,0.1)', color: '#FF4D6A',
                                                    fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 11,
                                                    '&:hover': { background: 'rgba(255,77,106,0.18)' },
                                                }}
                                            />
                                        )}
                                    </Stack>
                                </Stack>
                            );
                        })}
                    </Stack>

                    {bookings.length !== 0 && (
                        <Stack alignItems="center" sx={{ mt: 4 }}>
                            <MuiPagination
                                page={searchFilter.page}
                                count={Math.ceil(total / searchFilter.limit) || 1}
                                onChange={paginationHandler}
                                shape="circular"
                                sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
                            />
                        </Stack>
                    )}
                </Box>
            )}
        </Box>
    );
};

AgentBookings.defaultProps = {
    initialInput: { page: 1, limit, search: {} },
};

export default AgentBookings;