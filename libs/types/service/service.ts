import { ServiceStatus, ServiceType } from '../../enums/service.enum';
import { MeLiked, TotalCounter } from '../common';
import { Member } from '../member/member';
import { Salon } from '../salon/salon';

export interface Service {
	_id: string;
	serviceType: ServiceType;
	serviceStatus: ServiceStatus;
	serviceTitle: string;
	serviceDesc?: string;
	servicePrice: number;
	serviceDuration: number;
	serviceImages?: string[];
	serviceViews: number;
	serviceLikes: number;
	serviceComments: number;
	serviceRank: number;
	serviceRating: number;
	salonId: string;
	memberId: string;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	memberData?: Member;
	salonData?: Salon;
}

export interface Services {
	list: Service[];
	metaCounter: TotalCounter[];
}