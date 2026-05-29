import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
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
				memberLatitude
				memberLongitude
				deletedAt
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;


/**************************
 *         SALON          *
 *************************/

export const GET_ALL_SALONS_BY_ADMIN = gql`
	query GetAllSalonsByAdmin($input: AllSalonsInquiry!) {
		getAllSalonsByAdmin(input: $input) {
			list {
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
				salonLatitude
				salonLongitude
				memberId
				deletedAt
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberSalons
					memberRank
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;


/**************************
 *        SERVICE         *
 *************************/

export const GET_ALL_SERVICES_BY_ADMIN = gql`
	query GetAllServicesByAdmin($input: ServicesInquiry!) {
		getServices(input: $input) {
			list {
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
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberRank
				}
				salonData {
					_id
					salonTitle
					salonLocation
					salonStatus
				}
			}
			metaCounter {
				total
			}
		}
	}
`;


/**************************
 *        BOOKING         *
 *************************/

export const GET_ALL_BOOKINGS_BY_ADMIN = gql`
	query GetAllBookingsByAdmin($input: BookingsInquiry!) {
		getAllBookingsByAdmin(input: $input) {
			list {
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
				deletedAt
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberPhone
				}
				salonData {
					_id
					salonTitle
					salonLocation
					salonAddress
				}
				serviceData {
					_id
					serviceTitle
					servicePrice
					serviceDuration
				}
			}
			metaCounter {
				total
			}
		}
	}
`;


/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_ALL_BOARD_ARTICLES_BY_ADMIN = gql`
	query GetAllBoardArticlesByAdmin($input: AllBoardArticlesInquiry!) {
		getAllBoardArticlesByAdmin(input: $input) {
			list {
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
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberSalons
					memberRank
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberSalons
					memberRank
					memberLikes
					memberViews
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;