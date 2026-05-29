import { SalonLocation, SalonStatus, SalonType } from '../../enums/salon.enum';

export interface SalonUpdate {
    _id: string;
    salonType?: SalonType;
    salonStatus?: SalonStatus;
    salonLocation?: SalonLocation;
    salonAddress?: string;
    salonTitle?: string;
    salonDesc?: string;
    salonImages?: string[];
    salonPhone?: string;
    salonWorkHours?: string;
    salonInstagram?: string;
    salonLatitude?: number;
    salonLongitude?: number;
    deletedAt?: Date;
}