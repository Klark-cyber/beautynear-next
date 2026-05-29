import { MemberStatus, MemberType } from '../../enums/member.enum';

export interface MemberUpdate {
	_id: string;
	memberType?: MemberType;
	memberStatus?: MemberStatus;
	memberPhone?: string;
	memberNick?: string;
	memberPassword?: string;
	memberFullName?: string;
	memberImage?: string;
	memberPortfolio?: string[];
	memberAddress?: string;
	memberDesc?: string;
	memberExperience?: number;
	memberSpecialty?: string[];
	memberLatitude?: number;
	memberLongitude?: number;
	deletedAt?: Date;
}

export interface AdminMemberUpdate {
	_id: string;
	memberType?: MemberType;
	memberStatus?: MemberStatus;
	memberPhone?: string;
	memberNick?: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
	deletedAt?: Date;
}