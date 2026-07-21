import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Chip, Select, MenuItem, TablePagination } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useMutation, useQuery } from '@apollo/client';
import moment from 'moment';
import { GET_ALL_BOOKINGS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_BOOKING_BY_ADMIN, CANCEL_BOOKING_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Booking } from '../../../libs/types/booking/booking';
import { BookingStatus } from '../../../libs/enums/booking.enum';
import { T } from '../../../libs/types/common';
import { REACT_APP_API_URL } from '../../../libs/config';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

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

const STATUS_CHIP: Record<string, string> = {
    PENDING: 'status-paused',
    CONFIRMED: 'status-active',
    COMPLETED: 'status-active',
    CANCELLED: 'status-deleted',
};

const CHANGEABLE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.CANCELLED];

const limit = 10;

/* ─── Component ───────────────────────────────────────────────────────────── */

// ⚠️ MUHIM: bu sahifa avval AGENT'ning o'z GET_AGENT_BOOKINGS so'rovidan
// FOYDALANAR EDI (hatto ichki nomi ham "AgentBookings" edi, withAdminLayout
// ham yo'q edi) — shuning uchun Admin uchun HECH QANDAY ma'lumot
// qaytmasdi (chunki bu so'rov faqat joriy login qilgan AGENT'ning o'z
// salonlariga tegishli bronlarni qaytaradi). Endi to'g'ri
// GET_ALL_BOOKINGS_BY_ADMIN ishlatiladi va admin CSS'ga ulanadi.

const AdminBookings: NextPage = () => {
    const [activeStatus, setActiveStatus] = useState<BookingStatus | undefined>(undefined);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(limit);

    /** APOLLO REQUESTS **/
    const [updateBookingByAdmin] = useMutation(UPDATE_BOOKING_BY_ADMIN);
    const [cancelBookingByAdmin] = useMutation(CANCEL_BOOKING_BY_ADMIN);

    const buildSearch = (): T => {
        const search: T = {};
        if (activeStatus) search.bookingStatus = activeStatus;
        return search;
    };

    const { refetch } = useQuery(GET_ALL_BOOKINGS_BY_ADMIN, {
        fetchPolicy: 'network-only',
        variables: { input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } },
        onCompleted: (data: T) => {
            setBookings(data?.getAllBookingsByAdmin?.list ?? []);
            setTotal(data?.getAllBookingsByAdmin?.metaCounter?.[0]?.total ?? 0);
        },
    });

    useEffect(() => {
        refetch({ input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
            setBookings(data?.getAllBookingsByAdmin?.list ?? []);
            setTotal(data?.getAllBookingsByAdmin?.metaCounter?.[0]?.total ?? 0);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStatus, page, rowsPerPage]);

    /** HANDLERS **/
    const updateStatusHandler = async (bookingId: string, status: BookingStatus) => {
        try {
            if (await sweetConfirmAlert(`Are you sure to change status to ${status}?`)) {
                // ⚠️ TUZATILDI: "Cancelled" holatiga o'tkazish avval oddiy
                // updateBookingByAdmin orqali yuborilardi — bu esa faqat
                // maydonni yangilaydi, TossPayments orqali zakladni QAYTARISH
                // (refund) mantig'ini UMUMAN ishga tushirmaydi. Backend'da
                // buning uchun to'g'ri, refund'ni ham bajaradigan
                // cancelBookingByAdmin allaqachon mavjud edi — u shunchaki bu
                // sahifadan hech qachon chaqirilmagan edi. Endi "Cancelled"
                // tanlanganda aynan shu, refund'li mutatsiya ishlatiladi.
                if (status === BookingStatus.CANCELLED) {
                    await cancelBookingByAdmin({ variables: { input: bookingId } });
                } else {
                    await updateBookingByAdmin({ variables: { input: { _id: bookingId, bookingStatus: status } } });
                }
                await refetch({ input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } });
            }
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    return (
        <Box component="div" className="admin-content">
            <Typography className="admin-page-title">Booking Management</Typography>
            <Typography className="admin-page-subtitle">View and manage all bookings across the platform</Typography>

            <Stack direction="row" gap={1.5} className="admin-filter-tabs">
                {STATUS_TABS.map((tab) => (
                    <Box
                        key={tab.label}
                        component="div"
                        className={`admin-filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
                        onClick={() => setActiveStatus(tab.value)}
                    >
                        {tab.label}
                    </Box>
                ))}
            </Stack>

            <Box component="div" className="admin-table-frame">
                <Stack direction="row" alignItems="center" className="admin-table-head">
                    <Typography className="th" sx={{ width: '22%' }}>CUSTOMER</Typography>
                    <Typography className="th" sx={{ width: '22%' }}>SALON / SERVICE</Typography>
                    <Typography className="th" sx={{ width: '18%' }}>DATE / TIME</Typography>
                    <Typography className="th" sx={{ width: '15%' }}>STATUS</Typography>
                    <Typography className="th" sx={{ width: '13%' }}>PRICE</Typography>
                </Stack>

                {bookings.length === 0 && (
                    <Stack alignItems="center" className="admin-no-data">
                        <Typography>No bookings found</Typography>
                    </Stack>
                )}

                {bookings.map((booking: any) => (
                    <Stack key={booking._id} direction="row" alignItems="center" className="admin-table-row">
                        <Stack direction="row" alignItems="center" gap={1.25} sx={{ width: '22%', minWidth: 0 }}>
                            <Box
                                component="div"
                                sx={{
                                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                    backgroundImage: `url(${imgUrl(booking.memberData?.memberImage)})`,
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography className="member-nick" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {booking.memberData?.memberNick}
                                </Typography>
                                <Typography className="member-fullname">{booking.memberData?.memberPhone}</Typography>
                            </Box>
                        </Stack>

                        <Box sx={{ width: '22%', minWidth: 0 }}>
                            <Typography className="td" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {booking.salonData?.salonTitle ?? '-'}
                            </Typography>
                            <Typography className="member-fullname">{booking.serviceData?.serviceTitle}</Typography>
                        </Box>

                        <Box sx={{ width: '18%' }}>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                                <CalendarMonthOutlinedIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
                                <Typography className="td" sx={{ fontSize: '13px !important' }}>{moment(booking.bookingDate).format('MMM DD, YYYY')}</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: '#999' }} />
                                <Typography className="td" sx={{ fontSize: '13px !important' }}>{booking.bookingTime}</Typography>
                            </Stack>
                        </Box>

                        <Box sx={{ width: '15%' }}>
                            <Select
                                value={booking.bookingStatus}
                                onChange={(e) => updateStatusHandler(booking._id, e.target.value as BookingStatus)}
                                size="small"
                                sx={{ minWidth: 130, height: 36, borderRadius: 2, fontFamily: 'Inter, sans-serif', fontSize: 13 }}
                            >
                                {CHANGEABLE_STATUSES.map((s) => (
                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                            </Select>
                        </Box>

                        <Box sx={{ width: '13%' }}>
                            <Typography className="td" sx={{ fontWeight: 700, color: '#FF4D8D !important' }}>₩{formatPrice(booking.totalAmount)}</Typography>
                        </Box>
                    </Stack>
                ))}

                <TablePagination
                    rowsPerPageOptions={[10, 20, 40]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            </Box>
        </Box>
    );
};

export default withAdminLayout(AdminBookings);