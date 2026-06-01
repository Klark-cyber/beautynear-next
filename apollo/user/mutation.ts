import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
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
			memberWarnings
			memberBlocks
			memberSalons
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			memberExperience
			memberSpecialty
			memberPortfolio
			memberLatitude
			memberLongitude
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
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
			memberWarnings
			memberBlocks
			memberSalons
			memberRank
			memberPoints
			memberLikes
			memberViews
			memberExperience
			memberSpecialty
			memberPortfolio
			memberLatitude
			memberLongitude
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
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
			memberPortfolio
			memberLatitude
			memberLongitude
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LIKE_TARGET_MEMBER = gql`
	mutation LikeTargetMember($input: String!) {
		likeTargetMember(memberId: $input) {
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
			memberWarnings
			memberBlocks
			memberSalons
			memberRank
			memberPoints
			memberLikes
			memberViews
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

export const CREATE_SALON = gql`
	mutation CreateSalon($input: SalonInput!) {
		createSalon(input: $input) {
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
			salonInstagram
			salonViews
			salonLikes
			salonComments
			salonRank
			salonFollowers
			depositAmount
			salonLatitude
			salonLongitude
			memberId
			deletedAt
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_SALON = gql`
	mutation UpdateSalon($input: SalonUpdate!) {
		updateSalon(input: $input) {
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
			salonInstagram
			salonViews
			salonLikes
			salonComments
			salonRank
			salonFollowers
			depositAmount
			salonLatitude
			salonLongitude
			memberId
			deletedAt
			createdAt
			updatedAt
		}
	}
`;

export const LIKE_TARGET_SALON = gql`
	mutation LikeTargetSalon($input: String!) {
		likeTargetSalon(salonId: $input) {
			_id
			salonType
			salonStatus
			salonLocation
			salonTitle
			salonViews
			salonLikes
			salonComments
			salonRank
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const ANNOUNCE_DISCOUNT = gql`
	mutation AnnounceDiscount($input: String!) {
		announceDiscount(salonId: $input)
	}
`;

export const ANNOUNCE_FREE_SLOT = gql`
	mutation AnnounceFreeSlot($input: String!) {
		announceFreeSlot(salonId: $input)
	}
`;

/**************************
 *        SERVICE         *
 *************************/

export const CREATE_SERVICE = gql`
	mutation CreateService($input: ServiceInput!) {
		createService(input: $input) {
			_id
			serviceType
			serviceStatus
			serviceTitle
			serviceDesc
			servicePrice
			serviceDuration
			serviceImages
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

export const UPDATE_SERVICE = gql`
	mutation UpdateService($input: ServiceUpdate!) {
		updateService(input: $input) {
			_id
			serviceType
			serviceStatus
			serviceTitle
			serviceDesc
			servicePrice
			serviceDuration
			serviceImages
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

export const LIKE_TARGET_SERVICE = gql`
	mutation LikeTargetService($input: String!) {
		likeTargetService(serviceId: $input) {
			_id
			serviceType
			serviceStatus
			serviceTitle
			servicePrice
			serviceLikes
			serviceViews
			serviceRating
			salonId
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *        BOOKING         *
 *************************/

export const CREATE_BOOKING = gql`
	mutation CreateBooking($input: BookingInput!) {
		createBooking(input: $input) {
			_id
			bookingStatus
			bookingDate
			bookingTime
			bookingNote
			totalAmount
			depositAmount
			remainAmount
			paymentKey
			paymentStatus
			serviceId
			salonId
			memberId
			deletedAt
			createdAt
			updatedAt
		}
	}
`;

export const CANCEL_BOOKING = gql`
	mutation CancelBooking($input: String!) {
		cancelBooking(bookingId: $input) {
			_id
			bookingStatus
			paymentStatus
			deletedAt
			updatedAt
		}
	}
`;

export const UPDATE_BOOKING_BY_AGENT = gql`
	mutation UpdateBookingByAgent($input: BookingUpdate!) {
		updateBookingByAgent(input: $input) {
			_id
			bookingStatus
			bookingDate
			bookingTime
			bookingNote
			totalAmount
			depositAmount
			remainAmount
			paymentStatus
			serviceId
			salonId
			memberId
			updatedAt
		}
	}
`;

/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const CREATE_BOARD_ARTICLE = gql`
	mutation CreateBoardArticle($input: BoardArticleInput!) {
		createBoardArticle(input: $input) {
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

export const UPDATE_BOARD_ARTICLE = gql`
	mutation UpdateBoardArticle($input: BoardArticleUpdate!) {
		updateBoardArticle(input: $input) {
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

export const LIKE_TARGET_BOARD_ARTICLE = gql`
	mutation LikeTargetBoardArticle($input: String!) {
		likeTargetBoardArticle(articleId: $input) {
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

/**************************
 *         COMMENT        *
 *************************/

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
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

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
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
 *         FOLLOW         *
 *************************/

export const SUBSCRIBE = gql`
	mutation Subscribe($input: String!) {
		subscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

export const UNSUBSCRIBE = gql`
	mutation Unsubscribe($input: String!) {
		unsubscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *        UPLOADER        *
 *************************/

export const IMAGE_UPLOADER = gql`
	mutation ImageUploader($file: Upload!, $target: String!) {
		imageUploader(file: $file, target: $target)
	}
`;

export const IMAGES_UPLOADER = gql`
	mutation ImagesUploader($files: [Upload!]!, $target: String!) {
		imagesUploader(files: $files, target: $target)
	}
`;