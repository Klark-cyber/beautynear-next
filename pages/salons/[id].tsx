import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { initializeApollo } from '../../apollo/client';
import {
	Stack, Box, Typography, Button, IconButton, Chip,
	Select, MenuItem, CircularProgress, Avatar,
	TextField, Pagination as MuiPagination,
} from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation } from 'swiper';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import StarIcon from '@mui/icons-material/Star';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Link from 'next/link';
import moment from 'moment';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import RatingStars from '../../libs/components/common/Ratingstars';
import EmptyList from '../../libs/components/common/Emptylist';
import MobileSalonDetail from '../../libs/components/salon/MobileSalonDetail';
import { GET_SALON, GET_SALONS, GET_SERVICES, GET_COMMENTS, GET_MY_BOOKINGS, GET_BOOKED_SLOTS } from '../../apollo/user/query';
import { LIKE_TARGET_SALON, CREATE_COMMENT, CREATE_BOOKING, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Salon } from '../../libs/types/salon/salon';
import { Service } from '../../libs/types/service/service';
import { Comment } from '../../libs/types/comment/comment';
import { Booking } from '../../libs/types/booking/booking';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { FollowGroup } from '../../libs/enums/follow.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { useChatContext } from '../../libs/context/ChatContext';
import { isSalonOpen } from '../../libs/utils';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

SwiperCore.use([Autoplay, Navigation]);

export const getServerSideProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

