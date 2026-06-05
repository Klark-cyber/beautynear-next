import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar, useApolloClient } from '@apollo/client';
import {
    Stack, Box, Typography, Button, IconButton, Chip,
    Select, MenuItem, CircularProgress, Avatar,
    TextField, Pagination as MuiPagination, Divider,
} from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay } from 'swiper';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import Link from 'next/link';
import moment from 'moment';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import RatingStars from '../../libs/components/common/Ratingstars';
import EmptyList from '../../libs/components/common/Emptylist';
import {
    GET_SERVICE, GET_SALON, GET_COMMENTS, GET_MY_BOOKINGS,
} from '../../apollo/user/query';
import {
    LIKE_TARGET_SERVICE, CREATE_COMMENT, CREATE_BOOKING,
    SUBSCRIBE, UNSUBSCRIBE,
} from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Service } from '../../libs/types/service/service';
import { Salon } from '../../libs/types/salon/salon';
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

SwiperCore.use([Autoplay]);

export const getServerSideProps = async ({ locale }: any) => ({
    props: { ...(await serverSideTranslations(locale, ['common'])) },
});

// Time slot generator
const generateTimeSlots = (workHours: string): string[] => {
    try {
        const [start, end] = workHours.split('-');
        const [startH] = start.split(':').map(Number);
        const [endH] = end.split(':').map(Number);
        const slots: string[] = [];
        for (let h = startH; h < endH; h++) slots.push(`${String(h).padStart(2, '0')}:00`);
        return slots;
    } catch {
        return ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    }
};

