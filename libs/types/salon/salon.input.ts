import { SalonLocation, SalonStatus, SalonType } from '../../enums/salon.enum';
import { Direction } from '../../enums/common.enum';

export interface SalonInput {
    salonType: SalonType;
    salonLocation: SalonLocation;
    salonAddress: string;
    salonTitle: string;
    salonDesc?: string;
    salonImages: string[];
    salonPhone: string;
    salonWorkHours: string;
    salonInstagram?: string;
    salonLatitude?: number;
    salonLongitude?: number;
    memberId?: string;
}

interface SISearch {
    memberId?: string;
    locationList?: SalonLocation[];
    typeList?: SalonType[];
    latitude?: number;
    longitude?: number;
    radius?: number;
    priceMin?: number;       // yangi — price filter uchun
    priceMax?: number;       // yangi — price filter uchun
    text?: string;
}

export interface SalonsInquiry {
    page: number;
    limit: number;
    sort?: string;
    direction?: Direction;
    search: SISearch;
}

interface ASISearch {
    salonStatus?: SalonStatus;
}

export interface AgentSalonsInquiry {
    page: number;
    limit: number;
    sort?: string;
    direction?: Direction;
    search: ASISearch;
}

interface ALSISearch {
    salonStatus?: SalonStatus;
    salonLocationList?: SalonLocation[];
}

export interface AllSalonsInquiry {
    page: number;
    limit: number;
    sort?: string;
    direction?: Direction;
    search: ALSISearch;
}

export interface OrdinaryInquiry {
    page: number;
    limit: number;
}