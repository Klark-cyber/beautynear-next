import { ServiceStatus, ServiceType } from '../../enums/service.enum';
import { SalonLocation } from '../../enums/salon.enum';
import { Direction } from '../../enums/common.enum';

export interface ServiceInput {
	serviceType: ServiceType;
	serviceTitle: string;
	serviceDesc?: string;
	servicePrice: number;
	serviceDuration: number;
	serviceImages?: string[];
	salonId: string;
	memberId?: string;
}

interface SVISearch {
	memberId?: string;
	salonId?: string;
	typeList?: ServiceType[];
	locationList?: SalonLocation[];
	priceMin?: number;
	priceMax?: number;
	durationMax?: number;
	text?: string;
}

export interface ServicesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: SVISearch;
}

interface ASVISearch {
	serviceStatus?: ServiceStatus;
}

export interface AgentServicesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: ASVISearch;
}

interface ALSVISearch {
	serviceStatus?: ServiceStatus;
	typeList?: ServiceType[];
}

export interface AllServicesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: ALSVISearch;
}