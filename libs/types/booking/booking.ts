import { BookingStatus, PaymentStatus } from '../../enums/booking.enum';
import { TotalCounter } from '../common';
import { Member } from '../member/member';
import { Salon } from '../salon/salon';
import { Service } from '../service/service';

export interface Booking {
    _id: string;
    bookingStatus: BookingStatus;
    bookingDate: Date;
    bookingTime: string;
    bookingNote?: string;
    totalAmount: number;
    depositAmount: number;
    remainAmount: number;
    paymentKey?: string;
    paymentStatus: PaymentStatus;
    serviceId: string;
    salonId: string;
    memberId: string;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    /** from aggregation **/
    memberData?: Member;
    salonData?: Salon;
    serviceData?: Service;
}

export interface Bookings {
    list: Booking[];
    metaCounter: TotalCounter[];
}