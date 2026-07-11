import { NoticeType, NoticeStatus } from '../../enums/notice.enum';

export interface Notice {
	_id: string;
	noticeType: NoticeType;
	noticeStatus: NoticeStatus;
	noticeTitle: string;
	noticeContent: string;
	noticeViews: number;
	noticePinned: boolean;
	createdAt: Date;
	updatedAt: Date;
}
