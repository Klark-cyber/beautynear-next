import { SalonLocation, SalonStatus, SalonType } from '../../enums/salon.enum';
import { MeLiked, TotalCounter } from '../common';
import { Member } from '../member/member';
import { MeFollowed } from '../follow/follow';

export interface Salon {
    _id: string;
    salonType: SalonType;
    salonStatus: SalonStatus;
    salonLocation: SalonLocation;
    salonAddress: string;
    salonTitle: string;
    salonDesc?: string;
    salonImages: string[];
    salonPhone: string;
    salonWorkHours: string;
    salonInstagram?: string;
    salonViews: number;
    salonLikes: number;
    salonComments: number;
    salonRating?: number;
    salonRank: number;
    salonFollowers: number;
    depositAmount: number;
    salonLatitude?: number;
    salonLongitude?: number;
    memberId: string;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    /** from aggregation **/
    meLiked?: MeLiked[];
    meFollowed?: MeFollowed[];
    memberData?: Member;
}

export interface Salons {
    list: Salon[];
    metaCounter: TotalCounter[];
}