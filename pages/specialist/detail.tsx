import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
    Stack, Box, Typography, Button, IconButton, Chip,
    Select, MenuItem, CircularProgress, Avatar,
    TextField, Pagination as MuiPagination, Tab, Tabs,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import Link from 'next/link';
import moment from 'moment';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import RatingStars from '../../libs/components/common/Ratingstars';
import Emptylist from '../../libs/components/common/Emptylist';
import { GET_MEMBER, GET_SERVICES, GET_SALONS, GET_COMMENTS, GET_MY_BOOKINGS } from '../../apollo/user/query';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE, CREATE_BOOKING, CREATE_COMMENT } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Member } from '../../libs/types/member/member';
import { Service } from '../../libs/types/service/service';
import { Salon } from '../../libs/types/salon/salon';
import { Comment } from '../../libs/types/comment/comment';
import { Booking } from '../../libs/types/booking/booking';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { isSalonOpen } from '../../libs/utils';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getServerSideProps = async ({ locale }: any) => ({
    props: { ...(await serverSideTranslations(locale, ['common'])) },
});

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

const SPECIALTY_COLORS: Record<string, string> = {
    'Facial Expert': '#FF4D8D',
    'Nail Artist': '#9B59B6',
    'Hair Stylist': '#E67E22',
    'Massage Therapist': '#27AE60',
    'Skin Specialist': '#2980B9',
    'Botox Specialist': '#E74C3C',
    'Lash & Brow': '#F39C12',
};

