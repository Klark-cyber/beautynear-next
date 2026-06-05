import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Stack, Box, Typography, Button, IconButton, Chip,
	Select, MenuItem, CircularProgress, Divider, Avatar,
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
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Link from 'next/link';
import moment from 'moment';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import RatingStars from '../../libs/components/common/Ratingstars';
import EmptyList from '../../libs/components/common/Emptylist';
import { GET_SALON, GET_SALONS, GET_SERVICES, GET_COMMENTS, GET_MY_BOOKINGS } from '../../apollo/user/query';
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
import { isSalonOpen } from '../../libs/utils';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

SwiperCore.use([Autoplay, Navigation]);

export const getServerSideProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

// ── Time slot generator ────────────────────────────────────────────────────────
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

	const salonId = router.query.id as string;

	// ── State ──────────────────────────────────────────────────────────────────
	const [salon, setSalon] = useState<Salon | null>(null);
	const [slideImage, setSlideImage] = useState<string>('');
	const [services, setServices] = useState<Service[]>([]);
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState(0);
	const [similarSalons, setSimilarSalons] = useState<Salon[]>([]);
	const [myBookings, setMyBookings] = useState<Booking[]>([]);

	// Booking state
	const [selectedService, setSelectedService] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<string>(moment().add(1, 'day').format('YYYY-MM-DD'));
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [bookedSlots, setBookedSlots] = useState<string[]>([]);
	const [bookingLoading, setBookingLoading] = useState(false);
	const [isFollowingMember, setIsFollowingMember] = useState(false);
	const [isFollowingSalon, setIsFollowingSalon] = useState(false);

	// Comment state
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>({
		page: 1, limit: 5, sort: 'createdAt', direction: Direction.DESC,
		search: { commentRefId: '' },
	});
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.SALON,
		commentContent: '',
		commentRefId: '',
	});

	// Check if user has completed booking (for review)
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
			}
		},
	});

	useQuery(GET_SERVICES, {
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

	// Similar salons
	useQuery(GET_SALONS, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: {
				page: 1, limit: 6, sort: 'salonRank', direction: Direction.DESC,
				search: {
					locationList: salon?.salonLocation ? [salon.salonLocation] : [],
					typeList: salon?.salonType ? [salon.salonType] : [],
				},
			},
		},
		skip: !salon,
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

	// Band bo'lgan slotlarni hisoblash
	useEffect(() => {
		if (selectedDate && salonId) {
			const booked = myBookings
				.filter((b) => b.salonId === salonId &&
					moment(b.bookingDate).format('YYYY-MM-DD') === selectedDate &&
					b.bookingStatus !== BookingStatus.CANCELLED)
				.map((b) => b.bookingTime);
			setBookedSlots(booked);
		}
	}, [selectedDate, salonId, myBookings]);

	/** HANDLERS **/
	const likeHandler = useCallback(async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetSalon({ variables: { input: salonId } });
			await salonRefetch({ input: salonId });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	}, [user, salonId]);


	const followHandler = useCallback(async (
		group: FollowGroup,
		targetId: string,
		isFollowing: boolean,
		setter: (v: boolean) => void,
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

			// TossPayments sandbox — mock paymentKey
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
	const mainImg = slideImage
		? `${REACT_APP_API_URL}/${slideImage}`
		: '/img/banner/default.jpg';

	// ── RATING BREAKDOWN (mock — real data yo'q) ───────────────────────────────
	const ratingBreakdown = [
		{ stars: 5, count: 278, pct: 87 },
		{ stars: 4, count: 32, pct: 10 },
		{ stars: 3, count: 8, pct: 3 },
		{ stars: 2, count: 2, pct: 1 },
		{ stars: 1, count: 0, pct: 0 },
	];

	// ── MOBILE ─────────────────────────────────────────────────────────────────
	if (device === 'mobile') {
		return (
			<Stack className="salon-detail-page mobile">
				{/* Back */}
				<Stack direction="row" alignItems="center" gap={1} className="mobile-back-bar" onClick={() => router.back()}>
					<ArrowBackIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
					<Typography sx={{ fontSize: 14, color: '#FF4D8D', fontWeight: 600 }}>{t('Back to salons')}</Typography>
				</Stack>

				{/* Image swiper */}
				<Box component="div" className="mobile-gallery">
					<Swiper slidesPerView={1} modules={[]}>
						{salon.salonImages?.map((img, i) => (
							<SwiperSlide key={i}>
								<img src={`${REACT_APP_API_URL}/${img}`} alt="" style={{ width: '100%', height: 260, objectFit: 'cover' }} />
							</SwiperSlide>
						))}
					</Swiper>
					<Chip label={isOpen ? t('Open') : t('Closed')} className={`open-chip ${isOpen ? 'open' : 'closed'}`} />
				</Box>

				{/* Info */}
				<Stack className="mobile-info" sx={{ px: 2, py: 2 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
						<Stack>
							<Stack direction="row" alignItems="center" gap={1}>
								<Typography className="salon-name">{salon.salonTitle}</Typography>
								{isTop && <Chip label="⚡ TOP" size="small" className="top-chip" />}
							</Stack>
							<RatingStars rating={4.9} count={320} size="small" />
						</Stack>
						<IconButton onClick={likeHandler} className={`like-btn ${liked ? 'liked' : ''}`}>
							{liked ? <FavoriteIcon sx={{ color: '#FF4D8D' }} /> : <FavoriteBorderIcon />}
						</IconButton>
					</Stack>

					<Stack gap={0.75} sx={{ mt: 1.5 }}>
						<Stack direction="row" alignItems="center" gap={0.75}>
							<LocationOnOutlinedIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
							<Typography sx={{ fontSize: 13, color: '#666' }}>{salon.salonAddress}</Typography>
						</Stack>
						{salon.memberData && (
							<Stack direction="row" alignItems="center" gap={0.75}>
								<PersonOutlineIcon sx={{ fontSize: 14, color: '#888' }} />
								<Link href={`/member?memberId=${salon.memberData._id}`}>
									<Typography sx={{ fontSize: 13, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer' }}>
										{t('By')}: {salon.memberData.memberNick}
									</Typography>
								</Link>
							</Stack>
						)}
						<Stack direction="row" gap={0.75} flexWrap="wrap">
							<Chip label={t(salon.salonType)} size="small" className="type-chip" />
						</Stack>
						<Stack direction="row" alignItems="center" gap={0.75}>
							<AccessTimeIcon sx={{ fontSize: 14, color: isOpen ? '#4CAF50' : '#e53935' }} />
							<Typography sx={{ fontSize: 13, color: isOpen ? '#4CAF50' : '#e53935', fontWeight: 600 }}>
								{t('Open')}: {salon.salonWorkHours}
							</Typography>
						</Stack>
					</Stack>

					{/* Services */}
					<Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', mt: 2.5, mb: 1.5 }}>
						{t('Services offered')}
					</Typography>
					<Stack direction="row" gap={1.5} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
						{services.map((svc) => (
							<Stack key={svc._id} className="mobile-service-card">
								<Box component="div" className="svc-img"
									style={{ backgroundImage: `url(${REACT_APP_API_URL}/${svc.serviceImages?.[0]})` }} />
								<Typography className="svc-name">{svc.serviceTitle}</Typography>
								<Typography className="svc-price">₩{svc.servicePrice?.toLocaleString()}</Typography>
								<Typography className="svc-dur">{svc.serviceDuration} min</Typography>
								<Button className="svc-book-btn" onClick={() => {
									setSelectedService(svc._id);
									document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
								}}>
									{t('Book')}
								</Button>
							</Stack>
						))}
					</Stack>
				</Stack>

				{/* Booking section */}
				<Stack id="booking-section" className="mobile-booking-card" sx={{ mx: 2, mb: 3 }}>
					<Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', mb: 2 }}>{t('Book Appointment')}</Typography>

					<Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
						<Box component="div">
							<Typography sx={{ fontSize: 11, color: '#888' }}>{t('Starting from')}</Typography>
							<Typography sx={{ fontSize: 20, fontWeight: 800, color: '#FF4D8D' }}>
								₩{services[0]?.servicePrice?.toLocaleString() ?? '30,000'}
							</Typography>
						</Box>
						<Box component="div" sx={{ textAlign: 'right' }}>
							<Typography sx={{ fontSize: 11, color: '#888' }}>{t('Deposit')}</Typography>
							<Typography sx={{ fontSize: 16, fontWeight: 700, color: '#333' }}>
								₩{salon.depositAmount?.toLocaleString()}
							</Typography>
						</Box>
					</Stack>

					<Typography sx={{ fontSize: 12, fontWeight: 600, color: '#555', mb: 0.75 }}>{t('Select Service')}</Typography>
					<Select fullWidth size="small" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}
						displayEmpty sx={{ mb: 1.5, borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}>
						<MenuItem value="" disabled>{t('Choose a service')}</MenuItem>
						{services.map((svc) => (
							<MenuItem key={svc._id} value={svc._id}>{svc.serviceTitle} — ₩{svc.servicePrice?.toLocaleString()}</MenuItem>
						))}
					</Select>

					<Typography sx={{ fontSize: 12, fontWeight: 600, color: '#555', mb: 0.75 }}>{t('Select Date')}</Typography>
					<TextField fullWidth size="small" type="date" value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
						inputProps={{ min: moment().add(1, 'day').format('YYYY-MM-DD') }}
						sx={{ mb: 1.5, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, borderRadius: 2 }} />

					<Typography sx={{ fontSize: 12, fontWeight: 600, color: '#555', mb: 1 }}>{t('Select Time')}</Typography>
					<Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
						{timeSlots.map((slot) => {
							const isBooked = bookedSlots.includes(slot);
							return (
								<Box key={slot} component="div"
									onClick={() => !isBooked && setSelectedTime(slot)}
									className={`time-slot ${selectedTime === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}>
									{slot}
								</Box>
							);
						})}
					</Stack>

					<Button fullWidth className="book-now-btn" onClick={bookingHandler} disabled={bookingLoading}>
						{bookingLoading ? '...' : `${t('Book Now')} — ₩${salon.depositAmount?.toLocaleString()}`}
					</Button>

					<Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1.5, justifyContent: 'center' }}>
						<ShieldOutlinedIcon sx={{ fontSize: 13, color: '#888' }} />
						<Typography sx={{ fontSize: 11, color: '#888' }}>
							{t('Pay ₩{{amount}} deposit • Rest paid at salon', { amount: salon.depositAmount?.toLocaleString() })}
						</Typography>
					</Stack>
				</Stack>
			</Stack>
		);
	}

	// ── DESKTOP ─────────────────────────────────────────────────────────────────
	return (
		<Stack className="salon-detail-page">
			<Stack className="salon-detail-inner">
				{/* Back */}
				<Stack direction="row" alignItems="center" gap={0.75} className="back-link" onClick={() => router.back()}>
					<ArrowBackIcon sx={{ fontSize: 16 }} />
					<Typography sx={{ fontSize: 13 }}>{t('Back to salons')}</Typography>
				</Stack>

				<Stack direction="row" gap={4} alignItems="flex-start">
					{/* ── LEFT ── */}
					<Stack className="salon-detail-left">
						{/* Gallery */}
						<Stack className="gallery-section">
							<Box component="div" className="main-img-wrap">
								<img src={mainImg} alt={salon.salonTitle} className="main-img" />
								<Chip label={isOpen ? t('Open') : t('Closed')}
									className={`open-chip ${isOpen ? 'open' : 'closed'}`} />
								<IconButton className={`like-btn ${liked ? 'liked' : ''}`} onClick={likeHandler}>
									{liked ? <FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
								</IconButton>
							</Box>
							<Stack direction="row" gap={1} className="thumbnails">
								{salon.salonImages?.slice(0, 4).map((img, i) => (
									<Box key={i} component="div"
										onClick={() => setSlideImage(img)}
										className={`thumb ${slideImage === img ? 'active' : ''}`}
										style={{ backgroundImage: `url(${REACT_APP_API_URL}/${img})` }}
									/>
								))}
							</Stack>
						</Stack>

						{/* Salon info */}
						<Stack className="salon-info-section">
							<Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 0.75 }}>
								<Typography className="salon-title">{salon.salonTitle}</Typography>
								{isTop && <Chip label="⚡ TOP" size="small" className="top-chip" />}
							</Stack>

							<Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
								<RatingStars rating={4.9} count={320} size="medium" />
								<Stack direction="row" alignItems="center" gap={1} sx={{ ml: 1 }}>
									<RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
									<Typography sx={{ fontSize: 12, color: '#999' }}>{salon.salonViews}</Typography>
									<FavoriteBorderIcon sx={{ fontSize: 14, color: '#999' }} />
									<Typography sx={{ fontSize: 12, color: '#999' }}>{salon.salonLikes}</Typography>
								</Stack>
							</Stack>

							<Stack gap={0.75}>
								<Stack direction="row" alignItems="center" gap={0.75}>
									<LocationOnOutlinedIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
									<Typography sx={{ fontSize: 14, color: '#555' }}>{salon.salonAddress}</Typography>
								</Stack>
								{salon.memberData && (
									<Stack direction="row" alignItems="center" gap={0.75}>
										<PersonOutlineIcon sx={{ fontSize: 15, color: '#888' }} />
										<Link href={`/member?memberId=${salon.memberData._id}`}>
											<Typography sx={{ fontSize: 14, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
												{t('By')}: {salon.memberData.memberNick} →
											</Typography>
										</Link>
									</Stack>
								)}
								<Stack direction="row" gap={0.75} flexWrap="wrap">
									<Chip label={t(salon.salonType)} size="small" className="type-chip" />
								</Stack>
								<Stack direction="row" alignItems="center" gap={0.75}>
									<AccessTimeIcon sx={{ fontSize: 15, color: isOpen ? '#4CAF50' : '#e53935' }} />
									<Typography sx={{ fontSize: 14, color: isOpen ? '#4CAF50' : '#e53935', fontWeight: 600 }}>
										{t('Open')}: {salon.salonWorkHours}
									</Typography>
								</Stack>
								{salon.salonPhone && (
									<Stack direction="row" alignItems="center" gap={0.75}>
										<PhoneOutlinedIcon sx={{ fontSize: 15, color: '#888' }} />
										<Typography sx={{ fontSize: 14, color: '#555' }}>{salon.salonPhone}</Typography>
									</Stack>
								)}
								{salon.salonInstagram && (
									<Stack direction="row" alignItems="center" gap={0.75}>
										<InstagramIcon sx={{ fontSize: 15, color: '#888' }} />
										<Typography sx={{ fontSize: 14, color: '#555' }}>{salon.salonInstagram}</Typography>
									</Stack>
								)}
							</Stack>

							{salon.salonDesc && (
								<Box component="div" className="about-section">
									<Typography className="section-title">{t('About this salon')}</Typography>
									<Typography sx={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{salon.salonDesc}</Typography>
								</Box>
							)}
						</Stack>

						{/* Services */}
						<Stack className="services-section">
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
								<Typography className="section-title">{t('Services offered')}</Typography>
							</Stack>
							{services.length === 0 ? (
								<EmptyList emoji="✂️" title={t('No services yet')} />
							) : (
								<Stack direction="row" gap={2} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
									{services.map((svc) => (
										<Stack key={svc._id} className="service-card">
											<Box component="div" className="svc-img"
												style={{ backgroundImage: `url(${REACT_APP_API_URL}/${svc.serviceImages?.[0] ?? ''})` }}>
												<IconButton className="svc-like-btn">
													<FavoriteBorderIcon sx={{ fontSize: 14 }} />
												</IconButton>
											</Box>
											<Box component="div" sx={{ p: 1.5 }}>
												<Typography className="svc-name">{svc.serviceTitle}</Typography>
												<Typography className="svc-price">₩{svc.servicePrice?.toLocaleString()}</Typography>
												<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
													<Typography className="svc-dur">{svc.serviceDuration} min</Typography>
													<RatingStars rating={svc.serviceRating || 4.9} size="small" showNumber={false} />
												</Stack>
												<Button fullWidth className="svc-book-btn" onClick={() => setSelectedService(svc._id)}>
													{t('Book')}
												</Button>
											</Box>
										</Stack>
									))}
								</Stack>
							)}
						</Stack>

						{/* Reviews */}
						<Stack className="reviews-section">
							<Typography className="section-title">{t('Customer Reviews')}</Typography>

							{/* Rating summary */}
							<Stack direction="row" gap={4} className="rating-summary">
								<Stack alignItems="center" justifyContent="center">
									<Typography className="big-rating">4.9</Typography>
									<RatingStars rating={4.9} size="medium" showNumber={false} />
									<Typography sx={{ fontSize: 12, color: '#888', mt: 0.5 }}>(320 {t('reviews')})</Typography>
								</Stack>
								<Stack flex={1} gap={0.75}>
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

							{/* Review cards */}
							{comments.length === 0 ? (
								<EmptyList emoji="💬" title={t('No reviews yet')} desc={t('Be the first to review!')} />
							) : (
								<Stack gap={2} className="review-list">
									{comments.map((comment) => {
										const authorImg = comment.memberData?.memberImage
											? `${REACT_APP_API_URL}/${comment.memberData.memberImage}`
											: '/img/profile/defaultUser.svg';
										return (
											<Stack key={comment._id} className="review-card">
												<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
													<Stack direction="row" gap={1.5} alignItems="center">
														<Avatar src={authorImg} sx={{ width: 40, height: 40 }} />
														<Box component="div">
															<Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
																{comment.memberData?.memberNick}
															</Typography>
															<Typography sx={{ fontSize: 12, color: '#bbb' }}>
																{moment(comment.createdAt).format('MMM DD, YYYY')}
															</Typography>
														</Box>
													</Stack>
													<RatingStars rating={4.9} size="small" showNumber={false} />
												</Stack>
												<Typography sx={{ fontSize: 14, color: '#555', lineHeight: 1.6, mt: 1 }}>
													{comment.commentContent}
												</Typography>
											</Stack>
										);
									})}
								</Stack>
							)}

							{commentTotal > commentInquiry.limit && (
								<MuiPagination
									page={commentInquiry.page}
									count={Math.ceil(commentTotal / commentInquiry.limit)}
									onChange={commentPageHandler}
									shape="circular"
									sx={{ mt: 2, '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
								/>
							)}

							{/* Write review */}
							{canWriteReview && (
								<Stack className="write-review-section">
									<Typography className="section-title">{t('Leave A Review')}</Typography>
									<textarea
										className="review-textarea"
										placeholder={t('Share your experience...')}
										value={insertCommentData.commentContent}
										onChange={(e) => setInsertCommentData((prev) => ({ ...prev, commentContent: e.target.value }))}
									/>
									<Button className="submit-review-btn"
										disabled={!insertCommentData.commentContent || !user._id}
										onClick={createCommentHandler}>
										{t('Submit Review')}
									</Button>
								</Stack>
							)}
						</Stack>

						{/* Map */}
						{salon.salonLatitude && salon.salonLongitude && (
							<Stack className="map-section">
								<Typography className="section-title">{t('Location')}</Typography>
								<Box component="div" className="map-wrap">
									<iframe
										src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${salon.salonLatitude},${salon.salonLongitude}`}
										width="100%" height="100%"
										style={{ border: 0, borderRadius: 12 }}
										allowFullScreen loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
									/>
								</Box>
							</Stack>
						)}
					</Stack>

					{/* ── RIGHT SIDEBAR ── */}
					<Stack className="salon-detail-right">
						{/* Booking card */}
						<Stack className="booking-card">
							<Typography sx={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', mb: 2 }}>
								{t('Book Your Appointment')}
							</Typography>

							<Stack direction="row" justifyContent="space-between" sx={{ mb: 2.5 }}>
								<Box component="div">
									<Typography sx={{ fontSize: 11, color: '#888' }}>{t('Starting from')}</Typography>
									<Typography sx={{ fontSize: 22, fontWeight: 800, color: '#FF4D8D' }}>
										₩{services[0]?.servicePrice?.toLocaleString() ?? '30,000'}
									</Typography>
								</Box>
								<Box component="div" sx={{ textAlign: 'right' }}>
									<Stack direction="row" alignItems="center" gap={0.5}>
										<Typography sx={{ fontSize: 11, color: '#888' }}>{t('Deposit')}</Typography>
										<ShieldOutlinedIcon sx={{ fontSize: 13, color: '#888' }} />
									</Stack>
									<Typography sx={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
										₩{salon.depositAmount?.toLocaleString()}
									</Typography>
								</Box>
							</Stack>

							{/* Service select */}
							<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333', mb: 0.75 }}>{t('Select Service')}</Typography>
							<Select fullWidth size="small" value={selectedService}
								onChange={(e) => setSelectedService(e.target.value)}
								displayEmpty
								sx={{ mb: 2, borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, '&:hover fieldset': { borderColor: '#FF4D8D' } }}>
								<MenuItem value="" disabled>{t('Choose a service')}</MenuItem>
								{services.map((svc) => (
									<MenuItem key={svc._id} value={svc._id}>
										{svc.serviceTitle} — ₩{svc.servicePrice?.toLocaleString()}
									</MenuItem>
								))}
							</Select>

							{/* Date */}
							<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333', mb: 0.75 }}>{t('Select Date')}</Typography>
							<TextField fullWidth size="small" type="date" value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								inputProps={{ min: moment().add(1, 'day').format('YYYY-MM-DD') }}
								sx={{ mb: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, '&:hover fieldset': { borderColor: '#FF4D8D' }, borderRadius: 2 }} />

							{/* Time slots */}
							<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333', mb: 1 }}>{t('Select Time')}</Typography>
							<Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
								{timeSlots.map((slot) => {
									const isBooked = bookedSlots.includes(slot);
									return (
										<Box key={slot} component="div"
											onClick={() => !isBooked && setSelectedTime(slot)}
											className={`time-slot ${selectedTime === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}>
											{slot}
										</Box>
									);
								})}
							</Stack>

							{/* Book button */}
							<Button fullWidth className="book-now-btn" onClick={bookingHandler} disabled={bookingLoading}>
								{bookingLoading ? '...' : `${t('Book Now')} — ₩${salon.depositAmount?.toLocaleString()}`}
							</Button>

							<Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1.5, justifyContent: 'center' }}>
								<ShieldOutlinedIcon sx={{ fontSize: 12, color: '#888' }} />
								<Typography sx={{ fontSize: 11, color: '#888', textAlign: 'center' }}>
									{t('Pay ₩{{amount}} deposit • Rest paid at salon', { amount: salon.depositAmount?.toLocaleString() })}
								</Typography>
							</Stack>
						</Stack>

						{/* Follow salon */}
						<Stack direction="row" gap={1} sx={{ mt: 1 }}>
							<Button
								fullWidth
								className={`follow-btn ${isFollowingSalon ? 'following' : ''}`}
								startIcon={isFollowingSalon ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
								onClick={() => followHandler(FollowGroup.SALON, String(salon._id), isFollowingSalon, setIsFollowingSalon)}
							>
								{isFollowingSalon ? t('Following') : t('Follow Salon')}
							</Button>
						</Stack>

						{/* Specialist card */}
						{salon.memberData && (
							<Stack className="specialist-card">
								<Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 2 }}>
									{t('Your Specialist')}
								</Typography>
								<Stack alignItems="center" gap={1.5}>
									<Box component="div" sx={{ position: 'relative' }}>
										<Avatar
											src={salon.memberData.memberImage
												? `${REACT_APP_API_URL}/${salon.memberData.memberImage}`
												: '/img/profile/defaultUser.svg'}
											sx={{ width: 80, height: 80, border: '3px solid #FF85B3' }}
										/>
										<Box component="div" sx={{
											position: 'absolute', bottom: 0, right: 0,
											width: 22, height: 22, borderRadius: '50%',
											background: '#FF4D8D', display: 'flex', alignItems: 'center', justifyContent: 'center',
										}}>
											<VerifiedIcon sx={{ fontSize: 14, color: '#fff' }} />
										</Box>
									</Box>

									<Box component="div" sx={{ textAlign: 'center' }}>
										<Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
											{salon.memberData.memberNick}
										</Typography>
										{salon.memberData.memberSpecialty && salon.memberData.memberSpecialty.length > 0 && (
											<Stack direction="row" gap={0.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 0.75 }}>
												{salon.memberData.memberSpecialty.map((sp) => (
													<Chip key={sp} label={t(sp)} size="small" className="specialty-chip" />
												))}
											</Stack>
										)}
										{salon.memberData.memberExperience && salon.memberData.memberExperience > 0 && (
											<Typography sx={{ fontSize: 13, color: '#888', mt: 0.75 }}>
												{t('Experience')}: {salon.memberData.memberExperience} {t('years')}
											</Typography>
										)}
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
										<Link href={`/member?memberId=${salon.memberData._id}`}>
											<Button fullWidth className="view-profile-btn">
												{t('View Profile')}
											</Button>
										</Link>
									</Stack>
								</Stack>
							</Stack>
						)}
					</Stack>
				</Stack>

				{/* Similar salons */}
				{similarSalons.length > 0 && (
					<Stack className="similar-section">
						<Typography className="section-title">{t('Similar Salons')}</Typography>
						<Swiper slidesPerView="auto" spaceBetween={20} modules={[Autoplay, Navigation]}
							navigation={{ nextEl: '.swiper-similar-next', prevEl: '.swiper-similar-prev' }}>
							{similarSalons.map((s) => {
								const img = s.salonImages?.[0] ? `${REACT_APP_API_URL}/${s.salonImages[0]}` : '/img/banner/default.jpg';
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