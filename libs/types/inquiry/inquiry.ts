import { InquiryStatus } from '../../enums/inquiry.enum';
import { Member } from '../member/member';

export interface Inquiry {
	_id: string;
	inquiryStatus: InquiryStatus;
	inquirySubject: string;
	inquiryMessage: string;
	inquiryReply?: string;
	memberId: string;
	createdAt: Date;
	updatedAt: Date;
	memberData?: Member;
}