const ServiceDetail: NextPage = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const user = useReactiveVar(userVar);
    const client = useApolloClient();

    const serviceId = router.query.id as string;

    // State
    const [service, setService] = useState<Service | null>(null);
    const [salon, setSalon] = useState<Salon | null>(null);
    const [activeImg, setActiveImg] = useState<'before' | 'after'>('before');
    const [slideImage, setSlideImage] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentTotal, setCommentTotal] = useState(0);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [selectedDate, setSelectedDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState('');
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [isFollowingMember, setIsFollowingMember] = useState(false);
    const [isFollowingSalon, setIsFollowingSalon] = useState(false);
    const [isFollowingService, setIsFollowingService] = useState(false);
    const [showAllSlots, setShowAllSlots] = useState(false);

    const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>({
        page: 1, limit: 5, sort: 'createdAt', direction: Direction.DESC,
        search: { commentRefId: '' },
    });
    const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
        commentGroup: CommentGroup.SERVICE,
        commentContent: '',
        commentRefId: '',
    });

    const canWriteReview = myBookings.some(
        (b) => b.salonId === service?.salonId && b.bookingStatus === BookingStatus.COMPLETED,
    );

    // Rating breakdown (mock)
    const ratingBreakdown = [
        { stars: 5, count: 108, pct: 84 },
        { stars: 4, count: 16, pct: 13 },
        { stars: 3, count: 3, pct: 2 },
        { stars: 2, count: 1, pct: 1 },
        { stars: 1, count: 0, pct: 0 },
    ];

    /** APOLLO **/
    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);
    const [createComment] = useMutation(CREATE_COMMENT);
    const [createBooking] = useMutation(CREATE_BOOKING);
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);

    const { refetch: serviceRefetch } = useQuery(GET_SERVICE, {
        fetchPolicy: 'network-only',
        variables: { input: serviceId },
        skip: !serviceId,
        onCompleted: (data: T) => {
            if (data?.getService) {
                setService(data.getService);
                setSlideImage(data.getService.serviceImages?.[0] ?? '');
                setCommentInquiry((prev) => ({ ...prev, search: { commentRefId: serviceId } }));
                setInsertCommentData((prev) => ({ ...prev, commentRefId: serviceId }));
            }
        },
    });

    // Load salon
    useQuery(GET_SALON, {
        fetchPolicy: 'cache-and-network',
        variables: { input: service?.salonId },
        skip: !service?.salonId,
        onCompleted: (data: T) => setSalon(data?.getSalon ?? null),
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

    /** LIFECYCLES **/
    useEffect(() => {
        if (commentInquiry.search.commentRefId) commentsRefetch({ input: commentInquiry });
    }, [commentInquiry]);

    useEffect(() => {
        if (selectedDate && serviceId) {
            const booked = myBookings
                .filter((b) => b.salonId === service?.salonId &&
                    moment(b.bookingDate).format('YYYY-MM-DD') === selectedDate &&
                    b.bookingStatus !== BookingStatus.CANCELLED)
                .map((b) => b.bookingTime);
            setBookedSlots(booked);
        }
    }, [selectedDate, serviceId, myBookings]);

    /** HANDLERS **/
    const likeHandler = useCallback(async () => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await likeTargetService({ variables: { input: serviceId } });
            await serviceRefetch({ input: serviceId });
            await sweetTopSmallSuccessAlert('success', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, serviceId]);

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
            if (group === FollowGroup.SERVICE) input.serviceId = targetId;

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
            if (!selectedDate) throw new Error(t('Please select a date'));
            if (!selectedTime) throw new Error(t('Please select a time'));
            setBookingLoading(true);
            const paymentKey = `test_pay_${Date.now()}`;
            await createBooking({
                variables: {
                    input: {
                        serviceId,
                        salonId: service?.salonId,
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
    }, [user, selectedDate, selectedTime, serviceId, service]);

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

    if (!service) return (
        <Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <CircularProgress sx={{ color: '#FF4D8D' }} size={48} />
        </Stack>
    );

    const beforeImg = service.serviceImages?.[0] ? `${REACT_APP_API_URL}/${service.serviceImages[0]}` : '/img/banner/default.jpg';
    const afterImg = service.serviceImages?.[1] ? `${REACT_APP_API_URL}/${service.serviceImages[1]}` : beforeImg;
    const currentImg = activeImg === 'before' ? beforeImg : afterImg;
    const liked = service.meLiked?.[0]?.myFavorite;
    const timeSlots = salon ? generateTimeSlots(salon.salonWorkHours) : [];
    const displaySlots = showAllSlots ? timeSlots : timeSlots.slice(0, 6);

    // ── Booking + Specialist + Salon sidebar ─────────────────────────────────
    const SidebarContent = () => (
        <>
            {/* Booking card */}
            <Stack className="booking-card">
                <Typography sx={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', mb: 2 }}>
                    {t('Book This Service')}
                </Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Box component="div">
                        <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Price')}</Typography>
                        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#FF4D8D' }}>
                            ₩{service.servicePrice?.toLocaleString()}
                        </Typography>
                    </Box>
                    <Box component="div" sx={{ textAlign: 'right' }}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Deposit')}</Typography>
                            <ShieldOutlinedIcon sx={{ fontSize: 13, color: '#888' }} />
                        </Stack>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#333' }}>₩10,000</Typography>
                    </Box>
                </Stack>

                {/* Salon info */}
                {salon && (
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2, p: 1.25, background: '#fff8fb', borderRadius: 2, border: '1px solid rgba(255,77,141,0.1)' }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
                        <Box component="div">
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{salon.salonTitle}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{salon.salonAddress}</Typography>
                        </Box>
                    </Stack>
                )}

                {/* Date */}
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333', mb: 0.75 }}>{t('Select Date')}</Typography>
                <TextField fullWidth size="small" type="date" value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    inputProps={{ min: moment().add(1, 'day').format('YYYY-MM-DD') }}
                    sx={{ mb: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, borderRadius: 2 }} />

                {/* Time slots */}
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333', mb: 1 }}>{t('Select Time')}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                    {displaySlots.map((slot) => {
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

                {timeSlots.length > 6 && (
                    <Button size="small" onClick={() => setShowAllSlots(!showAllSlots)}
                        sx={{ color: '#888', fontSize: 12, mb: 1.5 }}>
                        {showAllSlots ? t('Show less') : `${t('More times')} ▾`}
                    </Button>
                )}

                <Button fullWidth className="book-now-btn" onClick={bookingHandler} disabled={bookingLoading}>
                    {bookingLoading ? '...' : `${t('Book Now')} — ₩10,000`}
                </Button>
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1.5, justifyContent: 'center' }}>
                    <ShieldOutlinedIcon sx={{ fontSize: 12, color: '#888' }} />
                    <Typography sx={{ fontSize: 11, color: '#888', textAlign: 'center' }}>
                        {t('Pay ₩10,000 deposit • Rest paid at salon')}
                    </Typography>
                </Stack>
            </Stack>

            {/* Specialist card */}
            {service.memberData && (
                <Stack className="specialist-card">
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 2 }}>
                        {t('Your Specialist')}
                    </Typography>
                    <Stack alignItems="center" gap={1.5}>
                        <Box component="div" sx={{ position: 'relative' }}>
                            <Avatar
                                src={service.memberData.memberImage ? `${REACT_APP_API_URL}/${service.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
                                sx={{ width: 80, height: 80, border: '3px solid #FF85B3' }}
                            />
                            <Box component="div" sx={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#FF4D8D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <VerifiedIcon sx={{ fontSize: 14, color: '#fff' }} />
                            </Box>
                        </Box>
                        <Box component="div" sx={{ textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{service.memberData.memberNick}</Typography>
                            {service.memberData.memberSpecialty && service.memberData.memberSpecialty.length > 0 && (
                                <Stack direction="row" gap={0.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 0.75 }}>
                                    {service.memberData.memberSpecialty.map((sp) => (
                                        <Chip key={sp} label={t(sp)} size="small" className="specialty-chip" />
                                    ))}
                                </Stack>
                            )}
                            {service.memberData.memberExperience && service.memberData.memberExperience > 0 && (
                                <Typography sx={{ fontSize: 13, color: '#888', mt: 0.75 }}>
                                    {t('Experience')}: {service.memberData.memberExperience} {t('years')}
                                </Typography>
                            )}
                        </Box>
                        {/* Follow + View Profile */}
                        <Stack direction="row" gap={1} sx={{ width: '100%' }}>
                            <Button fullWidth className={`follow-btn ${isFollowingMember ? 'following' : ''}`}
                                startIcon={isFollowingMember ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
                                onClick={() => followHandler(FollowGroup.MEMBER, String(service.memberData!._id), isFollowingMember, setIsFollowingMember)}>
                                {isFollowingMember ? t('Following') : t('Follow')}
                            </Button>
                            <Link href={`/member?memberId=${service.memberData._id}`}>
                                <Button fullWidth className="view-profile-btn">{t('View Profile')}</Button>
                            </Link>
                        </Stack>
                    </Stack>
                </Stack>
            )}

            {/* Salon mini card */}
            {salon && (
                <Stack className="salon-mini-card">
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 1.5 }}>
                        {t('About the Salon')}
                    </Typography>
                    <Box component="div" className="salon-mini-img"
                        style={{ backgroundImage: `url(${salon.salonImages?.[0] ? `${REACT_APP_API_URL}/${salon.salonImages[0]}` : '/img/banner/default.jpg'})` }} />
                    <Box component="div" sx={{ mt: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{salon.salonTitle}</Typography>
                            <RatingStars rating={4.9} size="small" showNumber />
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 0.25 }}>
                            <LocationOnOutlinedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                            <Typography sx={{ fontSize: 12, color: '#666' }}>{salon.salonAddress}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 1.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 13, color: isSalonOpen(salon.salonWorkHours) ? '#4CAF50' : '#e53935' }} />
                            <Typography sx={{ fontSize: 12, color: isSalonOpen(salon.salonWorkHours) ? '#4CAF50' : '#e53935', fontWeight: 600 }}>
                                {t('Open')}: {salon.salonWorkHours}
                            </Typography>
                        </Stack>
                        {/* Follow salon + View Salon */}
                        <Stack direction="row" gap={1}>
                            <Button fullWidth className={`follow-btn ${isFollowingSalon ? 'following' : ''}`}
                                startIcon={isFollowingSalon ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
                                onClick={() => followHandler(FollowGroup.SALON, String(salon._id), isFollowingSalon, setIsFollowingSalon)}>
                                {isFollowingSalon ? t('Following') : t('Follow')}
                            </Button>
                            <Link href={`/salons/${salon._id}`}>
                                <Button fullWidth className="view-salon-btn">{t('View Salon →')}</Button>
                            </Link>
                        </Stack>
                    </Box>
                </Stack>
            )}
        </>
    );

    // ── MOBILE ──────────────────────────────────────────────────────────────────
    if (device === 'mobile') {
        return (
            <Stack className="service-detail-page mobile">
                {/* Back */}
                <Stack direction="row" alignItems="center" gap={1} sx={{ p: '12px 16px', background: '#fff', borderBottom: '1px solid rgba(255,77,141,0.08)', cursor: 'pointer' }} onClick={() => router.back()}>
                    <ArrowBackIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
                    <Typography sx={{ fontSize: 14, color: '#FF4D8D', fontWeight: 600 }}>{t('Back to services')}</Typography>
                </Stack>

                {/* Before/After tabs + image */}
                <Stack>
                    <Stack direction="row" gap={1} sx={{ p: '12px 16px 8px', background: '#fff' }}>
                        {['before', 'after'].map((tab) => (
                            <Button key={tab} size="small"
                                onClick={() => setActiveImg(tab as 'before' | 'after')}
                                sx={{
                                    px: 2, py: 0.5, borderRadius: 3,
                                    background: activeImg === tab ? '#FF4D8D' : 'transparent',
                                    color: activeImg === tab ? '#fff' : '#888',
                                    border: activeImg === tab ? 'none' : '1.5px solid rgba(255,77,141,0.3)',
                                    fontWeight: 700, fontSize: 13,
                                }}>
                                {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
                            </Button>
                        ))}
                    </Stack>
                    <Box component="div" sx={{ height: 280, backgroundImage: `url(${currentImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    {/* Thumbnails */}
                    <Stack direction="row" gap={1} sx={{ p: 1.5, background: '#fff', overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                        {service.serviceImages?.slice(0, 4).map((img, i) => (
                            <Box key={i} component="div"
                                onClick={() => setSlideImage(img)}
                                sx={{ width: 60, height: 50, borderRadius: 1.5, backgroundImage: `url(${REACT_APP_API_URL}/${img})`, backgroundSize: 'cover', flexShrink: 0, border: slideImage === img ? '2px solid #FF4D8D' : '2px solid transparent', cursor: 'pointer' }} />
                        ))}
                    </Stack>
                </Stack>

                {/* Service info */}
                <Stack sx={{ px: 2, py: 2, background: '#fff', mb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', flex: 1, mr: 1 }}>{service.serviceTitle}</Typography>
                        <IconButton onClick={likeHandler} sx={{ p: 0.5 }}>
                            {liked ? <FavoriteIcon sx={{ color: '#FF4D8D' }} /> : <FavoriteBorderIcon />}
                        </IconButton>
                    </Stack>
                    <RatingStars rating={service.serviceRating || 4.9} count={commentTotal} size="small" />
                    {service.salonData && (
                        <Link href={`/salons/${service.salonId}`}>
                            <Typography sx={{ fontSize: 13, color: '#FF4D8D', fontWeight: 600, mt: 0.75, cursor: 'pointer' }}>
                                🏪 {service.salonData.salonTitle}
                            </Typography>
                        </Link>
                    )}
                    {service.memberData && (
                        <Link href={`/member?memberId=${service.memberData._id}`}>
                            <Typography sx={{ fontSize: 13, color: '#FF4D8D', fontWeight: 600, mt: 0.25, cursor: 'pointer' }}>
                                👤 {t('By')}: {service.memberData.memberNick}
                            </Typography>
                        </Link>
                    )}
                    <Stack direction="row" gap={1.5} sx={{ mt: 1 }}>
                        <Chip label={`⏱️ ${service.serviceDuration} min`} size="small" sx={{ background: '#f5f5f5', fontSize: 12 }} />
                        <Chip label={`₩${service.servicePrice?.toLocaleString()}`} size="small" sx={{ background: 'rgba(255,77,141,0.08)', color: '#FF4D8D', fontSize: 12, fontWeight: 700 }} />
                        <Chip label={t(service.serviceType)} size="small" sx={{ background: 'rgba(255,77,141,0.08)', color: '#FF4D8D', fontSize: 12 }} />
                    </Stack>
                    <Stack direction="row" gap={2} sx={{ mt: 1 }}>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <RemoveRedEyeIcon sx={{ fontSize: 13, color: '#999' }} />
                            <Typography sx={{ fontSize: 12, color: '#999' }}>{service.serviceViews}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <FavoriteBorderIcon sx={{ fontSize: 13, color: '#999' }} />
                            <Typography sx={{ fontSize: 12, color: '#999' }}>{service.serviceLikes}</Typography>
                        </Stack>
                    </Stack>
                </Stack>

                {/* About */}
                {service.serviceDesc && (
                    <Stack sx={{ px: 2, py: 2, background: '#fff', mb: 1 }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 1 }}>{t('About this service')}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{service.serviceDesc}</Typography>
                    </Stack>
                )}

                {/* Booking section */}
                <Stack sx={{ px: 2, py: 2, background: '#fff', mb: 1 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 2 }}>{t('Book This Service')}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333', mb: 0.75 }}>{t('Select Date')}</Typography>
                    <TextField fullWidth size="small" type="date" value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        inputProps={{ min: moment().add(1, 'day').format('YYYY-MM-DD') }}
                        sx={{ mb: 1.5, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333', mb: 1 }}>{t('Select Time')}</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                        {displaySlots.map((slot) => {
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
                </Stack>

                {/* Specialist card mobile */}
                {service.memberData && (
                    <Stack sx={{ px: 2, py: 2, background: '#fff', mb: 1 }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 1.5 }}>{t('Your Specialist')}</Typography>
                        <Stack direction="row" alignItems="center" gap={2}>
                            <Box component="div" sx={{ position: 'relative', flexShrink: 0 }}>
                                <Avatar src={service.memberData.memberImage ? `${REACT_APP_API_URL}/${service.memberData.memberImage}` : '/img/profile/defaultUser.svg'}
                                    sx={{ width: 56, height: 56, border: '2px solid #FF85B3' }} />
                                <Box component="div" sx={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: '#FF4D8D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <VerifiedIcon sx={{ fontSize: 11, color: '#fff' }} />
                                </Box>
                            </Box>
                            <Box component="div" sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{service.memberData.memberNick}</Typography>
                                {service.memberData.memberSpecialty && service.memberData.memberSpecialty.length > 0 && (
                                    <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                        {service.memberData.memberSpecialty.map((sp) => (
                                            <Chip key={sp} label={t(sp)} size="small" className="specialty-chip" sx={{ fontSize: 10, height: 20 }} />
                                        ))}
                                    </Stack>
                                )}
                                {service.memberData.memberExperience && service.memberData.memberExperience > 0 && (
                                    <Typography sx={{ fontSize: 12, color: '#888', mt: 0.25 }}>
                                        {t('Experience')}: {service.memberData.memberExperience} {t('years')}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                        <Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
                            <Button fullWidth size="small" className={`follow-btn ${isFollowingMember ? 'following' : ''}`}
                                startIcon={isFollowingMember ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
                                onClick={() => followHandler(FollowGroup.MEMBER, String(service.memberData!._id), isFollowingMember, setIsFollowingMember)}>
                                {isFollowingMember ? t('Following') : t('Follow')}
                            </Button>
                            <Link href={`/member?memberId=${service.memberData._id}`}>
                                <Button fullWidth size="small" className="view-profile-btn">{t('View Profile')}</Button>
                            </Link>
                        </Stack>
                    </Stack>
                )}

                {/* Salon mini card mobile */}
                {salon && (
                    <Stack sx={{ px: 2, py: 2, background: '#fff', mb: 1 }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 1.5 }}>{t('About the Salon')}</Typography>
                        <Stack direction="row" gap={1.5} alignItems="center">
                            <Box component="div" sx={{ width: 80, height: 60, borderRadius: 2, backgroundImage: `url(${salon.salonImages?.[0] ? `${REACT_APP_API_URL}/${salon.salonImages[0]}` : '/img/banner/default.jpg'})`, backgroundSize: 'cover', flexShrink: 0 }} />
                            <Box component="div" sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{salon.salonTitle}</Typography>
                                <Typography sx={{ fontSize: 11, color: '#888' }}>{salon.salonAddress}</Typography>
                                <Typography sx={{ fontSize: 11, color: isSalonOpen(salon.salonWorkHours) ? '#4CAF50' : '#e53935', fontWeight: 600 }}>
                                    {t('Open')}: {salon.salonWorkHours}
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
                            <Button fullWidth size="small" className={`follow-btn ${isFollowingSalon ? 'following' : ''}`}
                                startIcon={isFollowingSalon ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
                                onClick={() => followHandler(FollowGroup.SALON, String(salon._id), isFollowingSalon, setIsFollowingSalon)}>
                                {isFollowingSalon ? t('Following') : t('Follow')}
                            </Button>
                            <Link href={`/salons/${salon._id}`}>
                                <Button fullWidth size="small" className="view-salon-btn">{t('View Salon →')}</Button>
                            </Link>
                        </Stack>
                    </Stack>
                )}

                {/* Reviews */}
                <Stack sx={{ px: 2, py: 2, background: '#fff', mb: 10 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 2 }}>{t('Customer Reviews')}</Typography>
                    {comments.length === 0 ? (
                        <EmptyList emoji="💬" title={t('No reviews yet')} desc={t('Be the first to review!')} />
                    ) : (
                        comments.map((comment) => (
                            <Stack key={comment._id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Avatar src={comment.memberData?.memberImage ? `${REACT_APP_API_URL}/${comment.memberData.memberImage}` : '/img/profile/defaultUser.svg'} sx={{ width: 32, height: 32 }} />
                                        <Box component="div">
                                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{comment.memberData?.memberNick}</Typography>
                                            <Typography sx={{ fontSize: 11, color: '#bbb' }}>{moment(comment.createdAt).format('MMM DD, YYYY')}</Typography>
                                        </Box>
                                    </Stack>
                                    <RatingStars rating={4.9} size="small" showNumber={false} />
                                </Stack>
                                <Typography sx={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{comment.commentContent}</Typography>
                            </Stack>
                        ))
                    )}
                </Stack>

                {/* Sticky bottom */}
                <Stack sx={{
                    position: 'fixed', bottom: 64, left: 0, right: 0,
                    background: '#fff', borderTop: '1px solid rgba(255,77,141,0.1)',
                    boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
                    px: 2, py: 1.25, zIndex: 100,
                    flexDirection: 'row', alignItems: 'center', gap: 2,
                }}>
                    <Box component="div">
                        <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#FF4D8D' }}>₩{service.servicePrice?.toLocaleString()}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#888' }}>Deposit: ₩10,000</Typography>
                    </Box>
                    <Button fullWidth className="book-now-btn" onClick={bookingHandler} disabled={bookingLoading}>
                        {bookingLoading ? '...' : `${t('Book Now')} ₩10,000 →`}
                    </Button>
                </Stack>
            </Stack>
        );
    }

    // ── DESKTOP ──────────────────────────────────────────────────────────────────
    return (
        <Stack className="service-detail-page">
            <Stack className="service-detail-inner">
                {/* Back */}
                <Stack direction="row" alignItems="center" gap={0.75} className="back-link" onClick={() => router.back()}>
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: 13 }}>{t('Back to services')}</Typography>
                </Stack>

                <Stack direction="row" gap={4} alignItems="flex-start">
                    {/* LEFT */}
                    <Stack className="service-detail-left">
                        {/* Before/After gallery */}
                        <Stack className="gallery-section">
                            <Stack direction="row" gap={1} sx={{ mb: 1.5 }}>
                                {['before', 'after'].map((tab) => (
                                    <Button key={tab} size="small"
                                        onClick={() => setActiveImg(tab as 'before' | 'after')}
                                        sx={{
                                            px: 2.5, py: 0.75, borderRadius: 3,
                                            background: activeImg === tab ? '#FF4D8D' : 'transparent',
                                            color: activeImg === tab ? '#fff' : '#888',
                                            border: activeImg === tab ? 'none' : '1.5px solid rgba(255,77,141,0.3)',
                                            fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                                        }}>
                                        {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
                                    </Button>
                                ))}
                            </Stack>
                            <Box component="div" className="main-img-wrap">
                                <img src={currentImg} alt={service.serviceTitle} className="main-img"
                                    style={{ width: '100%', height: 420, objectFit: 'cover', borderRadius: 16 }} />
                                <IconButton className={`like-btn ${liked ? 'liked' : ''}`} onClick={likeHandler}>
                                    {liked ? <FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </Box>
                            <Stack direction="row" gap={1} sx={{ mt: 1.5, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                                {service.serviceImages?.slice(0, 4).map((img, i) => (
                                    <Box key={i} component="div"
                                        onClick={() => setSlideImage(img)}
                                        className={`thumb ${slideImage === img ? 'active' : ''}`}
                                        style={{ backgroundImage: `url(${REACT_APP_API_URL}/${img})` }} />
                                ))}
                            </Stack>
                        </Stack>

                        {/* Service info */}
                        <Stack className="service-info-section">
                            <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 0.75 }}>
                                <Typography className="service-title">{service.serviceTitle}</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 1.5 }}>
                                <RatingStars rating={service.serviceRating || 4.9} count={commentTotal} size="medium" />
                                <Stack direction="row" alignItems="center" gap={1}>
                                    <RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
                                    <Typography sx={{ fontSize: 12, color: '#999' }}>{service.serviceViews}</Typography>
                                    <FavoriteBorderIcon sx={{ fontSize: 14, color: '#999' }} />
                                    <Typography sx={{ fontSize: 12, color: '#999' }}>{service.serviceLikes}</Typography>
                                </Stack>
                            </Stack>

                            <Stack gap={0.75}>
                                {service.salonData && (
                                    <Link href={`/salons/${service.salonId}`}>
                                        <Typography sx={{ fontSize: 14, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                                            🏪 {service.salonData.salonTitle}
                                        </Typography>
                                    </Link>
                                )}
                                {service.memberData && (
                                    <Link href={`/member?memberId=${service.memberData._id}`}>
                                        <Typography sx={{ fontSize: 14, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                                            👤 {t('By')}: {service.memberData.memberNick} →
                                        </Typography>
                                    </Link>
                                )}
                                <Stack direction="row" gap={1.5} sx={{ mt: 0.5 }}>
                                    <Chip label={`⏱️ ${service.serviceDuration} min`} size="small" sx={{ background: '#f5f5f5', fontSize: 12 }} />
                                    <Chip label={`₩${service.servicePrice?.toLocaleString()}`} size="small" sx={{ background: 'rgba(255,77,141,0.08)', color: '#FF4D8D', fontSize: 12, fontWeight: 700 }} />
                                    <Chip label={t(service.serviceType)} size="small" className="type-chip" />
                                </Stack>
                            </Stack>

                            {/* About */}
                            {service.serviceDesc && (
                                <Box component="div" className="about-section">
                                    <Typography className="section-title">{t('About this service')}</Typography>
                                    <Typography sx={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{service.serviceDesc}</Typography>
                                </Box>
                            )}
                        </Stack>

                        {/* Reviews */}
                        <Stack className="reviews-section">
                            <Typography className="section-title">{t('Customer Reviews')}</Typography>
                            <Stack direction="row" gap={4} className="rating-summary">
                                <Stack alignItems="center" justifyContent="center">
                                    <Typography className="big-rating">{(service.serviceRating || 4.9).toFixed(1)}</Typography>
                                    <RatingStars rating={service.serviceRating || 4.9} size="medium" showNumber={false} />
                                    <Typography sx={{ fontSize: 12, color: '#888', mt: 0.5 }}>({commentTotal} {t('reviews')})</Typography>
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

                            {comments.length === 0 ? (
                                <EmptyList emoji="💬" title={t('No reviews yet')} desc={t('Be the first to review!')} />
                            ) : (
                                <Stack gap={2} className="review-list">
                                    {comments.map((comment) => (
                                        <Stack key={comment._id} className="review-card">
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                <Stack direction="row" gap={1.5} alignItems="center">
                                                    <Avatar src={comment.memberData?.memberImage ? `${REACT_APP_API_URL}/${comment.memberData.memberImage}` : '/img/profile/defaultUser.svg'} sx={{ width: 40, height: 40 }} />
                                                    <Box component="div">
                                                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{comment.memberData?.memberNick}</Typography>
                                                        <Typography sx={{ fontSize: 12, color: '#bbb' }}>{moment(comment.createdAt).format('MMM DD, YYYY')}</Typography>
                                                    </Box>
                                                </Stack>
                                                <RatingStars rating={4.9} size="small" showNumber={false} />
                                            </Stack>
                                            <Typography sx={{ fontSize: 14, color: '#555', lineHeight: 1.6, mt: 1 }}>{comment.commentContent}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            )}

                            {commentTotal > commentInquiry.limit && (
                                <MuiPagination page={commentInquiry.page}
                                    count={Math.ceil(commentTotal / commentInquiry.limit)}
                                    onChange={(_, page) => setCommentInquiry((prev) => ({ ...prev, page }))}
                                    shape="circular"
                                    sx={{ mt: 2, '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }} />
                            )}

                            {canWriteReview && (
                                <Stack className="write-review-section">
                                    <Typography className="section-title">{t('Leave A Review')}</Typography>
                                    <textarea className="review-textarea"
                                        placeholder={t('Share your experience...')}
                                        value={insertCommentData.commentContent}
                                        onChange={(e) => setInsertCommentData((prev) => ({ ...prev, commentContent: e.target.value }))} />
                                    <Button className="submit-review-btn"
                                        disabled={!insertCommentData.commentContent || !user._id}
                                        onClick={createCommentHandler}>
                                        {t('Submit Review')}
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                    </Stack>

                    {/* RIGHT SIDEBAR */}
                    <Stack className="service-detail-right">
                        <SidebarContent />
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};

export default withLayoutBasic(ServiceDetail);