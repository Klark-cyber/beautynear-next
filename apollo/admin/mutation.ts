import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const UPDATE_MEMBER_BY_ADMIN = gql`
	mutation UpdateMemberByAdmin($input: MemberUpdate!) {
		updateMemberByAdmin(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberSalons
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			memberWarnings
			memberBlocks
			memberExperience
			memberSpecialty
			memberLatitude
			memberLongitude
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

/**************************
 *         SALON          *
 *************************/

export const UPDATE_SALON_BY_ADMIN = gql`
	mutation UpdateSalonByAdmin($input: SalonUpdate!) {
		updateSalonByAdmin(input: $input) {
			_id
			salonType
			salonStatus
			salonLocation
			salonAddress
			salonTitle
			salonDesc
			salonImages
			salonPhone
			salonWorkHours
			salonViews
			salonLikes
			salonComments
			salonRank
			salonFollowers
			depositAmount
			memberId
			deletedAt
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_SALON_BY_ADMIN = gql`
	mutation RemoveSalonByAdmin($input: String!) {
		removeSalonByAdmin(salonId: $input) {
			_id
			salonType
			salonStatus
			salonTitle
			memberId
			deletedAt
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *        SERVICE         *
 *************************/

export const UPDATE_SERVICE_BY_ADMIN = gql`
	mutation UpdateServiceByAdmin($input: ServiceUpdate!) {
		updateServiceByAdmin(input: $input) {
			_id
			serviceType
			serviceStatus
			serviceTitle
			servicePrice
			serviceDuration
			serviceViews
			serviceLikes
			serviceComments
			serviceRank
			serviceRating
			salonId
			memberId
			deletedAt
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_SERVICE_BY_ADMIN = gql`
	mutation RemoveServiceByAdmin($input: String!) {
		removeServiceByAdmin(serviceId: $input) {
			_id
			serviceType
			serviceStatus
			serviceTitle
			salonId
			memberId
			deletedAt
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *        BOOKING         *
 *************************/

export const UPDATE_BOOKING_BY_ADMIN = gql`
	mutation UpdateBookingByAdmin($input: BookingUpdate!) {
		updateBookingByAdmin(input: $input) {
			_id
			bookingStatus
			bookingDate
			bookingTime
			totalAmount
			depositAmount
			remainAmount
			paymentStatus
			serviceId
			salonId
			memberId
			deletedAt
			updatedAt
		}
	}
`;

export const CANCEL_BOOKING_BY_ADMIN = gql`
	mutation CancelBookingByAdmin($input: String!) {
		cancelBookingByAdmin(bookingId: $input) {
			_id
			bookingStatus
			paymentStatus
			deletedAt
			updatedAt
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const UPDATE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation UpdateBoardArticleByAdmin($input: BoardArticleUpdate!) {
		updateBoardArticleByAdmin(input: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation RemoveBoardArticleByAdmin($input: String!) {
		removeBoardArticleByAdmin(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const REMOVE_COMMENT_BY_ADMIN = gql`
	mutation RemoveCommentByAdmin($input: String!) {
		removeCommentByAdmin(commentId: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;
/**************************
 *           FAQ          *
 *************************/

export const CREATE_FAQ_BY_ADMIN = gql`
	mutation CreateFaqByAdmin($input: FaqInput!) {
		createFaqByAdmin(input: $input) {
			_id
			faqCategory
			faqStatus
			faqQuestion
			faqAnswer
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_FAQ_BY_ADMIN = gql`
	mutation UpdateFaqByAdmin($input: FaqUpdate!) {
		updateFaqByAdmin(input: $input) {
			_id
			faqCategory
			faqStatus
			faqQuestion
			faqAnswer
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_FAQ_BY_ADMIN = gql`
	mutation RemoveFaqByAdmin($input: String!) {
		removeFaqByAdmin(faqId: $input) {
			_id
		}
	}
`;

/**************************
 *         NOTICE         *
 *************************/

export const CREATE_NOTICE_BY_ADMIN = gql`
	mutation CreateNoticeByAdmin($input: NoticeInput!) {
		createNoticeByAdmin(input: $input) {
			_id
			noticeType
			noticeStatus
			noticeTitle
			noticeContent
			noticeViews
			noticePinned
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_NOTICE_BY_ADMIN = gql`
	mutation UpdateNoticeByAdmin($input: NoticeUpdate!) {
		updateNoticeByAdmin(input: $input) {
			_id
			noticeType
			noticeStatus
			noticeTitle
			noticeContent
			noticeViews
			noticePinned
			createdAt
			updatedAt
		}
	}
`;

export const REMOVE_NOTICE_BY_ADMIN = gql`
	mutation RemoveNoticeByAdmin($input: String!) {
		removeNoticeByAdmin(noticeId: $input) {
			_id
		}
	}
`;

/**************************
 *         INQUIRY        *
 *************************/

export const UPDATE_INQUIRY_BY_ADMIN = gql`
	mutation UpdateInquiryByAdmin($input: InquiryUpdate!) {
		updateInquiryByAdmin(input: $input) {
			_id
			inquiryStatus
			inquirySubject
			inquiryMessage
			inquiryReply
			memberId
			createdAt
			updatedAt
		}
	}
`;
export const PROCESS_AGENT_REQUEST = gql`
	mutation ProcessAgentRequest($memberId: String!, $approve: Boolean!) {
		processAgentRequest(memberId: $memberId, approve: $approve) {
			_id
			memberType
			agentRequestStatus
		}
	}
`;