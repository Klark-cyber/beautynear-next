import { InquiryStatus } from '../../enums/inquiry.enum';
import { Direction } from '../common';

interface AISearch {
	inquiryStatus?: InquiryStatus;
	text?: string;
}

export interface AllInquiriesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: AISearch;
}

export interface InquiryInput {
	inquirySubject: string;
	inquiryMessage: string;
}

interface MyISearch {
	inquiryStatus?: InquiryStatus;
}

export interface MyInquiriesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: MyISearch;
}
