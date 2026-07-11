import { NoticeType, NoticeStatus } from '../../enums/notice.enum';
import { Direction } from '../../enums/common.enum';

interface ANISearch {
	noticeStatus?: NoticeStatus;
	noticeType?: NoticeType;
	text?: string;
}

export interface AllNoticesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: ANISearch;
}

interface NISearch {
	noticeType?: NoticeType;
}

export interface NoticesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: NISearch;
}
