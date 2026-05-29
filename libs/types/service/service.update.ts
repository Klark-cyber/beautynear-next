import { ServiceStatus, ServiceType } from '../../enums/service.enum';

export interface ServiceUpdate {
	_id: string;
	serviceType?: ServiceType;
	serviceStatus?: ServiceStatus;
	serviceTitle?: string;
	serviceDesc?: string;
	servicePrice?: number;
	serviceDuration?: number;
	serviceImages?: string[];
	deletedAt?: Date;
}