import { JwtPayload } from 'jwt-decode';

export interface CustomJwtPayload extends JwtPayload {
	_id: string;
	memberType: string;
	memberStatus: string;
	memberAuthType: string;
	memberPhone: string;
	memberNick: string;
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
	memberViews: number;
	memberWarnings: number;
	memberBlocks: number;
	memberLatitude?: number;
	memberLongitude?: number;
}