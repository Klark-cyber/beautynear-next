import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import MobileServiceDetail from '../../libs/components/service/MobileServiceDetail';
import {
    Stack,
    Box,
    Typography,
    Button,
    IconButton,
    Chip,
    Avatar,
    TextField,
    Pagination as MuiPagination,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckIcon from '@mui/icons-material/Check';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import moment from 'moment';
import Link from 'next/link';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import RatingStars from '../../libs/components/common/Ratingstars';
import EmptyList from '../../libs/components/common/Emptylist';
import { GET_SERVICE, GET_SALON, GET_COMMENTS, GET_MY_BOOKINGS } from '../../apollo/user/query';
import {
    LIKE_TARGET_SERVICE,
    CREATE_COMMENT,
    CREATE_BOOKING,
    SUBSCRIBE,
    UNSUBSCRIBE,
} from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { FollowGroup } from '../../libs/enums/follow.enum';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatRating = (n?: number): string => {
    if (n === undefined || n === null) return '4.9';
    return n.toFixed(1);
};

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

// Salon ish vaqtidan time slotlar (salon detail bilan bir xil)
const generateTimeSlots = (workHours?: string): string[] => {
    const fallback = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    if (!workHours) return fallback;
    const match = workHours.match(/(\d{1,2}):?(\d{2})?\s*[-~]\s*(\d{1,2}):?(\d{2})?/);
    if (!match) return fallback;
    const start = parseInt(match[1], 10);
    const end = parseInt(match[3], 10);
    if (isNaN(start) || isNaN(end) || start >= end) return fallback;
    const slots: string[] = [];
    for (let h = start; h < end; h++) slots.push(`${String(h).padStart(2, '0')}:00`);
    return slots;
};

/* What's included — serviceType bo'yicha (backend'da bu maydon yo'q) */
const INCLUDED_BY_TYPE: Record<string, string[]> = {
    SKIN: ['Deep Cleansing', 'Exfoliation', 'Hydrating Mask', 'LED Therapy', 'Moisturizer & Sunscreen'],
    HAIR: ['Consultation', 'Wash & Treatment', 'Cut / Styling', 'Finishing & Aftercare Tips'],
    NAIL: ['Nail Prep', 'Cuticle Care', 'Polish / Design', 'Top Coat & Care Tips'],
    CLINIC: ['Doctor Consultation', 'Professional Treatment', 'Aftercare Kit', 'Follow-up Check'],
    MASSAGE: ['Consultation', 'Full Body Treatment', 'Aromatherapy', 'Relaxation Time'],
};

const specialtyByType: Record<string, string[]> = {
    HAIR: ['Hair Stylist', 'Color Expert'],
    NAIL: ['Nail Artist', 'Nail Expert'],
    SKIN: ['Skin Expert', 'Facial Specialist'],
    CLINIC: ['Skin Clinic', 'Dermatology'],
    MASSAGE: ['Massage Therapist', 'Spa Expert'],
};

/* ─── Page ────────────────────────────────────────────────────────────── */

const ServiceDetail: NextPage = () => {
    const router = useRouter();
    const { t } = useTranslation('common');
    const user = useReactiveVar(userVar);
    const serviceId = router.query.id as string;
    const device = useDeviceDetect();

    const [service, setService] = useState<any>(null);
    const [salon, setSalon] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentTotal, setCommentTotal] = useState<number>(0);
    const [commentInquiry, setCommentInquiry] = useState<any>({ page: 1, limit: 4 });
    const [insertCommentData, setInsertCommentData] = useState<any>({ commentContent: '' });
    const [showWriteReview, setShowWriteReview] = useState<boolean>(false);
    const [canWriteReview, setCanWriteReview] = useState<boolean>(false);

    // Rasm: Before/After toggle
    const [imgMode, setImgMode] = useState<'before' | 'after'>('before');
    const [slideIdx, setSlideIdx] = useState<number>(0);

    // Booking
    const [selectedDate, setSelectedDate] = useState<string>(moment().add(1, 'day').format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [showAllSlots, setShowAllSlots] = useState<boolean>(false);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [bookingLoading, setBookingLoading] = useState<boolean>(false);
    const [isFollowingMember, setIsFollowingMember] = useState<boolean>(false);

    /** APOLLO **/
    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);
    const [createComment] = useMutation(CREATE_COMMENT);
    const [createBooking] = useMutation(CREATE_BOOKING);
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);

    const { refetch: serviceRefetch } = useQuery(GET_SERVICE, {
        fetchPolicy: 'cache-and-network',
        variables: { input: serviceId },
        skip: !serviceId,
        onCompleted: (data: T) => setService(data?.getService ?? null),
    });

    useQuery(GET_SALON, {
        fetchPolicy: 'cache-and-network',
        variables: { input: service?.salonId },
        skip: !service?.salonId,
        onCompleted: (data: T) => setSalon(data?.getSalon ?? null),
    });

    const { refetch: commentsRefetch } = useQuery(GET_COMMENTS, {
        fetchPolicy: 'cache-and-network',
        variables: {
            input: {
                page: commentInquiry.page,
                limit: commentInquiry.limit,
                sort: 'createdAt',
                direction: Direction.DESC,
                search: { commentRefId: serviceId },
            },
        },
        skip: !serviceId,
        onCompleted: (data: T) => {
            setComments(data?.getComments?.list ?? []);
            setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
        },
    });

    useQuery(GET_MY_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: {
            input: { page: 1, limit: 50, search: { salonId: service?.salonId } },
        },
        skip: !service?.salonId || !user._id,
        onCompleted: (data: T) => {
            const list = data?.getMyBookings?.list ?? [];
            const slots = list
                .filter(
                    (b: any) =>
                        moment(b.bookingDate).format('YYYY-MM-DD') === selectedDate &&
                        b.bookingStatus !== BookingStatus.CANCELLED,
                )
                .map((b: any) => b.bookingTime);
            setBookedSlots(slots);

            // ⚠️ YANGI — avval "Write a Review" tugmasi HAR DOIM ko'rinardi,
            // faqat SUBMIT bosilgach "Not Allowed Request!" xatosi chiqardi.
            // Endi COMPLETED bron bor-yo'qligi OLDINDAN tekshiriladi.
            const hasCompleted = list.some(
                (b: any) => b.serviceId === serviceId && b.bookingStatus === BookingStatus.COMPLETED,
            );
            setCanWriteReview(hasCompleted);
        },
    });

    /** MEMO **/
    const timeSlots = useMemo(() => generateTimeSlots(salon?.salonWorkHours), [salon?.salonWorkHours]);
    const visibleSlots = showAllSlots ? timeSlots : timeSlots.slice(0, 6);

    const liked = service?.meLiked?.[0]?.myFavorite;
    const images: string[] = service?.serviceImages ?? [];
    const beforeImg = imgUrl(images[slideIdx] ?? images[0]);
    const afterImg = imgUrl(images[slideIdx + 1] ?? images[1] ?? images[0]);
    const mainImg = imgMode === 'before' ? beforeImg : afterImg;

    const included = INCLUDED_BY_TYPE[service?.serviceType] ?? INCLUDED_BY_TYPE.SKIN;
    const specialtyFallback = specialtyByType[service?.serviceType] ?? ['Beauty Expert'];

    // Rating breakdown — mock (salon detail kabi)
    const ratingBreakdown = [
        { stars: 5, count: 108, pct: 84 },
        { stars: 4, count: 16, pct: 13 },
        { stars: 3, count: 3, pct: 2 },
        { stars: 2, count: 1, pct: 1 },
        { stars: 1, count: 0, pct: 0 },
    ];

    /** HANDLERS **/
    const likeHandler = useCallback(async () => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await likeTargetService({ variables: { input: serviceId } });
            // ⚠️ TUZATILDI: avval refetch natijasi hech qayerga
            // saqlanmasdi, shuning uchun `service` holati (va demak
            // yurakcha) yangilanmasdi
            const result = await serviceRefetch({ input: serviceId });
            if (result?.data?.getService) setService(result.data.getService);
            await sweetTopSmallSuccessAlert('success', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, serviceId]);

    const followHandler = useCallback(async () => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            const memberId = service?.memberData?._id ?? salon?.memberData?._id;
            if (!memberId) return;
            if (isFollowingMember) {
                await unsubscribe({ variables: { input: { followingId: memberId } } });
                setIsFollowingMember(false);
            } else {
                await subscribe({ variables: { input: { followingId: memberId } } });
                setIsFollowingMember(true);
            }
            await sweetTopSmallSuccessAlert('success', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, service, salon, isFollowingMember]);

    const bookingHandler = useCallback(async () => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            if (!selectedTime) throw new Error('Please select a time');
            setBookingLoading(true);

            // TossPayments mock deposit (salon detail bilan bir xil)
            const paymentKey = `toss_mock_${Date.now()}`;

            await createBooking({
                variables: {
                    input: {
                        serviceId,
                        salonId: service?.salonId,
                        bookingDate: selectedDate,
                        bookingTime: selectedTime,
                        paymentKey,
                    },
                },
            });
            await sweetTopSmallSuccessAlert('Booking confirmed! 🎉', 1500);
            setSelectedTime('');
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        } finally {
            setBookingLoading(false);
        }
    }, [user, serviceId, service, selectedDate, selectedTime]);

    const createCommentHandler = useCallback(async () => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await createComment({
                variables: {
                    input: {
                        commentGroup: CommentGroup.SERVICE,
                        commentContent: insertCommentData.commentContent,
                        commentRefId: serviceId,
                    },
                },
            });
            setInsertCommentData({ commentContent: '' });
            setShowWriteReview(false);
            // ⚠️ TUZATILDI: xuddi shu sabab — refetch natijasi saqlanmasdi
            const commentResult = await commentsRefetch();
            if (commentResult?.data?.getComments) {
                setComments(commentResult.data.getComments.list ?? []);
            }
            await sweetTopSmallSuccessAlert('Review submitted!', 1200);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, serviceId, insertCommentData]);

    const commentPageHandler = useCallback((_e: any, page: number) => {
        setCommentInquiry((prev: any) => ({ ...prev, page }));
    }, []);

    // ⚠️ TUZATILDI: mobil return BARCHA hook'lardan keyin bo'lishi shart
    if (device === 'mobile') {
        return <MobileServiceDetail serviceId={serviceId} />;
    }

    if (!service) {
        return (
            <Stack className="service-detail-page">
                <Stack className="service-detail-inner">
                    <Typography sx={{ textAlign: 'center', py: 10, color: '#888' }}>{t('Loading...')}</Typography>
                </Stack>
            </Stack>
        );
    }

    const specialist = service.memberData ?? salon?.memberData;

    /* ─── RENDER ──────────────────────────────────────────────────────── */
    return (
        <Stack className="service-detail-page">
            <Stack className="service-detail-inner">
                {/* Back */}
                <Stack
                    direction="row"
                    alignItems="center"
                    gap={0.75}
                    className="back-link"
                    onClick={() => router.push('/service')}
                >
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: 13 }}>{t('Back to services')}</Typography>
                </Stack>

                {/* ═══ 2 BLOK: CHAP(kontent) + O'NG(booking sticky) ═══ */}
                <Stack direction="row" gap={4} alignItems="flex-start" className="detail-columns">
                    {/* ══════════ CHAP BLOK ══════════ */}
                    <Stack className="service-detail-left">
                        {/* Katta rasm + Before/After toggle */}
                        <Box component="div" className="main-img-wrap">
                            <img src={mainImg} alt={service.serviceTitle} className="main-img" />
                            <Stack direction="row" className="ba-toggle">
                                <Box
                                    component="div"
                                    className={`ba-btn ${imgMode === 'before' ? 'active' : ''}`}
                                    onClick={() => setImgMode('before')}
                                >
                                    {t('Before')}
                                </Box>
                                <Box
                                    component="div"
                                    className={`ba-btn ${imgMode === 'after' ? 'active' : ''}`}
                                    onClick={() => setImgMode('after')}
                                >
                                    {t('After')}
                                </Box>
                            </Stack>
                            <IconButton className={`like-btn ${liked ? 'liked' : ''}`} onClick={likeHandler}>
                                {liked ? (
                                    <FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                                ) : (
                                    <FavoriteBorderIcon sx={{ fontSize: 18 }} />
                                )}
                            </IconButton>
                        </Box>

                        {/* Thumbnaillar */}
                        {images.length > 1 && (
                            <Stack direction="row" gap={1} className="thumbnails">
                                {images.slice(0, 4).map((img, i) => (
                                    <Box
                                        key={i}
                                        component="div"
                                        onClick={() => setSlideIdx(i)}
                                        className={`thumb ${slideIdx === i ? 'active' : ''}`}
                                        style={{ backgroundImage: `url(${imgUrl(img)})` }}
                                    />
                                ))}
                            </Stack>
                        )}

                        {/* Nom + info */}
                        <Typography className="svc-title">{service.serviceTitle}</Typography>

                        <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1 }}>
                            <RatingStars rating={Number(formatRating(service.serviceRating))} count={commentTotal || 128} size="medium" />
                        </Stack>

                        <Stack gap={1} className="info-rows">
                            {salon?.salonTitle && (
                                <Stack direction="row" alignItems="center" gap={0.75}>
                                    <StorefrontOutlinedIcon sx={{ fontSize: 17, color: '#FF4D8D' }} />
                                    <Link href={`/salons/${service.salonId}`}>
                                        <Typography className="salon-link">{salon.salonTitle}</Typography>
                                    </Link>
                                </Stack>
                            )}
                            {specialist?.memberNick && (
                                <Stack direction="row" alignItems="center" gap={0.75}>
                                    <PersonOutlineIcon sx={{ fontSize: 17, color: '#888' }} />
                                    <Typography sx={{ fontSize: 15.5, color: '#555' }}>{t('By')}:&nbsp;</Typography>
                                    <Link href={`/member?memberId=${specialist._id}`}>
                                        <Typography sx={{ fontSize: 15.5, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer' }}>
                                            {specialist.memberNick} ›
                                        </Typography>
                                    </Link>
                                </Stack>
                            )}
                            <Stack direction="row" alignItems="center" gap={0.75}>
                                <AccessTimeIcon sx={{ fontSize: 17, color: '#888' }} />
                                <Typography sx={{ fontSize: 15.5, color: '#555' }}>
                                    {service.serviceDuration} {t('min')}
                                </Typography>
                            </Stack>
                        </Stack>

                        <Typography className="svc-price">₩{formatPrice(service.servicePrice)}</Typography>

                        <Box component="div" sx={{ mt: 1 }}>
                            <Chip label={t(service.serviceType)} size="small" className="type-chip" />
                        </Box>

                        {/* About */}
                        {service.serviceDesc && (
                            <Box component="div" className="about-section">
                                <Typography className="section-sub-title">{t('About this service')}</Typography>
                                <Typography sx={{ fontSize: 15, color: '#666', lineHeight: 1.75 }}>{service.serviceDesc}</Typography>
                            </Box>
                        )}

                        {/* What's included */}
                        <Box component="div" className="included-section">
                            <Typography className="section-sub-title">{t("What's included")}</Typography>
                            <Stack gap={1} sx={{ mt: 1.5 }}>
                                {included.map((item) => (
                                    <Stack key={item} direction="row" alignItems="center" gap={1}>
                                        <CheckIcon sx={{ fontSize: 16, color: '#4CAF50' }} />
                                        <Typography sx={{ fontSize: 15, color: '#555' }}>{t(item)}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Box>

                        {/* Before / After Results */}
                        {images.length >= 2 && (
                            <Box component="div" className="ba-results-section">
                                <Typography className="section-sub-title">{t('Before / After Results')}</Typography>
                                <Stack direction="row" className="ba-compare">
                                    <Box component="div" className="ba-half" style={{ backgroundImage: `url(${beforeImg})` }} />
                                    <Box component="div" className="ba-half" style={{ backgroundImage: `url(${afterImg})` }} />
                                    <Box component="div" className="ba-divider">
                                        <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>‹ ›</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {/* ═══ Customer Reviews ═══ */}
                        <Stack className="reviews-section">
                            <Typography className="section-sub-title">{t('Customer Reviews')}</Typography>

                            <Stack direction="row" gap={4} className="rating-summary">
                                <Stack alignItems="center" justifyContent="center" className="big-rating-box">
                                    <Typography className="big-rating">{formatRating(service.serviceRating)}</Typography>
                                    <RatingStars rating={4.9} size="medium" showNumber={false} />
                                    <Typography sx={{ fontSize: 12, color: '#888', mt: 0.5 }}>
                                        ({commentTotal || 128} {t('reviews')})
                                    </Typography>
                                </Stack>
                                <Stack flex={1} gap={0.75} sx={{ maxWidth: 380 }}>
                                    {ratingBreakdown.map((r) => (
                                        <Stack key={r.stars} direction="row" alignItems="center" gap={1}>
                                            <Typography sx={{ fontSize: 12, color: '#555', width: 8 }}>{r.stars}</Typography>
                                            <StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
                                            <Box component="div" className="rating-bar">
                                                <Box component="div" className="rating-fill" style={{ width: `${r.pct}%` }} />
                                            </Box>
                                            <Typography sx={{ fontSize: 12, color: '#888', width: 28 }}>{r.count}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Stack>

                            {/* Write a Review — endi faqat COMPLETED bron bo'lsa ko'rinadi */}
                            {canWriteReview ? (
                                <>
                                    <Button className="write-review-btn" onClick={() => setShowWriteReview(!showWriteReview)}>
                                        {t('Write a Review')}
                                    </Button>

                                    {showWriteReview && (
                                        <Stack className="write-review-box">
                                            <textarea
                                                className="review-textarea"
                                                placeholder={t('Share your experience...')}
                                                value={insertCommentData.commentContent}
                                                onChange={(e) => setInsertCommentData({ commentContent: e.target.value })}
                                            />
                                            <Button
                                                className="submit-review-btn"
                                                disabled={!insertCommentData.commentContent}
                                                onClick={createCommentHandler}
                                            >
                                                {t('Submit Review')}
                                            </Button>
                                        </Stack>
                                    )}
                                </>
                            ) : (
                                user._id && (
                                    <Typography sx={{ fontSize: 12.5, color: '#bbb', fontFamily: 'Poppins, sans-serif', mt: 1 }}>
                                        {t('Complete a booking for this service to write a review')}
                                    </Typography>
                                )
                            )}

                            {/* Review cardlar (2 ustun) */}
                            {comments.length === 0 ? (
                                <EmptyList emoji="💬" title={t('No reviews yet')} desc={t('Be the first to review!')} />
                            ) : (
                                <Box component="div" className="review-grid">
                                    {comments.map((comment) => {
                                        const authorImg = comment.memberData?.memberImage
                                            ? imgUrl(comment.memberData.memberImage, '/img/profile/defaultUser.svg')
                                            : '/img/profile/defaultUser.svg';
                                        return (
                                            <Stack key={comment._id} className="review-card">
                                                <Stack direction="row" gap={1.25} alignItems="center">
                                                    <Avatar src={authorImg} sx={{ width: 38, height: 38 }} />
                                                    <Box component="div">
                                                        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>
                                                            {comment.memberData?.memberNick}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: 11.5, color: '#bbb' }}>
                                                            {moment(comment.createdAt).format('MMM DD, YYYY')}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                                <RatingStars rating={4.9} size="small" showNumber={false} />
                                                <Typography sx={{ fontSize: 13.5, color: '#555', lineHeight: 1.6, mt: 0.75 }}>
                                                    {comment.commentContent}
                                                </Typography>
                                            </Stack>
                                        );
                                    })}
                                </Box>
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
                        </Stack>
                    </Stack>
                    {/* ══════════ CHAP BLOK tugadi ══════════ */}

                    {/* ══════════ O'NG BLOK: booking + specialist (sticky) ══════════ */}
                    <Stack className="service-detail-right">
                        {/* Booking card */}
                        <Stack className="booking-card">
                            <Typography className="bc-title">{t('Book This Service')}</Typography>

                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#FF4D8D' }}>
                                    ₩{formatPrice(service.servicePrice)}
                                </Typography>
                                <Box component="div" sx={{ textAlign: 'right' }}>
                                    <Stack direction="row" alignItems="center" gap={0.5} justifyContent="flex-end">
                                        <Typography sx={{ fontSize: 11, color: '#888' }}>{t('Deposit')}</Typography>
                                        <ShieldOutlinedIcon sx={{ fontSize: 13, color: '#888' }} />
                                    </Stack>
                                    <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#333' }}>
                                        ₩{formatPrice(salon?.depositAmount ?? 10000)}
                                    </Typography>
                                </Box>
                            </Stack>

                            {/* Salon info */}
                            {salon && (
                                <Stack direction="row" gap={1.25} alignItems="center" className="bc-salon-info">
                                    <Box component="div" className="bc-salon-icon">
                                        <StorefrontOutlinedIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                                    </Box>
                                    <Box component="div">
                                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{salon.salonTitle}</Typography>
                                        <Typography sx={{ fontSize: 12, color: '#888' }}>{salon.salonAddress}</Typography>
                                    </Box>
                                </Stack>
                            )}

                            <Typography className="bc-label">{t('Select Date')}</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                inputProps={{ min: moment().add(1, 'day').format('YYYY-MM-DD') }}
                                sx={{
                                    mb: 2,
                                    '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' },
                                    '&:hover fieldset': { borderColor: '#FF4D8D' },
                                }}
                            />

                            <Typography className="bc-label">{t('Select Time')}</Typography>
                            <Box component="div" className="time-grid">
                                {visibleSlots.map((slot) => {
                                    const isBooked = bookedSlots.includes(slot);
                                    return (
                                        <Box
                                            key={slot}
                                            component="div"
                                            onClick={() => !isBooked && setSelectedTime(slot)}
                                            className={`time-slot ${selectedTime === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                                        >
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
                                {bookingLoading ? '...' : `${t('Book Now')} — ₩${formatPrice(salon?.depositAmount ?? 10000)}`}
                            </Button>

                            <Stack direction="row" alignItems="center" gap={0.75} className="deposit-note">
                                <ShieldOutlinedIcon sx={{ fontSize: 14, color: '#888' }} />
                                <Box component="div">
                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#555' }}>
                                        {t('Pay')} ₩{formatPrice(salon?.depositAmount ?? 10000)} {t('deposit')}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, color: '#999' }}>{t('Rest paid at salon')}</Typography>
                                </Box>
                            </Stack>
                        </Stack>

                        {/* Specialist card */}
                        {specialist && (
                            <Stack className="specialist-card">
                                <Typography className="sc-title">{t('Your Specialist')}</Typography>
                                <Stack alignItems="center" gap={1.5}>
                                    <Box component="div" sx={{ position: 'relative' }}>
                                        <Avatar
                                            src={
                                                specialist.memberImage
                                                    ? imgUrl(specialist.memberImage, '/img/profile/defaultUser.svg')
                                                    : '/img/profile/defaultUser.svg'
                                            }
                                            sx={{ width: 90, height: 90, border: '3px solid #FF85B3' }}
                                        />
                                        <Box component="div" className="verified-dot">
                                            <VerifiedIcon sx={{ fontSize: 15, color: '#fff' }} />
                                        </Box>
                                    </Box>

                                    <Box component="div" sx={{ textAlign: 'center' }}>
                                        <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>
                                            {specialist.memberNick}
                                        </Typography>
                                        <Stack direction="row" gap={0.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
                                            {(specialist.memberSpecialty && specialist.memberSpecialty.length > 0
                                                ? specialist.memberSpecialty
                                                : specialtyFallback
                                            ).map((sp: string) => (
                                                <Chip key={sp} label={t(sp)} size="small" className="specialty-chip" />
                                            ))}
                                        </Stack>
                                        <Typography sx={{ fontSize: 13, color: '#888', mt: 1 }}>
                                            {t('Experience')}:{' '}
                                            {specialist.memberExperience && specialist.memberExperience > 0
                                                ? specialist.memberExperience
                                                : 5}{' '}
                                            {t('years')}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" gap={1} sx={{ width: '100%' }}>
                                        <Button
                                            fullWidth
                                            className={`follow-btn ${isFollowingMember ? 'following' : ''}`}
                                            startIcon={isFollowingMember ? <PersonRemoveOutlinedIcon /> : <PersonAddOutlinedIcon />}
                                            onClick={followHandler}
                                        >
                                            {isFollowingMember ? t('Following') : t('Follow')}
                                        </Button>
                                        <Link href={`/member?memberId=${specialist._id}`} style={{ flex: 1 }}>
                                            <Button fullWidth className="view-profile-btn">{t('View Profile')}</Button>
                                        </Link>
                                    </Stack>
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                    {/* ══════════ O'NG BLOK tugadi ══════════ */}
                </Stack>
            </Stack>
        </Stack>
    );
};

/** SSR **/
export async function getServerSideProps(ctx: any) {
    return {
        props: {
            ...(await serverSideTranslations(ctx.locale, ['common'])),
        },
    };
}

export default withLayoutBasic(ServiceDetail);