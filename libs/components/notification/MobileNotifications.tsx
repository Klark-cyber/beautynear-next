import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CampaignIcon from '@mui/icons-material/Campaign';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import BlockIcon from '@mui/icons-material/Block';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_NOTIFICATIONS } from '../../../apollo/user/query';
import { REACT_APP_API_URL } from '../../config';
import { useChatContext } from '../../context/ChatContext';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string): string => {
    if (!raw) return '/img/profile/defaultUser.svg';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};
import { MARK_NOTIFICATION_AS_READ, MARK_ALL_NOTIFICATIONS_AS_READ } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const TYPE_ICON: Record<string, { icon: any; color: string }> = {
    FOLLOW: { icon: PersonAddAltIcon, color: '#FF4D8D' },
    LIKE: { icon: FavoriteIcon, color: '#FF4D8D' },
    COMMENT: { icon: StarIcon, color: '#F5B100' },
    BOOKING_CONFIRMED: { icon: EventAvailableIcon, color: '#3EA043' },
    BOOKING_CANCELLED: { icon: EventBusyIcon, color: '#DC3545' },
    NEW_POST: { icon: CampaignIcon, color: '#2980B9' },
    DISCOUNT: { icon: LocalOfferIcon, color: '#F5A623' },
    FREE_SLOT: { icon: EventAvailableIcon, color: '#3EA043' },
    NEW_REVIEW: { icon: StarIcon, color: '#F5B100' },
    // ⚠️ YANGI — Agent/Admin uchun
    NEW_BOOKING: { icon: EventAvailableIcon, color: '#FF4D8D' },
    ACCOUNT_SUSPENDED: { icon: BlockIcon, color: '#DC3545' },
    AGENT_APPROVED: { icon: WorkspacePremiumIcon, color: '#F5B100' },
    NEW_INQUIRY: { icon: SupportAgentIcon, color: '#2980B9' },
    NEW_AGENT_REQUEST: { icon: HowToRegIcon, color: '#3EA043' },
    NEW_MESSAGE: { icon: ChatBubbleOutlineIcon, color: '#FF4D8D' },
};

