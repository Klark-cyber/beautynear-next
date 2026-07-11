import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

// apollo/user/query.ts da GET_AGENTS ni shu bilan almashtiring:

export const GET_AGENTS = gql`
	query GetAgents($input: AgentInquiry!) {
		getAgents(input: $input) {
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
				memberPoints
				memberLikes
				memberFollowers
				memberFollowings
				memberViews
				memberExperience
				memberSpecialty
				memberPortfolio
				deletedAt
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER = gql`
	query GetMember($input: String!) {
		getMember(memberId: $input) {
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
			memberArticles
			memberPoints
			memberLikes
			memberViews
			memberFollowings
			memberFollowers
			memberComments
			memberRank
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
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			meFollowed {
				followingId
				followerId
				myFollowing
			}
		}
	}
`;

/**************************
 *         SALON          *
 *************************/

export const GET_SALON = gql`
	query GetSalon($input: String!) {
		getSalon(salonId: $input) {
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
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			meFollowed {
				followerId
				followingId
				myFollowing
			}
			deletedAt
			createdAt
			updatedAt
			memberData {
				_id
				memberType
				memberNick
				memberFullName
				memberImage
				memberDesc
				memberExperience
				memberSpecialty
				memberPortfolio
				memberSalons
				memberRank
				memberLikes
				memberViews
				createdAt
				meFollowed {
					followerId
					followingId
					myFollowing
				}
				updatedAt
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			meFollowed {
				followingId
				followerId
				myFollowing
			}
		}
	}
`;

export const GET_SALONS = gql`
	query GetSalons($input: SalonsInquiry!) {
		getSalons(input: $input) {
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
					memberExperience
					memberSpecialty
					memberRank
					memberLikes
					memberViews
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_AGENT_SALONS = gql`
	query GetAgentSalons($input: AgentSalonsInquiry!) {
		getAgentSalons(input: $input) {
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
				memberId
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

export const GET_FAVORITE_SALONS = gql`
	query GetFavoriteSalons($input: OrdinaryInquiry!) {
		getFavoriteSalons(input: $input) {
			list {
				_id
				salonType
				salonStatus
				salonLocation
				salonAddress
				salonTitle
				salonImages
				salonViews
				salonLikes
				salonRank
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberRank
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_VISITED_SALONS = gql`
	query GetVisitedSalons($input: OrdinaryInquiry!) {
		getVisitedSalons(input: $input) {
			list {
				_id
				salonType
				salonStatus
				salonLocation
				salonAddress
				salonTitle
				salonImages
				salonViews
				salonLikes
				salonRank
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberRank
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

export const GET_SERVICE = gql`
	query GetService($input: String!) {
		getService(serviceId: $input) {
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
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			deletedAt
			createdAt
			updatedAt
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			memberData {
				_id
				memberNick
				memberFullName
				memberImage
				memberExperience
				memberSpecialty
				memberPortfolio
				memberRank
			}
			salonData {
				_id
				salonTitle
				salonLocation
				salonAddress
				salonPhone
				salonWorkHours
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_SERVICES = gql`
	query GetServices($input: ServicesInquiry!) {
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
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberExperience
					memberSpecialty
				}
				salonData {
					_id
					salonTitle
					salonLocation
					salonAddress
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_AGENT_SERVICES = gql`
	query GetAgentServices($input: AgentServicesInquiry!) {
		getAgentServices(input: $input) {
			list {
				_id
				serviceType
				serviceStatus
				serviceTitle
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
				salonData {
					_id
					salonTitle
					salonLocation
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_FAVORITE_SERVICES = gql`
	query GetFavoriteServices($input: OrdinaryInquiry!) {
		getFavoriteServices(input: $input) {
			list {
				_id
				serviceType
				serviceStatus
				serviceTitle
				servicePrice
				serviceDuration
				serviceImages
				serviceViews
				serviceLikes
				serviceRating
				salonId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberExperience
				}
				salonData {
					_id
					salonTitle
					salonLocation
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_VISITED_SERVICES = gql`
	query GetVisitedServices($input: OrdinaryInquiry!) {
		getVisitedServices(input: $input) {
			list {
				_id
				serviceType
				serviceStatus
				serviceTitle
				servicePrice
				serviceDuration
				serviceImages
				serviceViews
				serviceLikes
				serviceRating
				salonId
				memberId
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberExperience
				}
				salonData {
					_id
					salonTitle
					salonLocation
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

export const GET_MY_BOOKINGS = gql`
	query GetMyBookings($input: BookingsInquiry!) {
		getMyBookings(input: $input) {
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
				createdAt
				updatedAt
				salonData {
					_id
					salonTitle
					salonLocation
					salonAddress
					salonPhone
					salonImages
				}
				serviceData {
					_id
					serviceTitle
					servicePrice
					serviceDuration
					serviceImages
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_AGENT_BOOKINGS = gql`
	query GetAgentBookings($input: AgentBookingsInquiry!) {
		getAgentBookings(input: $input) {
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
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
					memberImage
					memberPhone
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

export const GET_BOARD_ARTICLE = gql`
	query GetBoardArticle($input: String!) {
		getBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			articleComments
			memberId
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
			createdAt
			updatedAt
			memberData {
				_id
				memberType
				memberNick
				memberFullName
				memberImage
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
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
				_id
				articleCategory
				articleStatus
				articleTitle
				articleContent
				articleImage
				articleViews
				articleLikes
				articleComments
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
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
					accessToken
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         FOLLOW         *
 *************************/

export const GET_MEMBER_FOLLOWERS = gql`
	query GetMemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
				followerData {
					_id
					memberType
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberSalons
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					memberWarnings
					memberBlocks
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

export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				followingData {
					_id
					memberType
					memberNick
					memberFullName
					memberImage
					memberAddress
					memberDesc
					memberSalons
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					memberWarnings
					memberBlocks
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         FOLLOW         *
 *************************/

export const CHECK_FOLLOWING = gql`
	query CheckFollowing($input: FollowToggleInput!) {
		checkFollowing(input: $input)
	}
`;
/**************************
 *           FAQ          *
 *************************/

export const GET_FAQS = gql`
	query GetFaqs($input: FaqsInquiry!) {
		getFaqs(input: $input) {
			list {
				_id
				faqCategory
				faqQuestion
				faqAnswer
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         NOTICE         *
 *************************/

export const GET_NOTICES = gql`
	query GetNotices($input: NoticesInquiry!) {
		getNotices(input: $input) {
			list {
				_id
				noticeType
				noticeTitle
				noticeContent
				noticeViews
				noticePinned
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_NOTICE = gql`
	query GetNotice($noticeId: String!) {
		getNotice(noticeId: $noticeId) {
			_id
			noticeType
			noticeTitle
			noticeContent
			noticeViews
			noticePinned
			createdAt
		}
	}
`;

/**************************
 *         INQUIRY        *
 *************************/

export const GET_MY_INQUIRIES = gql`
	query GetMyInquiries($input: MyInquiriesInquiry!) {
		getMyInquiries(input: $input) {
			list {
				_id
				inquiryStatus
				inquirySubject
				inquiryMessage
				inquiryReply
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;