import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StarIcon from '@mui/icons-material/Star';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_MEMBER, GET_SALONS, GET_BOARD_ARTICLES, GET_MEMBER_FOLLOWERS, GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE, LIKE_TARGET_MEMBER } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { sweetErrorHandling } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const TABS_USER = [
    { label: 'Articles', value: 'articles' },
    { label: 'Followers', value: 'followers' },
    { label: 'Followings', value: 'followings' },
];

const TABS_AGENT = [
    { label: 'Salons', value: 'salons' },
    ...TABS_USER,
];

/* ─── Component ───────────────────────────────────────────────────────────── */

// ⚠️ MUHIM: bu — avval "MEMBER PAGE MOBILE" placeholder edi (hech qachon
// qurilmagan). Desktop member/index.tsx bilan bir xil mantiq (SUBSCRIBE/
// UNSUBSCRIBE/LIKE_TARGET_MEMBER) — faqat yangi mobil UI bilan.

const MobileMember = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);
    const memberId = router.query.memberId as string;

    const [activeTab, setActiveTab] = useState('salons');
    const [member, setMember] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [salons, setSalons] = useState<any[]>([]);
    const [articles, setArticles] = useState<any[]>([]);
    const [followers, setFollowers] = useState<any[]>([]);
    const [followings, setFollowings] = useState<any[]>([]);

    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);
    const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

    const { refetch: memberRefetch } = useQuery(GET_MEMBER, {
        fetchPolicy: 'network-only',
        variables: { input: memberId },
        skip: !memberId,
        onCompleted: (data: T) => {
            const m = data?.getMember;
            setMember(m);
            setIsFollowing(Boolean(m?.meFollowed?.[0]?.myFollowing));
            if (m?.memberType !== 'AGENT') setActiveTab('articles');
        },
    });

    useQuery(GET_SALONS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: { memberId } } },
        skip: !memberId || activeTab !== 'salons',
        onCompleted: (data: T) => setSalons(data?.getSalons?.list ?? []),
    });

    useQuery(GET_BOARD_ARTICLES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: { memberId } } },
        skip: !memberId || activeTab !== 'articles',
        onCompleted: (data: T) => setArticles(data?.getBoardArticles?.list ?? []),
    });

    useQuery(GET_MEMBER_FOLLOWERS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 20, search: { followingId: memberId } } },
        skip: !memberId || activeTab !== 'followers',
        onCompleted: (data: T) => setFollowers(data?.getMemberFollowers?.list ?? []),
    });

    useQuery(GET_MEMBER_FOLLOWINGS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 20, search: { followerId: memberId } } },
        skip: !memberId || activeTab !== 'followings',
        onCompleted: (data: T) => setFollowings(data?.getMemberFollowings?.list ?? []),
    });

    /** HANDLERS **/
    const followHandler = async () => {
        if (!user?._id) return router.push('/account/join');
        try {
            if (isFollowing) await unsubscribe({ variables: { input: { followingId: memberId } } });
            else await subscribe({ variables: { input: { followingId: memberId } } });
            setIsFollowing((prev) => !prev);
            setMember((prev: any) => (prev ? { ...prev, memberFollowers: (prev.memberFollowers ?? 0) + (isFollowing ? -1 : 1) } : prev));
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    const likeHandler = async () => {
        if (!user?._id) return router.push('/account/join');
        try {
            await likeTargetMember({ variables: { input: memberId } });
            const { data } = await memberRefetch();
            setMember(data?.getMember ?? null);
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    if (!member) {
        return (
            <Box id="mobile-member">
                <Stack alignItems="center" justifyContent="center" sx={{ height: '60vh' }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#999' }}>{t('Loading...')}</Typography>
                </Stack>
            </Box>
        );
    }

    const isAgent = member.memberType === 'AGENT';
    const liked = Boolean(member.meLiked?.[0]?.myFavorite);
    const tabs = isAgent ? TABS_AGENT : TABS_USER;

    return (
        <Box component="div" id="mobile-member">
            <Stack direction="row" alignItems="center" className="mm-header">
                <IconButton className="mm-icon-btn" onClick={() => router.push('/')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
                </IconButton>
                <Typography className="mm-header-title">{member.memberNick}</Typography>
            </Stack>

            <Stack alignItems="center" className="mm-profile-card">
                <Box component="div" className="mm-avatar" style={{ backgroundImage: `url(${imgUrl(member.memberImage)})` }} />
                <Typography className="mm-name">{member.memberNick}</Typography>
                <Box component="div" className="mm-type-badge">{t(member.memberType)}</Box>
                {isAgent && (
                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                        <StarIcon sx={{ fontSize: 14, color: '#FFB800' }} />
                        <Typography className="mm-rating">{(member.memberRank ?? 0).toFixed?.(1) ?? 0}</Typography>
                    </Stack>
                )}

                <Stack direction="row" className="mm-stats-row">
                    <Stack alignItems="center" className="mm-stat" onClick={() => setActiveTab('followers')}>
                        <Typography className="mm-stat-num">{member.memberFollowers ?? 0}</Typography>
                        <Typography className="mm-stat-label">{t('Followers')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="mm-stat" onClick={() => setActiveTab('followings')}>
                        <Typography className="mm-stat-num">{member.memberFollowings ?? 0}</Typography>
                        <Typography className="mm-stat-label">{t('Following')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="mm-stat">
                        <Typography className="mm-stat-num">{member.memberLikes ?? 0}</Typography>
                        <Typography className="mm-stat-label">{t('Likes')}</Typography>
                    </Stack>
                </Stack>

                {member._id !== user?._id && (
                    <Stack direction="row" gap={1} className="mm-action-row">
                        <Box component="div" className={`mm-follow-btn ${isFollowing ? 'following' : ''}`} onClick={followHandler}>
                            {t(isFollowing ? 'Following' : 'Follow')}
                        </Box>
                        <IconButton className="mm-like-btn" onClick={likeHandler}>
                            {liked ? <FavoriteIcon sx={{ fontSize: 20, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />}
                        </IconButton>
                    </Stack>
                )}
            </Stack>

            <Stack direction="row" className="mm-tabs">
                {tabs.map((tab) => (
                    <Box
                        key={tab.value}
                        component="div"
                        className={`mm-tab ${activeTab === tab.value ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            <Stack className="mm-content">
                {activeTab === 'salons' && (
                    <Stack gap={1.25}>
                        {salons.length === 0 && <Typography className="mm-empty-text">{t('No salons yet')}</Typography>}
                        {salons.map((s) => (
                            <Stack key={s._id} direction="row" gap={1.25} className="mm-list-card" onClick={() => router.push(`/salons/${s._id}`)}>
                                <Box component="div" className="mm-list-img" style={{ backgroundImage: `url(${imgUrl(s.salonImages?.[0])})` }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography className="mm-list-title">{s.salonTitle}</Typography>
                                    <Typography className="mm-list-sub">{s.salonAddress}</Typography>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <StorefrontOutlinedIcon sx={{ fontSize: 11, color: '#999' }} />
                                        <Typography className="mm-list-meta">{(s.salonRating ?? 0).toFixed(1)}</Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        ))}
                    </Stack>
                )}

                {activeTab === 'articles' && (
                    <Stack gap={1.25}>
                        {articles.length === 0 && <Typography className="mm-empty-text">{t('No articles yet')}</Typography>}
                        {articles.map((a) => (
                            <Stack key={a._id} direction="row" gap={1.25} className="mm-list-card" onClick={() => router.push(`/community/detail?id=${a._id}`)}>
                                <Box component="div" className="mm-list-img" style={{ backgroundImage: `url(${imgUrl(a.articleImage, '/img/banner/hero.jpg')})` }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography className="mm-list-title">{a.articleTitle}</Typography>
                                    <Typography className="mm-list-sub">{moment(a.createdAt).fromNow()}</Typography>
                                </Box>
                            </Stack>
                        ))}
                    </Stack>
                )}

                {activeTab === 'followers' && (
                    <Stack gap={1.25}>
                        {followers.length === 0 && <Typography className="mm-empty-text">{t('No followers yet')}</Typography>}
                        {followers.map((f) => (
                            <Stack key={f._id} direction="row" alignItems="center" gap={1.25} className="mm-person-row" onClick={() => router.push(`/member?memberId=${f.followerId}`)}>
                                <Box component="div" className="mm-person-avatar" style={{ backgroundImage: `url(${imgUrl(f.followerData?.memberImage)})` }} />
                                <Typography className="mm-person-name">{f.followerData?.memberNick}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                )}

                {activeTab === 'followings' && (
                    <Stack gap={1.25}>
                        {followings.length === 0 && <Typography className="mm-empty-text">{t("Not following anyone yet")}</Typography>}
                        {followings.map((f) => (
                            <Stack key={f._id} direction="row" alignItems="center" gap={1.25} className="mm-person-row" onClick={() => router.push(`/member?memberId=${f.followingId}`)}>
                                <Box component="div" className="mm-person-avatar" style={{ backgroundImage: `url(${imgUrl(f.followingData?.memberImage)})` }} />
                                <Typography className="mm-person-name">{f.followingData?.memberNick}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                )}
            </Stack>
        </Box>
    );
};

export default MobileMember;