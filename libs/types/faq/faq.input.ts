import { FaqCategory, FaqStatus } from '../../enums/faq.enum';
import { Direction } from '../common';

interface AFISearch {
	faqStatus?: FaqStatus;
	faqCategory?: FaqCategory;
	text?: string;
}

export interface AllFaqsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AFISearch;
}

interface FISearch {
	faqCategory?: FaqCategory;
}

export interface FaqsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: FISearch;
}
