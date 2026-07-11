import React from 'react';
import Link from 'next/link';
import { Menu, MenuItem, Chip, IconButton, Stack, Typography, Box, Tooltip } from '@mui/material';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import moment from 'moment';
import { Booking } from '../../../types/booking/booking';
import { BookingStatus } from '../../../enums/booking.enum';

interface BookingListProps {
    bookings: Booking[];
    anchorEl: any[];
    menuIconClickHandler: (e: any, index: number) => void;
    menuIconCloseHandler: () => void;
    updateBookingHandler: (data: { _id: string; bookingStatus: BookingStatus }) => void;
    cancelBookingHandler: (id: string) => void;
}

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'paused',
    CONFIRMED: 'active',
    COMPLETED: 'active',
    CANCELLED: 'deleted',
};

// Umumiy dropdown'da faqat CANCELLED bo'lmagan holatlar ko'rsatiladi —
// bekor qilish alohida, maxsus tugma orqali (cancelBookingByAdmin)
const CHANGEABLE_STATUSES = [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const BookingList = (props: BookingListProps) => {
    const { bookings, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateBookingHandler, cancelBookingHandler } = props;

    return (
        <Stack className="admin-member-table">
            {/* Sarlavha qatori */}
            <Stack direction="row" alignItems="center" className="admin-table-head">
                <Typography className="th" sx={{ flex: '0 0 200px' }}>Member</Typography>
                <Typography className="th" sx={{ flex: '0 0 220px' }}>Salon / Service</Typography>
                <Typography className="th" sx={{ flex: '0 0 160px' }}>Date / Time</Typography>
                <Typography className="th" sx={{ flex: '0 0 110px' }} align="center">Amount</Typography>
                <Typography className="th" sx={{ flex: '0 0 100px' }} align="center">Payment</Typography>
                <Typography className="th" sx={{ flex: '0 0 130px' }} align="center">Status</Typography>
                <Typography className="th" sx={{ flex: '0 0 60px' }} align="center">-</Typography>
            </Stack>

            {bookings.length === 0 && (
                <Stack alignItems="center" className="admin-no-data">
                    <Typography>No bookings found</Typography>
                </Stack>
            )}

            {bookings.map((booking, index) => (
                <Stack key={booking._id} direction="row" alignItems="center" className="admin-table-row">
                    {/* Member */}
                    <Box sx={{ flex: '0 0 200px', minWidth: 0 }}>
                        <Link href={`/member?memberId=${booking.memberData?._id}`}>
                            <Typography className="member-nick" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {booking.memberData?.memberNick ?? '-'}
                            </Typography>
                        </Link>
                        <Typography className="member-fullname">{booking.memberData?.memberPhone ?? ''}</Typography>
                    </Box>

                    {/* Salon / Service */}
                    <Box sx={{ flex: '0 0 220px', minWidth: 0 }}>
                        <Typography className="member-nick" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.salonData?.salonTitle ?? '-'}
                        </Typography>
                        <Typography className="member-fullname" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.serviceData?.serviceTitle ?? ''}
                        </Typography>
                    </Box>

                    {/* Date / Time */}
                    <Box sx={{ flex: '0 0 160px' }}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <CalendarMonthOutlinedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                            <Typography className="td">{moment(booking.bookingDate).format('MMM DD, YYYY')}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.3 }}>
                            <AccessTimeIcon sx={{ fontSize: 13, color: '#999' }} />
                            <Typography className="td">{booking.bookingTime}</Typography>
                        </Stack>
                    </Box>

                    {/* Amount */}
                    <Box sx={{ flex: '0 0 110px', textAlign: 'center' }}>
                        <Typography className="member-nick" sx={{ fontSize: '13.5px !important', color: '#FF4D8D !important' }}>
                            ₩{formatPrice(booking.totalAmount)}
                        </Typography>
                    </Box>

                    {/* Payment */}
                    <Box sx={{ flex: '0 0 100px', textAlign: 'center' }}>
                        <Chip
                            label={booking.paymentStatus}
                            size="small"
                            className={`admin-chip status-${booking.paymentStatus === 'PAID' ? 'active' : booking.paymentStatus === 'REFUNDED' ? 'deleted' : 'paused'}`}
                        />
                    </Box>

                    {/* Status */}
                    <Box sx={{ flex: '0 0 130px', textAlign: 'center' }}>
                        <Chip
                            label={booking.bookingStatus}
                            size="small"
                            className={`admin-chip status-${STATUS_COLOR[booking.bookingStatus]}`}
                            onClick={(e) => {
                                if (booking.bookingStatus !== BookingStatus.CANCELLED) menuIconClickHandler(e, index);
                            }}
                        />
                        <Menu
                            anchorEl={anchorEl[index]}
                            open={Boolean(anchorEl[index])}
                            onClose={menuIconCloseHandler}
                            PaperProps={{ sx: { borderRadius: 2, mt: 0.5 } }}
                        >
                            {CHANGEABLE_STATUSES
                                .filter((v) => v !== booking.bookingStatus)
                                .map((status) => (
                                    <MenuItem key={status} onClick={() => updateBookingHandler({ _id: booking._id, bookingStatus: status })}>
                                        {status}
                                    </MenuItem>
                                ))}
                        </Menu>
                    </Box>

                    {/* Cancel — alohida, maxsus tugma */}
                    <Box sx={{ flex: '0 0 60px', textAlign: 'center' }}>
                        {booking.bookingStatus !== BookingStatus.CANCELLED && booking.bookingStatus !== BookingStatus.COMPLETED && (
                            <Tooltip title="Cancel booking">
                                <IconButton size="small" onClick={() => cancelBookingHandler(booking._id)}>
                                    <CancelOutlinedIcon sx={{ fontSize: 18, color: '#FF4D6A' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Stack>
            ))}
        </Stack>
    );
};

export default BookingList;