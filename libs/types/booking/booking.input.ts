import { BookingStatus } from '../../enums/booking.enum';
import { Direction } from '../../enums/common.enum';

export interface BookingInput {
    bookingDate: Date;
    bookingTime: string;
    bookingNote?: string;
    serviceId: string;
    salonId: string;
    paymentKey: string;
    memberId?: string;
}

interface BISearch {
    bookingStatus?: BookingStatus;
}

export interface BookingsInquiry {
    page: number;
    limit: number;
    sort?: string;
    direction?: Direction;
    search: BISearch;
}

interface ABISearch {
    bookingStatus?: BookingStatus;
    salonId?: string;
}

export interface AgentBookingsInquiry {
    page: number;
    limit: number;
    sort?: string;
    direction?: Direction;
    search: ABISearch;
}