const SpecialistDetail: NextPage = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const user = useReactiveVar(userVar);
    const memberId = router.query.id as string;

    const [specialist, setSpecialist] = useState<Member | null>(null);
    const [salon, setSalon] = useState<Salon | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentTotal, setCommentTotal] = useState(0);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [selectedService, setSelectedService] = useState('');
    const [selectedDate, setSelectedDate] = useState(moment().add(1, 'day').format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState('');
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [showAllSlots, setShowAllSlots] = useState(false);

    const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>({
        page: 1, limit: 5, sort: 'createdAt', direction: Direction.DESC,
        search: { commentRefId: '' },
    });
    const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
        commentGroup: CommentGroup.MEMBER,
        commentContent: '',
        commentRefId: '',
    });

    const ratingBreakdown = [
        { stars: 5, count: 265, pct: 83 },
        { stars: 4, count: 42, pct: 13 },
        { stars: 3, count: 10, pct: 3 },
        { stars: 2, count: 2, pct: 1 },
        { stars: 1, count: 1, pct: 0 },
    ];

    /** APOLLO **/
    const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);
    const [createBooking] = useMutation(CREATE_BOOKING);
    const [createComment] = useMutation(CREATE_COMMENT);

    const { refetch: memberRefetch } = useQuery(GET_MEMBER, {
        fetchPolicy: 'network-only',
        variables: { input: memberId },
        skip: !memberId,
        onCompleted: (data: T) => {
            if (data?.getMember) {
                setSpecialist(data.getMember);
                setCommentInquiry((prev) => ({ ...prev, search: { commentRefId: memberId } }));
                setInsertCommentData((prev) => ({ ...prev, commentRefId: memberId }));
            }
        },
    });

    useQuery(GET_SERVICES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 10, sort: 'createdAt', direction: Direction.DESC, search: {} } },
        skip: !memberId,
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

    /** LIFECYCLES **/
    useEffect(() => {
        if (commentInquiry.search.commentRefId) commentsRefetch({ input: commentInquiry });
    }, [commentInquiry]);

    useEffect(() => {
        if (selectedDate && memberId && salon) {
            const booked = myBookings
                .filter((b) => b.salonId === salon._id &&
                    moment(b.bookingDate).format('YYYY-MM-DD') === selectedDate &&
                    b.bookingStatus !== BookingStatus.CANCELLED)
                .map((b) => b.bookingTime);
            setBookedSlots(booked);
        }
    }, [selectedDate, memberId, myBookings, salon]);

    /** HANDLERS **/
    const likeHandler = useCallback(async () => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await likeTargetMember({ variables: { input: memberId } });
            await memberRefetch({ input: memberId });
            await sweetTopSmallSuccessAlert('success', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, memberId]);

    const followHandler = useCallback(async () => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            const isFollowing = specialist?.meFollowed?.[0]?.myFollowing;
            if (isFollowing) {
                await unsubscribe({ variables: { input: { followingId: memberId } } });
            } else {
                await subscribe({ variables: { input: { followingId: memberId } } });
            }
            await memberRefetch({ input: memberId });
            await sweetTopSmallSuccessAlert(isFollowing ? 'Unfollowed' : 'Following!', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, memberId, specialist]);

    const bookingHandler = useCallback(async () => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            if (!selectedService) throw new Error(t('Please select a service'));
            if (!selectedDate) throw new Error(t('Please select a date'));
            if (!selectedTime) throw new Error(t('Please select a time'));
            setBookingLoading(true);
            const paymentKey = `test_pay_${Date.now()}`;
            await createBooking({
                variables: { input: { serviceId: selectedService, salonId: salon?._id, bookingDate: new Date(selectedDate), bookingTime: selectedTime, paymentKey } },
            });
            await sweetTopSmallSuccessAlert(t('Booking confirmed!'), 1500);
            router.push('/mypage?category=myBookings');
        } catch (err: any) {
            await sweetErrorHandling(err);
        } finally {
            setBookingLoading(false);
        }
    }, [user, selectedService, selectedDate, selectedTime, salon]);

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

    if (!specialist) return (
        <Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <CircularProgress sx={{ color: '#FF4D8D' }} size={48} />
        </Stack>
    );

    const profileImg = specialist.memberImage ? `${REACT_APP_API_URL}/${specialist.memberImage}` : '/img/profile/defaultUser.svg';
    const coverImg = specialist.memberPortfolio?.[0] ? `${REACT_APP_API_URL}/${specialist.memberPortfolio[0]}` : profileImg;
    const liked = specialist.meLiked?.[0]?.myFavorite;
    const isFollowing = specialist.meFollowed?.[0]?.myFollowing;
    const timeSlots = salon ? generateTimeSlots(salon.salonWorkHours) : ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'];
    const displaySlots = showAllSlots ? timeSlots : timeSlots.slice(0, 6);

    // ── RIGHT SIDEBAR ────────────────────────────────────────────────────────
    const SidebarContent = () => (
        <>
            {/* Booking card */}
            <Stack className="sp-booking-card">
                {/* Specialist mini info */}
                <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(255,77,141,0.08)' }}>
                    <Avatar src={profileImg} sx={{ width: 44, height: 44, border: '2px solid #FF85B3' }} />
                    <Box component="div">
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{specialist.memberNick}</Typography>
                            <VerifiedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                        </Stack>
                        {specialist.memberSpecialty && specialist.memberSpecialty.length > 0 && (
                            <Typography sx={{ fontSize: 11, color: '#888' }}>
                                {specialist.memberSpecialty.slice(0, 2).join(' · ')}
                                {specialist.memberExperience ? ` · ${specialist.memberExperience} yrs` : ''}
                            </Typography>
                        )}
                    </Box>
                </Stack>

                <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 2 }}>
                    {t('Book with')} {specialist.memberNick}
                </Typography>

                {/* Service select */}
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333', mb: 0.75 }}>{t('Select Service')}</Typography>
                <Select fullWidth size="small" value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)} displayEmpty
                    sx={{ mb: 2, borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}>
                    <MenuItem value="" disabled>{t('Choose a service')}</MenuItem>
                    {services.map((svc) => (
                        <MenuItem key={svc._id} value={svc._id}>{svc.serviceTitle} — ₩{svc.servicePrice?.toLocaleString()}</MenuItem>
                    ))}
                </Select>

                {/* Date */}
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333', mb: 0.75 }}>{t('Select Date')}</Typography>
                <TextField fullWidth size="small" type="date" value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    inputProps={{ min: moment().add(1, 'day').format('YYYY-MM-DD') }}
                    sx={{ mb: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }} />

                {/* Time slots */}
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333', mb: 1 }}>{t('Select Time')}</Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                    {displaySlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        return (
                            <Box key={slot} component="div"
                                onClick={() => !isBooked && setSelectedTime(slot)}
                                className={`sp-time-slot ${selectedTime === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}>
                                {slot}
                            </Box>
                        );
                    })}
                </Stack>
                {timeSlots.length > 6 && (
                    <Button size="small" onClick={() => setShowAllSlots(!showAllSlots)}
                        sx={{ color: '#888', fontSize: 11, mb: 1.5 }}>
                        {showAllSlots ? t('Show less') : `${t('More times')} ▾`}
                    </Button>
                )}

                <Button fullWidth className="sp-book-now-btn" onClick={bookingHandler} disabled={bookingLoading}>
                    {bookingLoading ? '...' : `${t('Book Now')} — ₩10,000`}
                </Button>
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1.5, justifyContent: 'center' }}>
                    <ShieldOutlinedIcon sx={{ fontSize: 11, color: '#888' }} />
                    <Typography sx={{ fontSize: 10, color: '#888' }}>{t('Pay ₩10,000 deposit • Rest paid at salon')}</Typography>
                </Stack>
            </Stack>

            {/* Salon card */}
            {salon && (
                <Stack className="sp-salon-card">
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', mb: 1.5 }}>{t('About the Salon')}</Typography>
                    <Box component="div" className="sp-salon-img"
                        style={{ backgroundImage: `url(${salon.salonImages?.[0] ? `${REACT_APP_API_URL}/${salon.salonImages[0]}` : '/img/banner/default.jpg'})` }} />
                    <Box component="div" sx={{ mt: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{salon.salonTitle}</Typography>
                            <RatingStars rating={4.9} size="small" showNumber />
                        </Stack>
                        <Typography sx={{ fontSize: 11, color: '#666', mb: 0.25 }}>
                            <LocationOnOutlinedIcon sx={{ fontSize: 12, color: '#FF4D8D' }} /> {salon.salonAddress}
                        </Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 600, mb: 1.5, color: isSalonOpen(salon.salonWorkHours) ? '#4CAF50' : '#e53935' }}>
                            <AccessTimeIcon sx={{ fontSize: 11 }} /> {t('Open')}: {salon.salonWorkHours}
                        </Typography>
                        <Stack direction="row" gap={1}>
                            <Link href={`/salons/${salon._id}`}>
                                <Button fullWidth size="small" className="sp-view-salon-btn">{t('View Salon →')}</Button>
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
            <Stack className="specialist-detail-page mobile">
                {/* Cover */}
                <Box component="div" className="sp-detail-cover-mobile"
                    style={{ backgroundImage: `url(${coverImg})` }}>
                    <IconButton className="sp-back-btn-mobile" onClick={() => router.back()}>
                        <ArrowBackIcon sx={{ fontSize: 18, color: '#fff' }} />
                    </IconButton>
                    <IconButton className="sp-like-btn-cover" onClick={likeHandler}>
                        {liked ? <FavoriteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 16, color: '#fff' }} />}
                    </IconButton>
                </Box>

                {/* Avatar overlap */}
                <Stack alignItems="center" sx={{ mt: '-40px', mb: 1 }}>
                    <Box component="div" sx={{ position: 'relative' }}>
                        <Avatar src={profileImg} sx={{ width: 80, height: 80, border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} />
                        <Box component="div" className="sp-online-dot-lg" />
                        <Box component="div" sx={{ position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: '#FF4D8D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <VerifiedIcon sx={{ fontSize: 12, color: '#fff' }} />
                        </Box>
                    </Box>
                </Stack>

                {/* Name + rating */}
                <Stack alignItems="center" sx={{ px: 2, mb: 1.5 }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>{specialist.memberNick}</Typography>
                    <RatingStars rating={4.9} count={commentTotal} size="small" />
                    {specialist.memberSpecialty && specialist.memberSpecialty.length > 0 && (
                        <Stack direction="row" gap={0.75} flexWrap="wrap" justifyContent="center" sx={{ mt: 0.75 }}>
                            {specialist.memberSpecialty.map((sp) => (
                                <Box key={sp} component="div" className="sp-specialty-chip"
                                    style={{ color: SPECIALTY_COLORS[sp] ?? '#FF4D8D', background: `${SPECIALTY_COLORS[sp] ?? '#FF4D8D'}15`, borderColor: `${SPECIALTY_COLORS[sp] ?? '#FF4D8D'}30` }}>
                                    {sp}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Stack>

                {/* Action buttons */}
                <Stack direction="row" gap={1} sx={{ px: 2, mb: 1.5 }}>
                    <Button fullWidth className={`sp-follow-btn ${isFollowing ? 'following' : ''}`}
                        startIcon={isFollowing ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
                        onClick={followHandler}>
                        {isFollowing ? t('Following') : t('Follow')}
                    </Button>
                    <Button fullWidth className={`sp-like-action-btn ${liked ? 'liked' : ''}`}
                        startIcon={liked ? <FavoriteIcon sx={{ color: '#FF4D8D' }} /> : <FavoriteBorderIcon />}
                        onClick={likeHandler}>
                        {liked ? t('Liked') : t('Like')}
                    </Button>
                    <IconButton className="sp-share-btn"><ShareOutlinedIcon sx={{ fontSize: 18 }} /></IconButton>
                </Stack>

                {/* Stats */}
                <Stack direction="row" justifyContent="center" gap={3} sx={{ mb: 2 }}>
                    <Stack alignItems="center">
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{specialist.memberFollowers ?? 0}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Followers')}</Typography>
                    </Stack>
                    <Stack alignItems="center">
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{commentTotal}</Typography>
                        <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Reviews')}</Typography>
                    </Stack>
                    <Stack alignItems="center">
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>
                            {specialist.memberViews >= 1000 ? `${(specialist.memberViews / 1000).toFixed(1)}K` : specialist.memberViews}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Views')}</Typography>
                    </Stack>
                </Stack>

                {/* Mobile Tabs */}
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} centered
                    sx={{ borderBottom: '1px solid rgba(255,77,141,0.1)', mb: 0, '& .MuiTab-root': { fontSize: 12, fontWeight: 600, color: '#888', minWidth: 80 }, '& .Mui-selected': { color: '#FF4D8D' }, '& .MuiTabs-indicator': { background: '#FF4D8D' } }}>
                    <Tab label={t('Portfolio')} />
                    <Tab label={t('Services')} />
                    <Tab label={t('Reviews')} />
                </Tabs>

                {/* Portfolio tab */}
                {activeTab === 0 && (
                    <Box component="div" sx={{ p: 2 }}>
                        <Box component="div" className="sp-portfolio-grid-mobile">
                            {specialist.memberPortfolio?.map((img, i) => (
                                <Box key={i} component="div" className="sp-portfolio-item-mobile"
                                    style={{ backgroundImage: `url(${REACT_APP_API_URL}/${img})` }} />
                            )) ?? <Typography sx={{ fontSize: 13, color: '#888', textAlign: 'center', py: 4 }}>{t('No portfolio yet')}</Typography>}
                        </Box>
                    </Box>
                )}

                {/* Services tab */}
                {activeTab === 1 && (
                    <Stack gap={1.5} sx={{ p: 2 }}>
                        {services.length === 0 ? (
                            <Typography sx={{ fontSize: 13, color: '#888', textAlign: 'center', py: 4 }}>{t('No services yet')}</Typography>
                        ) : services.map((svc) => (
                            <Stack key={svc._id} direction="row" gap={1.5} sx={{ background: '#fff', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,77,141,0.08)', p: 1.25 }}>
                                <Box component="div" sx={{ width: 70, height: 60, borderRadius: 1.5, backgroundImage: `url(${REACT_APP_API_URL}/${svc.serviceImages?.[0]})`, backgroundSize: 'cover', flexShrink: 0, backgroundColor: '#f5f5f5' }} />
                                <Box component="div" sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{svc.serviceTitle}</Typography>
                                    <Typography sx={{ fontSize: 12, color: '#FF4D8D', fontWeight: 600 }}>₩{svc.servicePrice?.toLocaleString()}</Typography>
                                    <Typography sx={{ fontSize: 11, color: '#888' }}>{svc.serviceDuration} min</Typography>
                                </Box>
                                <Button size="small" className="sp-book-btn-sm" onClick={() => setSelectedService(svc._id)}>{t('Book')}</Button>
                            </Stack>
                        ))}
                    </Stack>
                )}

                {/* Reviews tab */}
                {activeTab === 2 && (
                    <Stack sx={{ p: 2 }}>
                        {comments.length === 0 ? (
                            <Emptylist emoji="💬" title={t('No reviews yet')} />
                        ) : comments.map((comment) => (
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
                        ))}
                    </Stack>
                )}

                {/* Sticky bottom */}
                <Stack sx={{ position: 'fixed', bottom: 64, left: 0, right: 0, background: '#fff', borderTop: '1px solid rgba(255,77,141,0.1)', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)', px: 2, py: 1.25, zIndex: 100 }}>
                    <Button fullWidth className="sp-book-now-btn" onClick={() => setActiveTab(1)}>
                        {t('Book Now')} — ₩10,000 →
                    </Button>
                </Stack>
            </Stack>
        );
    }

    // ── DESKTOP ──────────────────────────────────────────────────────────────────
    return (
        <Stack className="specialist-detail-page">
            {/* Back */}
            <Stack direction="row" alignItems="center" gap={0.75} className="sp-back-link" onClick={() => router.back()}>
                <ArrowBackIcon sx={{ fontSize: 15 }} />
                <Typography sx={{ fontSize: 13 }}>{t('Back to specialists')}</Typography>
            </Stack>

            {/* Cover photo */}
            <Box component="div" className="sp-detail-cover"
                style={{ backgroundImage: `url(${coverImg})` }}>
                <Box component="div" className="sp-cover-overlay" />
                {/* Overlay text */}
                <Stack className="sp-cover-info">
                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
                        {specialist.memberNick}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>★ 4.9</Typography>
                        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>({commentTotal} {t('reviews')})</Typography>
                    </Stack>
                    {specialist.memberSpecialty && specialist.memberSpecialty.length > 0 && (
                        <Stack direction="row" gap={0.75} flexWrap="wrap">
                            {specialist.memberSpecialty.map((sp) => (
                                <Box key={sp} component="div" className="sp-cover-chip"
                                    style={{ background: `${SPECIALTY_COLORS[sp] ?? '#FF4D8D'}CC` }}>
                                    {sp}
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Stack>
                {/* Like button */}
                <IconButton className={`sp-cover-like ${liked ? 'liked' : ''}`} onClick={likeHandler}>
                    {liked ? <FavoriteIcon sx={{ fontSize: 20, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 20, color: '#fff' }} />}
                </IconButton>
            </Box>

            {/* Profile overlap card */}
            <Stack className="sp-profile-card">
                {/* Avatar */}
                <Box component="div" sx={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar src={profileImg} className="sp-profile-avatar" />
                    <Box component="div" className="sp-online-dot-lg" />
                    <Box component="div" sx={{ position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: '#FF4D8D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <VerifiedIcon sx={{ fontSize: 14, color: '#fff' }} />
                    </Box>
                </Box>

                {/* Info */}
                <Box component="div" sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>{specialist.memberNick}</Typography>
                        {specialist.memberExperience && (
                            <Typography sx={{ fontSize: 13, color: '#888' }}>· 💼 {specialist.memberExperience} {t('years')}</Typography>
                        )}
                    </Stack>
                    {specialist.memberAddress && (
                        <Typography sx={{ fontSize: 13, color: '#666', mb: 1 }}>
                            <LocationOnOutlinedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} /> {specialist.memberAddress}
                        </Typography>
                    )}
                    {/* Stats */}
                    <Stack direction="row" gap={3} sx={{ mb: 1.5 }}>
                        <Stack alignItems="center">
                            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{specialist.memberFollowers ?? 0}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Followers')}</Typography>
                        </Stack>
                        <Stack alignItems="center">
                            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{specialist.memberFollowings ?? 0}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Following')}</Typography>
                        </Stack>
                        <Stack alignItems="center">
                            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{commentTotal}</Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Reviews')}</Typography>
                        </Stack>
                        <Stack alignItems="center">
                            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
                                {specialist.memberViews >= 1000 ? `${(specialist.memberViews / 1000).toFixed(1)}K` : specialist.memberViews}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Views')}</Typography>
                        </Stack>
                    </Stack>
                    {/* Action buttons */}
                    <Stack direction="row" gap={1}>
                        <Button className={`sp-follow-btn ${isFollowing ? 'following' : ''}`}
                            startIcon={isFollowing ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
                            onClick={followHandler}>
                            {isFollowing ? t('Following') : t('Follow')}
                        </Button>
                        <Button className={`sp-like-action-btn ${liked ? 'liked' : ''}`}
                            startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            onClick={likeHandler}>
                            {liked ? t('Liked') : t('Like')}
                        </Button>
                        <IconButton className="sp-share-btn"><ShareOutlinedIcon sx={{ fontSize: 18 }} /></IconButton>
                    </Stack>
                </Box>
            </Stack>

            {/* Main content */}
            <Stack direction="row" gap={3} className="sp-detail-main" alignItems="flex-start">
                {/* LEFT */}
                <Stack className="sp-detail-left">
                    {/* About */}
                    {specialist.memberDesc && (
                        <Stack className="sp-detail-section">
                            <Typography className="sp-section-title">{t('About')}</Typography>
                            <Typography sx={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{specialist.memberDesc}</Typography>
                            {specialist.memberAddress && (
                                <Typography sx={{ fontSize: 13, color: '#555', mt: 1 }}>
                                    <LocationOnOutlinedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} /> {specialist.memberAddress}
                                </Typography>
                            )}
                        </Stack>
                    )}

                    {/* Portfolio masonry */}
                    {specialist.memberPortfolio && specialist.memberPortfolio.length > 0 && (
                        <Stack className="sp-detail-section">
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                <Typography className="sp-section-title">{t('Portfolio')}</Typography>
                                <Typography sx={{ fontSize: 12, color: '#FF4D8D', cursor: 'pointer' }}>{t('View all')}</Typography>
                            </Stack>
                            <Box component="div" className="sp-portfolio-masonry">
                                {specialist.memberPortfolio.map((img, i) => {
                                    const heights = [160, 200, 180, 220, 170, 190];
                                    return (
                                        <Box key={i} component="div" className="sp-portfolio-item"
                                            style={{ height: heights[i % heights.length], backgroundImage: `url(${REACT_APP_API_URL}/${img})` }}>
                                            <Box component="div" className="sp-portfolio-overlay">
                                                <Button size="small" className="sp-book-look-btn">
                                                    {t('Book this look')}
                                                </Button>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Stack>
                    )}

                    {/* Services */}
                    {services.length > 0 && (
                        <Stack className="sp-detail-section">
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                <Typography className="sp-section-title">{t('Services offered')}</Typography>
                                <Typography sx={{ fontSize: 12, color: '#FF4D8D', cursor: 'pointer' }}>{t('View all')}</Typography>
                            </Stack>
                            <Stack direction="row" gap={1.5} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                                {services.map((svc) => (
                                    <Stack key={svc._id} className="sp-service-card">
                                        <Box component="div" className="sp-service-img"
                                            style={{ backgroundImage: `url(${REACT_APP_API_URL}/${svc.serviceImages?.[0] ?? ''})` }} />
                                        <Box component="div" sx={{ p: 1.25 }}>
                                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', mb: 0.25 }}>{svc.serviceTitle}</Typography>
                                            <Typography sx={{ fontSize: 12, color: '#FF4D8D', fontWeight: 600 }}>₩{svc.servicePrice?.toLocaleString()}</Typography>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                                                <Typography sx={{ fontSize: 11, color: '#888' }}>{svc.serviceDuration} min</Typography>
                                                <RatingStars rating={svc.serviceRating || 4.9} size="small" showNumber={false} />
                                            </Stack>
                                            <Button fullWidth size="small" className="sp-book-btn-sm" sx={{ mt: 1 }}
                                                onClick={() => setSelectedService(svc._id)}>
                                                {t('Book')}
                                            </Button>
                                        </Box>
                                    </Stack>
                                ))}
                            </Stack>
                        </Stack>
                    )}

                    {/* Reviews */}
                    <Stack className="sp-detail-section">
                        <Typography className="sp-section-title">{t('Customer Reviews')}</Typography>
                        <Stack direction="row" gap={4} sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(255,77,141,0.08)' }}>
                            <Stack alignItems="center" justifyContent="center">
                                <Typography sx={{ fontSize: 44, fontWeight: 900, color: '#1a1a1a', lineHeight: 1, mb: 0.5 }}>4.9</Typography>
                                <RatingStars rating={4.9} size="medium" showNumber={false} />
                                <Typography sx={{ fontSize: 12, color: '#888', mt: 0.5 }}>({commentTotal} {t('reviews')})</Typography>
                            </Stack>
                            <Stack flex={1} gap={0.75} justifyContent="center">
                                {ratingBreakdown.map((r) => (
                                    <Stack key={r.stars} direction="row" alignItems="center" gap={1}>
                                        <Typography sx={{ fontSize: 12, color: '#555', width: 8 }}>{r.stars}</Typography>
                                        <StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
                                        <Box component="div" sx={{ flex: 1, height: 5, borderRadius: 2.5, background: '#f0f0f0', overflow: 'hidden' }}>
                                            <Box component="div" sx={{ width: `${r.pct}%`, height: '100%', borderRadius: 2.5, background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)' }} />
                                        </Box>
                                        <Typography sx={{ fontSize: 11, color: '#888', width: 24 }}>{r.count}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Stack>

                        {comments.length === 0 ? (
                            <Emptylist emoji="💬" title={t('No reviews yet')} desc={t('Be the first to review!')} />
                        ) : (
                            <Stack gap={2}>
                                {comments.map((comment) => (
                                    <Stack key={comment._id} className="sp-review-card">
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Stack direction="row" gap={1.5} alignItems="center">
                                                <Avatar src={comment.memberData?.memberImage ? `${REACT_APP_API_URL}/${comment.memberData.memberImage}` : '/img/profile/defaultUser.svg'} sx={{ width: 40, height: 40 }} />
                                                <Box component="div">
                                                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{comment.memberData?.memberNick}</Typography>
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

                        {/* Write review */}
                        <Stack sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,77,141,0.08)' }}>
                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', mb: 1.5 }}>{t('Leave A Review')}</Typography>
                            <textarea className="sp-review-textarea"
                                placeholder={t('Share your experience...')}
                                value={insertCommentData.commentContent}
                                onChange={(e) => setInsertCommentData((prev) => ({ ...prev, commentContent: e.target.value }))} />
                            <Button className="sp-submit-review-btn"
                                disabled={!insertCommentData.commentContent || !user._id}
                                onClick={createCommentHandler}>
                                {t('Submit Review')}
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>

                {/* RIGHT */}
                <Stack className="sp-detail-right">
                    <SidebarContent />
                </Stack>
            </Stack>
        </Stack>
    );
};

export default withLayoutBasic(SpecialistDetail);