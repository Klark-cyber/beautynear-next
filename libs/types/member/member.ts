import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked, TotalCounter } from '../common';
import { MeFollowed } from '../follow/follow';

export interface Member {
	_id: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	agentRequestStatus?: string; // ⚠️ YANGI
	memberAuthType: MemberAuthType;
	memberPhone: string;
	memberNick: string;
	memberPassword?: string;
	memberFullName?: string;
	memberImage?: string;
	memberPortfolio?: string[];
	memberAddress?: string;
	memberDesc?: string;
	memberExperience?: number;
	memberSpecialty?: string[];
	memberSalons: number;
	memberRank: number;
	memberArticles: number;
	memberPoints: number;
	memberLikes: number;
	memberFollowers?: number;
	memberFollowings?: number;
	memberViews: number;
	memberComments: number;
	memberWarnings: number;
	memberBlocks: number;
	memberLatitude?: number;
	memberLongitude?: number;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
	accessToken?: string;
}

export interface Members {
	list: Member[];
	metaCounter: TotalCounter[];
}