const limit = 20;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileNotifications = () => {
    const { t } = useTranslation('common');
    const { openChatWith } = useChatContext();
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ);
    const [markAllAsRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ);

    const { refetch } = useQuery(GET_NOTIFICATIONS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit, search: {} } },
        skip: !user?._id,
        onCompleted: (data: T) => {
            setNotifications(data?.getNotifications?.list ?? []);
            setTotal(data?.getNotifications?.metaCounter?.[0]?.total ?? 0);
        },
    });

    // ⚠️ YANGI — avval faqat komponent BIRINCHI marta yuklanganda so'rov
    // ketardi. Agar Next.js sahifani qayta MOUNT qilmasa (masalan
    // router.back() orqali qaytilganda), ro'yxat ESKI holatda qolib
    // ketardi — masalan unfollow/unlike qilingandan keyin ham o'chgan
    // bildirishnoma ko'rinishda qolardi. Endi sahifaga har safar
    // KIRILGANDA (fokus olganda) majburiy yangilanadi.
    // ⚠️ TUZATILDI: avval 'focus' hodisasidan foydalanilgan edi — bu
    // faqat BRAUZER TABI almashtirilganda ishlaydi, ilova ICHIDAGI
    // navigatsiyada (masalan orqaga qaytishda) ishlamaydi. Endi Next.js
    // routerining o'z hodisasidan foydalaniladi — bu sahifaga HAR SAFAR
    // kirilganda (ilova ichida ham) ishonchli yangilanishni ta'minlaydi.
    useEffect(() => {
        const refreshOnRoute = (url: string) => {
            if (url === '/notifications' && user?._id) {
                refetch({ input: { page: 1, limit, search: {} } }).then(({ data }) => {
                    setNotifications(data?.getNotifications?.list ?? []);
                    setTotal(data?.getNotifications?.metaCounter?.[0]?.total ?? 0);
                });
            }
        };
        router.events.on('routeChangeComplete', refreshOnRoute);
        return () => router.events.off('routeChangeComplete', refreshOnRoute);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id]);

    /** HANDLERS **/
    const notificationClickHandler = async (n: any) => {
        try {
            if (n.notificationStatus === 'WAIT') {
                await markAsRead({ variables: { input: n._id } });
                setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, notificationStatus: 'READ' } : x)));
            }
        } catch (err) {
            console.log('ERROR, notificationClickHandler:', err);
        }

        // Turi bo'yicha tegishli sahifaga yo'naltirish
        if (n.notificationType === 'NEW_MESSAGE' && n.authorId) {
            openChatWith({ memberId: n.authorId, nick: n.authorData?.memberNick ?? 'User', image: n.authorData?.memberImage });
            router.push('/messages');
        }
        else if (n.notificationGroup === 'SALON' && n.salonId) router.push(`/salons/${n.salonId}`);
        else if (n.notificationGroup === 'ARTICLE' && n.articleId) router.push(`/community/detail?id=${n.articleId}`);
        else if (n.notificationType === 'NEW_BOOKING') router.push('/mypage?category=agentBookings');
        else if (n.notificationGroup === 'BOOKING') router.push('/mypage?category=myBookings');
        else if (n.notificationType === 'AGENT_APPROVED') router.push('/mypage');
        else if (n.notificationType === 'NEW_INQUIRY') router.push('/_admin/cs/inquiry');
        else if (n.notificationType === 'NEW_AGENT_REQUEST') router.push('/_admin/agent-requests');
        else if (n.notificationType === 'FOLLOW' && n.authorId) router.push(`/member?memberId=${n.authorId}`);
        else if (n.notificationType === 'FOLLOW') router.push('/mypage?category=followers');
    };

    const markAllHandler = async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((x) => ({ ...x, notificationStatus: 'READ' })));
        } catch (err) {
            console.log('ERROR, markAllHandler:', err);
        }
    };

    const loadMoreHandler = async () => {
        const nextPage = page + 1;
        const { data } = await refetch({ input: { page: nextPage, limit, search: {} } });
        setNotifications((prev) => [...prev, ...(data?.getNotifications?.list ?? [])]);
        setPage(nextPage);
    };

    return (
        <Box component="div" id="mobile-notifications">
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="nt-header">
                <Stack direction="row" alignItems="center" gap={1.5}>
                    <IconButton className="nt-icon-btn" onClick={() => router.push('/')}>
                        <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography className="nt-title">{t('Notifications')}</Typography>
                </Stack>
                {notifications.some((n) => n.notificationStatus === 'WAIT') && (
                    <Typography className="nt-mark-all" onClick={markAllHandler}>{t('Mark all read')}</Typography>
                )}
            </Stack>

            <Stack className="nt-list">
                {notifications.length === 0 && (
                    <Stack alignItems="center" className="nt-empty">
                        <Typography className="nt-empty-emoji">🔔</Typography>
                        <Typography className="nt-empty-title">{t('No notifications yet')}</Typography>
                    </Stack>
                )}

                {notifications.map((n) => {
                    const meta = TYPE_ICON[n.notificationType] ?? TYPE_ICON.COMMENT;
                    const Icon = meta.icon;
                    const isUnread = n.notificationStatus === 'WAIT';
                    return (
                        <Stack
                            key={n._id}
                            direction="row"
                            gap={1.25}
                            className={`nt-card ${isUnread ? 'unread' : ''}`}
                            onClick={() => notificationClickHandler(n)}
                        >
                            {n.authorData?.memberImage ? (
                                <Box component="div" className="nt-avatar-wrap">
                                    <Box component="div" className="nt-author-avatar" style={{ backgroundImage: `url(${imgUrl(n.authorData.memberImage)})` }} />
                                    <Box component="div" className="nt-type-badge" sx={{ background: meta.color }}>
                                        <Icon sx={{ fontSize: 11, color: '#fff' }} />
                                    </Box>
                                </Box>
                            ) : (
                                <Box component="div" className="nt-icon-wrap" sx={{ background: `${meta.color}18`, color: meta.color }}>
                                    <Icon sx={{ fontSize: 18 }} />
                                </Box>
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography className="nt-card-title">
                                    {n.authorData?.memberNick ? <b>{n.authorData.memberNick}</b> : null} {n.notificationTitle}
                                </Typography>
                                {n.notificationDesc && <Typography className="nt-card-desc">{n.notificationDesc}</Typography>}
                                <Typography className="nt-card-time">{moment(n.createdAt).fromNow()}</Typography>
                            </Box>
                            {isUnread && <Box component="div" className="nt-unread-dot" />}
                        </Stack>
                    );
                })}
            </Stack>

            {notifications.length > 0 && notifications.length < total && (
                <Box component="div" className="nt-load-more" onClick={loadMoreHandler}>
                    {t('Load More')}
                </Box>
            )}
        </Box>
    );
};

export default MobileNotifications;