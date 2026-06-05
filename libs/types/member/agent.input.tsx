import { Direction } from '../../enums/common.enum';

interface AISearch {
	text?: string;
	memberSpecialty?: string[];
	memberLocation?: string;
	memberExperience?: number;
}

export interface AgentInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AISearch;
}