// Hydration-safe narx formatlash
const formatPrice = (n?: number): string => {
	if (n === undefined || n === null) return '0';
	return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Rasm http-aware (Unsplash URL yoki backend fayl)
const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
	if (!raw) return fallback;
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

// Rating — 1 kasrgacha (4.782849 → 4.8)
const formatRating = (n?: number): string => {
	if (n === undefined || n === null) return '4.9';
	return n.toFixed(1);
};

// Time slot generator
const generateTimeSlots = (workHours: string): string[] => {
	try {
		const [start, end] = workHours.split('-');
		const [startH] = start.split(':').map(Number);
		const [endH] = end.split(':').map(Number);
		const slots: string[] = [];
		for (let h = startH; h < endH; h++) {
			slots.push(`${String(h).padStart(2, '0')}:00`);
		}
		return slots;
	} catch {
		return ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
	}
};

const SalonDetail: NextPage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const { openChatWith } = useChatContext();

	const salonId = router.query.id as string;

	/** STATE **/
	const [salon, setSalon] = useState<Salon | null>(null);
	const [slideImage, setSlideImage] = useState<string>('');
	const [services, setServices] = useState<Service[]>([]);
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState(0);
	const [similarSalons, setSimilarSalons] = useState<Salon[]>([]);
	const [myBookings, setMyBookings] = useState<Booking[]>([]);

	const [selectedService, setSelectedService] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<string>(moment().add(1, 'day').format('YYYY-MM-DD'));
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [bookedSlots, setBookedSlots] = useState<string[]>([]);
	const [bookingLoading, setBookingLoading] = useState(false);
	const [showAllSlots, setShowAllSlots] = useState(false);
	const [isFollowingMember, setIsFollowingMember] = useState(false);
	const [isFollowingSalon, setIsFollowingSalon] = useState(false);

	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>({
		page: 1, limit: 5, sort: 'createdAt', direction: Direction.DESC,
		search: { commentRefId: '' },
	});
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.SALON,
		commentContent: '',
		commentRefId: '',
		commentRating: 5,
	});

	const canWriteReview = myBookings.some(
		(b) => b.salonId === salonId && b.bookingStatus === BookingStatus.COMPLETED,
	);

	/** APOLLO **/
	const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [createBooking] = useMutation(CREATE_BOOKING);

	const { loading: salonLoading, refetch: salonRefetch } = useQuery(GET_SALON, {
		fetchPolicy: 'network-only',
		variables: { input: salonId },
		skip: !salonId,
		onCompleted: (data: T) => {
			if (data?.getSalon) {
				setSalon(data.getSalon);
				setSlideImage(data.getSalon.salonImages?.[0] ?? '');
				setCommentInquiry((prev) => ({ ...prev, search: { commentRefId: salonId } }));
				setInsertCommentData((prev) => ({ ...prev, commentRefId: salonId }));
				// ⚠️ TUZATILDI: avval bu ikkalasi hech qachon backend
				// ma'lumotidan sinxronlanmagan edi — doim "Follow" ko'rsatib,
				// takroriy urinishda xato berardi.
				setIsFollowingSalon(Boolean(data.getSalon.meFollowed?.[0]?.myFollowing));
				setIsFollowingMember(Boolean(data.getSalon.memberData?.meFollowed?.[0]?.myFollowing));
			}
		},
	});

	const { refetch: servicesRefetch } = useQuery(GET_SERVICES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 10, sort: 'createdAt', direction: Direction.DESC, search: { salonId } } },
		skip: !salonId,
		onCompleted: (data: T) => setServices(data?.getServices?.list ?? []),
	});

	const { refetch: commentsRefetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: commentInquiry },
		skip: !commentInquiry.search.commentRefId,
		onCompleted: (data: T) => {
			setComments(data?.getComments?.list ?? []);
			setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useQuery(GET_MY_BOOKINGS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 100, search: {} } },
		skip: !user._id,
		onCompleted: (data: T) => setMyBookings(data?.getMyBookings?.list ?? []),
	});

	useQuery(GET_SALONS, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: {
				page: 1, limit: 6, sort: 'salonRank', direction: Direction.DESC,
				search: {
					// ⚠️ TUZATILDI: bo'sh satr enum sifatida yuborilib "Bad Request"
					// xatosiga sabab bo'lgan bo'lishi mumkin edi — endi aniq tekshiriladi
					...(salon?.salonLocation ? { locationList: [salon.salonLocation] } : {}),
					...(salon?.salonType ? { typeList: [salon.salonType] } : {}),
				},
			},
		},
		skip: !salon?._id,
		onCompleted: (data: T) => {
			const list = (data?.getSalons?.list ?? []).filter((s: Salon) => s._id !== salonId);
			setSimilarSalons(list);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (commentInquiry.search.commentRefId) {
			commentsRefetch({ input: commentInquiry });
		}
	}, [commentInquiry]);

	// ⚠️ TUZATILDI: avval faqat FOYDALANUVCHINING O'Z bronlaridan (myBookings)
	// tekshirilar edi — boshqa mijozlar band qilgan vaqt "bo'sh" ko'rinib,
	// ikki marta bron qilishga yo'l qo'yardi. Endi HAMMA mijozlar bo'yicha
	// (backend'dagi xavfsiz getBookedSlots so'rovi orqali) tekshiriladi.
	useEffect(() => {
		if (!selectedDate || !salonId) return;
		const client = initializeApollo();
		client
			.query({
				query: GET_BOOKED_SLOTS,
				variables: { salonId, date: selectedDate },
				fetchPolicy: 'network-only',
			})
			.then(({ data }) => setBookedSlots(data?.getBookedSlots ?? []))
			.catch(() => setBookedSlots([]));
	}, [selectedDate, salonId]);

	/** HANDLERS **/
	const likeHandler = useCallback(async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetSalon({ variables: { input: salonId } });
			// ⚠️ TUZATILDI: onCompleted refetch()da ishonchli qayta ishga
			// tushmasligi mumkin — natijadan to'g'ridan-to'g'ri yangilaymiz
			const result = await salonRefetch({ input: salonId });
			if (result?.data?.getSalon) setSalon(result.data.getSalon);
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	}, [user, salonId]);


	// ⚠️ YANGI — Salon egasi (Agent) bilan 1-ga-1 chatni ochish
	const messageAgentHandler = useCallback(() => {
		if (!user?._id) {
			router.push('/account/join');
			return;
		}
		if (!salon?.memberData?._id) return;
		openChatWith({
			memberId: String(salon.memberData._id),
			nick: salon.memberData.memberNick,
			image: salon.memberData.memberImage,
		});
	}, [user, salon, openChatWith, router]);

	const followHandler = useCallback(async (
		group: FollowGroup, targetId: string, isFollowing: boolean, setter: (v: boolean) => void,
	) => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			const input: any = {};
			if (group === FollowGroup.MEMBER) input.followingId = targetId;
			if (group === FollowGroup.SALON) input.salonId = targetId;
			if (isFollowing) {
				await unsubscribe({ variables: { input } });
				setter(false);
			} else {
				await subscribe({ variables: { input } });
				setter(true);
			}
			await sweetTopSmallSuccessAlert(isFollowing ? 'Unfollowed' : 'Following!', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	}, [user]);

	const bookingHandler = useCallback(async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			if (!selectedService) throw new Error(t('Please select a service'));
			if (!selectedDate) throw new Error(t('Please select a date'));
			if (!selectedTime) throw new Error(t('Please select a time'));

			setBookingLoading(true);
			const paymentKey = `test_pay_${Date.now()}`;

			await createBooking({
				variables: {
					input: {
						serviceId: selectedService,
						salonId,
						bookingDate: new Date(selectedDate),
						bookingTime: selectedTime,
						paymentKey,
					},
				},
			});

			await sweetTopSmallSuccessAlert(t('Booking confirmed!'), 1500);
			router.push('/mypage?category=myBookings');
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setBookingLoading(false);
		}
	}, [user, selectedService, selectedDate, selectedTime, salonId]);

	const createCommentHandler = useCallback(async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await createComment({ variables: { input: insertCommentData } });
			setInsertCommentData((prev) => ({ ...prev, commentContent: '' }));
			await commentsRefetch({ input: commentInquiry });
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	}, [user, insertCommentData, commentInquiry]);

	const commentPageHandler = async (_: any, page: number) => {
		setCommentInquiry((prev) => ({ ...prev, page }));
	};

	if (salonLoading) {
		return (
			<Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
				<CircularProgress sx={{ color: '#FF4D8D' }} size={48} />
			</Stack>
		);
	}

	if (!salon) return null;

	const isOpen = isSalonOpen(salon.salonWorkHours);
	const isTop = salon.salonRank >= 2;
	const liked = salon.meLiked?.[0]?.myFavorite;
	const timeSlots = generateTimeSlots(salon.salonWorkHours);
	const visibleSlots = showAllSlots ? timeSlots : timeSlots.slice(0, 6);
	const mainImg = imgUrl(slideImage);

	// Starting from = eng KICHIK xizmat narxi (himoyalangan)
	const validPrices = services.map((s) => s.servicePrice).filter((p): p is number => typeof p === 'number' && p > 0);
	const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 30000;

	// Mutaxassislik fallback — salon turiga qarab (memberSpecialty bo'sh bo'lsa)
	const specialtyByType: Record<string, string[]> = {
		HAIR: ['Hair Stylist', 'Color Expert'],
		NAIL: ['Nail Artist', 'Nail Expert'],
		SKIN: ['Skin Expert', 'Esthetician'],
		CLINIC: ['Skin Clinic', 'Dermatology'],
		MASSAGE: ['Massage Therapist', 'Spa Expert'],
	};
	const specialtyFallback = specialtyByType[salon.salonType] ?? ['Beauty Expert'];

	// Rating breakdown — mock (backend bermaydi)
	const ratingBreakdown = [
		{ stars: 5, count: 278, pct: 87 },
		{ stars: 4, count: 32, pct: 10 },
		{ stars: 3, count: 8, pct: 3 },
		{ stars: 2, count: 2, pct: 1 },
		{ stars: 1, count: 0, pct: 0 },
	];

	/** MOBILE **/
	if (device === 'mobile') {
		return <MobileSalonDetail salonId={salonId} />;
	}


	/** DESKTOP **/
	return (
		<Stack className="salon-detail-page">
			<Stack className="salon-detail-inner">
				{/* Back */}
				<Stack direction="row" alignItems="center" gap={0.75} className="back-link" onClick={() => router.push('/salons')}>
					<ArrowBackIcon sx={{ fontSize: 16 }} />
					<Typography sx={{ fontSize: 13 }}>{t('Back to salons')}</Typography>
				</Stack>

				{/* ═══ 2 BLOK: CHAP(rasm+info+services+reviews) + O'NG(booking sticky) ═══ */}
				<Stack direction="row" gap={4} alignItems="flex-start" className="detail-columns">

					{/* ══════════ CHAP BLOK ══════════ */}
					<Stack className="salon-detail-left-block">

						{/* Yuqori qator: rasm gallery + salon info yonma-yon */}
						<Stack direction="row" gap={4} alignItems="flex-start" className="detail-top-row">

							{/* rasm gallery */}
							<Stack className="salon-detail-left">
								<Box component="div" className="main-img-wrap">
									<img src={mainImg} alt={salon.salonTitle} className="main-img" />
									<Chip label={isOpen ? t('Open') : t('Closed')} className={`open-chip ${isOpen ? 'open' : 'closed'}`} />
									<IconButton className={`like-btn ${liked ? 'liked' : ''}`} onClick={likeHandler}>
										{liked ? <FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
									</IconButton>
								</Box>
								<Stack direction="row" gap={1} className="thumbnails">
									{salon.salonImages?.slice(0, 4).map((img, i) => (
										<Box key={i} component="div" onClick={() => setSlideImage(img)}
											className={`thumb ${slideImage === img ? 'active' : ''}`}
											style={{ backgroundImage: `url(${imgUrl(img)})` }} />
									))}
								</Stack>
							</Stack>

							{/* salon info + about */}
							<Stack className="salon-detail-middle">
								<Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
									<Typography className="salon-title">{salon.salonTitle}</Typography>
									{isTop && <Chip label="⚡ TOP" size="small" className="top-chip" />}
								</Stack>

								<Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
									<RatingStars rating={salon.salonRating || 0} count={commentTotal} size="medium" />
									<Typography sx={{ fontSize: 13, color: '#999', fontFamily: 'Poppins, sans-serif' }}>
										· {salon.salonFollowers ?? 0} {t('followers')}
									</Typography>
								</Stack>

								<Stack gap={1.25} className="info-rows">
									<Stack direction="row" alignItems="center" gap={1}>
										<LocationOnOutlinedIcon sx={{ fontSize: 17, color: '#FF4D8D' }} />
										<Typography sx={{ fontSize: 15, color: '#555' }}>{salon.salonAddress}</Typography>
									</Stack>
									{salon.memberData && (
										<Stack direction="row" alignItems="center" gap={1}>
											<PersonOutlineIcon sx={{ fontSize: 17, color: '#888' }} />
											<Typography sx={{ fontSize: 15, color: '#555' }}>{t('By')}:&nbsp;</Typography>
											<Link href={`/member?memberId=${salon.memberData._id}`}>
												<Typography sx={{ fontSize: 15, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
													{salon.memberData.memberNick} ›
												</Typography>
											</Link>
										</Stack>
									)}
									<Stack direction="row" gap={1} flexWrap="wrap" sx={{ my: 0.5 }}>
										<Chip label={t(salon.salonType)} size="small" className="type-chip" />
									</Stack>
									<Stack direction="row" alignItems="center" gap={1}>
										<AccessTimeIcon sx={{ fontSize: 17, color: isOpen ? '#4CAF50' : '#e53935' }} />
										<Typography sx={{ fontSize: 15, color: '#555' }}>
											{t('Open')}: <Box component="span" sx={{ color: isOpen ? '#4CAF50' : '#e53935', fontWeight: 600 }}>{salon.salonWorkHours}</Box>
										</Typography>
									</Stack>
									{salon.salonPhone && (
										<Stack direction="row" alignItems="center" gap={1}>
											<PhoneOutlinedIcon sx={{ fontSize: 17, color: '#888' }} />
											<Typography sx={{ fontSize: 15, color: '#555' }}>{salon.salonPhone}</Typography>
										</Stack>
									)}
									{salon.salonInstagram && (
										<Stack direction="row" alignItems="center" gap={1}>
											<InstagramIcon sx={{ fontSize: 17, color: '#888' }} />
											<Typography sx={{ fontSize: 15, color: '#555' }}>{salon.salonInstagram}</Typography>
										</Stack>
									)}
								</Stack>

								{salon.salonDesc && (
									<Box component="div" className="about-section">
										<Typography className="about-title">{t('About this salon')}</Typography>
										<Typography sx={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{salon.salonDesc}</Typography>
									</Box>
								)}
							</Stack>
						</Stack>
						{/* detail-top-row tugadi */}

						{/* ═══ SERVICES OFFERED (chap blok ichida) ═══ */}
						<Stack className="full-section services-section">
							<Typography className="section-title">{t('Services offered')}</Typography>
							{services.length === 0 ? (
								<EmptyList emoji="✂️" title={t('No services yet')} />
							) : (
								<Box component="div" className="services-grid">
									{services.map((svc) => {
										return (
											<Stack key={svc._id} className="service-card">
												<Box component="div" className="svc-img" style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }} />
												<Box component="div" className="svc-body">
													<Typography className="svc-name">{svc.serviceTitle}</Typography>
													<Typography className="svc-price">₩{formatPrice(svc.servicePrice)}</Typography>
													<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.75 }}>
														<Typography className="svc-dur">{svc.serviceDuration} min</Typography>
														<Stack direction="row" alignItems="center" gap={0.25}>
															<StarIcon sx={{ fontSize: 14, color: '#FFB800' }} />
															<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{formatRating(svc.serviceRating || 4.9)}</Typography>
														</Stack>
													</Stack>
													<Button fullWidth className="svc-book-btn" onClick={() => setSelectedService(svc._id)}>{t('Book')}</Button>
												</Box>
											</Stack>
										);
									})}
								</Box>
							)}
						</Stack>

						{/* ═══ CUSTOMER REVIEWS (chap blok ichida) ═══ */}
						<Stack className="full-section reviews-section">
							<Typography className="section-title">{t('Customer Reviews')}</Typography>

							<Stack direction="row" gap={4} className="rating-summary">
								<Stack alignItems="center" justifyContent="center" className="big-rating-box">
									<Typography className="big-rating">{(salon.salonRating || 0).toFixed(1)}</Typography>
									<RatingStars rating={salon.salonRating || 0} size="medium" showNumber={false} />
									<Typography sx={{ fontSize: 12, color: '#888', mt: 0.5 }}>({commentTotal} {t('reviews')})</Typography>
								</Stack>
								<Stack flex={1} gap={0.75} sx={{ maxWidth: 420 }}>
									{ratingBreakdown.map((r) => (
										<Stack key={r.stars} direction="row" alignItems="center" gap={1}>
											<Typography sx={{ fontSize: 12, color: '#555', width: 8 }}>{r.stars}</Typography>
											<StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
											<Box component="div" className="rating-bar">
												<Box component="div" className="rating-fill" style={{ width: `${r.pct}%` }} />
											</Box>
											<Typography sx={{ fontSize: 12, color: '#888', width: 24 }}>{r.count}</Typography>
										</Stack>
									))}
								</Stack>
							</Stack>

							{comments.length === 0 ? (
								<EmptyList emoji="💬" title={t('No reviews yet')} desc={t('Be the first to review!')} />
							) : (
								<Stack className="review-grid">
									{comments.map((comment) => {
										const authorImg = comment.memberData?.memberImage
											? imgUrl(comment.memberData.memberImage, '/img/profile/defaultUser.svg')
											: '/img/profile/defaultUser.svg';
										return (
											<Stack key={comment._id} className="review-card">
												<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
													<Stack direction="row" gap={1.5} alignItems="center">
														<Avatar src={authorImg} sx={{ width: 40, height: 40 }} />
														<Box component="div">
															<Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{comment.memberData?.memberNick}</Typography>
															<Typography sx={{ fontSize: 12, color: '#bbb' }}>{moment(comment.createdAt).format('MMM DD, YYYY')}</Typography>
														</Box>
													</Stack>
												</Stack>
												<RatingStars rating={4.9} size="small" showNumber={false} />
												<Typography sx={{ fontSize: 14, color: '#555', lineHeight: 1.6, mt: 1 }}>{comment.commentContent}</Typography>
											</Stack>
										);
									})}
								</Stack>
							)}

							{commentTotal > commentInquiry.limit && (
								<Stack alignItems="center" sx={{ mt: 3 }}>
									<MuiPagination
										page={commentInquiry.page}
										count={Math.ceil(commentTotal / commentInquiry.limit)}
										onChange={commentPageHandler}
										shape="circular"
										sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
									/>
								</Stack>
							)}

							{canWriteReview && (
								<Stack className="write-review-section">
									<Typography className="section-title">{t('Leave A Review')}</Typography>
									<Stack direction="row" gap={0.5} sx={{ my: 1 }}>
										{[1, 2, 3, 4, 5].map((n) => (
											<IconButton key={n} size="small" onClick={() => setInsertCommentData((prev) => ({ ...prev, commentRating: n }))}>
												<StarIcon sx={{ fontSize: 26, color: n <= (insertCommentData.commentRating ?? 5) ? '#FFB800' : '#e0e0e0' }} />
											</IconButton>
										))}
									</Stack>
									<textarea className="review-textarea" placeholder={t('Share your experience...')}
										value={insertCommentData.commentContent}
										onChange={(e) => setInsertCommentData((prev) => ({ ...prev, commentContent: e.target.value }))} />
									<Button className="submit-review-btn" disabled={!insertCommentData.commentContent || !user._id} onClick={createCommentHandler}>
										{t('Submit Review')}
									</Button>
								</Stack>
							)}
						</Stack>

						{/* ═══ MAP (chap blok ichida) ═══ */}
						{salon.salonLatitude && salon.salonLongitude && (
							<Stack className="full-section map-section">
								<Typography className="section-title">{t('Location')}</Typography>
								<Box component="div" className="map-wrap">
									<iframe
										src={`https://maps.google.com/maps?q=${salon.salonLatitude},${salon.salonLongitude}&z=15&output=embed`}
										width="100%" height="100%" style={{ border: 0, borderRadius: 12 }}
										allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
								</Box>
							</Stack>
						)}
					</Stack>
					{/* ══════════ CHAP BLOK tugadi ══════════ */}

					{/* ══════════ O'NG BLOK: booking + specialist (sticky) ══════════ */}
					<Stack className="salon-detail-right">
						{/* Booking card */}
						<Stack className="booking-card">
							<Typography className="bc-title">{t('Book Your Appointment')}</Typography>

							<Stack direction="row" justifyContent="space-between" sx={{ mb: 2.5 }}>
								<Box component="div">
									<Typography sx={{ fontSize: 11, color: '#888' }}>{t('Starting from')}</Typography>
									<Typography sx={{ fontSize: 24, fontWeight: 800, color: '#FF4D8D' }}>
										₩{formatPrice(minPrice)}
									</Typography>
								</Box>
								<Box component="div" sx={{ textAlign: 'right' }}>
									<Stack direction="row" alignItems="center" gap={0.5} justifyContent="flex-end">
										<Typography sx={{ fontSize: 11, color: '#888' }}>{t('Deposit')}</Typography>
										<ShieldOutlinedIcon sx={{ fontSize: 13, color: '#888' }} />
									</Stack>
									<Typography sx={{ fontSize: 18, fontWeight: 700, color: '#333' }}>₩{formatPrice(salon.depositAmount)}</Typography>
								</Box>
							</Stack>

							<Typography className="bc-label">{t('Select Service')}</Typography>
							<Select fullWidth size="small" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}
								displayEmpty className="bc-select"
								sx={{ mb: 2, borderRadius: 2.5, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, '&:hover fieldset': { borderColor: '#FF4D8D' } }}>
								<MenuItem value="" disabled>{t('Choose a service')}</MenuItem>
								{services.map((svc) => (
									<MenuItem key={svc._id} value={svc._id}>{svc.serviceTitle} — ₩{formatPrice(svc.servicePrice)}</MenuItem>
								))}
							</Select>

							<Typography className="bc-label">{t('Select Date')}</Typography>
							<TextField fullWidth size="small" type="date" value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								inputProps={{ min: moment().add(1, 'day').format('YYYY-MM-DD') }}
								className="bc-date"
								sx={{ mb: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, '&:hover fieldset': { borderColor: '#FF4D8D' }, borderRadius: 2.5 }} />

							<Typography className="bc-label">{t('Select Time')}</Typography>
							<Box component="div" className="time-grid">
								{visibleSlots.map((slot) => {
									const isBooked = bookedSlots.includes(slot);
									return (
										<Box key={slot} component="div" onClick={() => !isBooked && setSelectedTime(slot)}
											className={`time-slot ${selectedTime === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}>
											{slot}
										</Box>
									);
								})}
							</Box>
							{timeSlots.length > 6 && (
								<Stack alignItems="center" sx={{ mb: 2 }}>
									<Typography className="more-times" onClick={() => setShowAllSlots(!showAllSlots)}>
										{showAllSlots ? t('Less times') : t('More times')} ⌄
									</Typography>
								</Stack>
							)}

							<Button fullWidth className="book-now-btn" onClick={bookingHandler} disabled={bookingLoading}>
								{bookingLoading ? '...' : `${t('Book Now')} — ₩${formatPrice(salon.depositAmount)}`}
							</Button>

							<Stack direction="row" alignItems="center" gap={0.75} className="deposit-note">
								<ShieldOutlinedIcon sx={{ fontSize: 14, color: '#888' }} />
								<Box component="div">
									<Typography sx={{ fontSize: 12, fontWeight: 600, color: '#555' }}>
										{t('Pay ₩{{amount}} deposit', { amount: formatPrice(salon.depositAmount) })}
									</Typography>
									<Typography sx={{ fontSize: 11, color: '#999' }}>{t('Rest paid at salon')}</Typography>
								</Box>
							</Stack>
						</Stack>

						{/* Follow salon */}
						<Button
							fullWidth
							className={`follow-salon-btn ${isFollowingSalon ? 'following' : ''}`}
							startIcon={isFollowingSalon ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
							onClick={() => followHandler(FollowGroup.SALON, String(salon._id), isFollowingSalon, setIsFollowingSalon)}
						>
							{isFollowingSalon ? t('Following') : t('Follow Salon')}
						</Button>

						{/* Specialist card */}
						{salon.memberData && (
							<Stack className="specialist-card">
								<Typography className="sc-title">{t('Your Specialist')}</Typography>
								<Stack alignItems="center" gap={1.5}>
									<Box component="div" sx={{ position: 'relative' }}>
										<Avatar
											src={salon.memberData.memberImage ? imgUrl(salon.memberData.memberImage, '/img/profile/defaultUser.svg') : '/img/profile/defaultUser.svg'}
											sx={{ width: 90, height: 90, border: '3px solid #FF85B3' }}
										/>
										<Box component="div" className="verified-dot"><VerifiedIcon sx={{ fontSize: 15, color: '#fff' }} /></Box>
									</Box>

									<Box component="div" sx={{ textAlign: 'center' }}>
										<Typography sx={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>{salon.memberData.memberNick}</Typography>
										<Stack direction="row" gap={0.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
											{(salon.memberData.memberSpecialty && salon.memberData.memberSpecialty.length > 0
												? salon.memberData.memberSpecialty
												: specialtyFallback
											).map((sp) => (
												<Chip key={sp} label={t(sp)} size="small" className="specialty-chip" />
											))}
										</Stack>
										<Typography sx={{ fontSize: 13, color: '#888', mt: 1 }}>
											{t('Experience')}: {salon.memberData.memberExperience && salon.memberData.memberExperience > 0
												? salon.memberData.memberExperience
												: 5} {t('years')}
										</Typography>
									</Box>

									<Stack direction="row" gap={1} sx={{ width: '100%' }}>
										<Button
											fullWidth
											className={`follow-btn ${isFollowingMember ? 'following' : ''}`}
											startIcon={isFollowingMember ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
											onClick={() => followHandler(FollowGroup.MEMBER, String(salon.memberData!._id), isFollowingMember, setIsFollowingMember)}
										>
											{isFollowingMember ? t('Following') : t('Follow')}
										</Button>
										<Link href={`/member?memberId=${salon.memberData._id}`} style={{ flex: 1 }}>
											<Button fullWidth className="view-profile-btn">{t('View Profile')}</Button>
										</Link>
										<IconButton className="message-agent-btn" onClick={messageAgentHandler}>
											<ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
										</IconButton>
									</Stack>
								</Stack>
							</Stack>
						)}
					</Stack>
					{/* ══════════ O'NG BLOK tugadi ══════════ */}

				</Stack>
				{/* detail-columns tugadi */}

				{/* ═══ SIMILAR SALONS (to'liq kenglik, columns tashqarisida) ═══ */}
				{similarSalons.length > 0 && (
					<Stack className="full-section similar-section">
						<Typography className="section-title">{t('Similar Salons')}</Typography>
						<Swiper slidesPerView="auto" spaceBetween={20} modules={[Navigation]}>
							{similarSalons.map((s) => {
								const img = imgUrl(s.salonImages?.[0]);
								return (
									<SwiperSlide key={s._id} style={{ width: 240 }}>
										<Stack className="similar-card" onClick={() => router.push(`/salons/${s._id}`)}>
											<Box component="div" className="similar-img" style={{ backgroundImage: `url(${img})` }}>
												<Chip label={isSalonOpen(s.salonWorkHours) ? t('Open') : t('Closed')}
													size="small" className={`open-chip small ${isSalonOpen(s.salonWorkHours) ? 'open' : 'closed'}`} />
											</Box>
											<Box component="div" sx={{ p: 1.5 }}>
												<Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', mb: 0.25 }}>{s.salonTitle}</Typography>
												<Typography sx={{ fontSize: 11, color: '#888' }}>{s.salonAddress}</Typography>
												<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
													<Typography sx={{ fontSize: 13, color: '#FF4D8D', fontWeight: 600 }}>₩30,000~</Typography>
													<RatingStars rating={4.9} size="small" showNumber={false} />
												</Stack>
											</Box>
										</Stack>
									</SwiperSlide>
								);
							})}
						</Swiper>
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(SalonDetail);