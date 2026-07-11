import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, Avatar, Button, Pagination as MuiPagination } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CheckIcon from '@mui/icons-material/Check';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_MEMBER_FOLLOWERS } from '../../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE, LIKE_TARGET_MEMBER } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import EmptyList from '../common/Emptylist';
import { Follower } from '../../types/follow/follow';
import { T } from '../../types/common';
import { REACT_APP_API_URL, Messages } from '../../config';
import { MemberType } from '../../enums/member.enum';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string): string => {
    if (!raw) return '/img/profile/defaultUser.svg';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const limit = 6;

/* ─── Component ───────────────────────────────────────────────────────────── */

const Followers: NextPage = ({ initialInput = { page: 1, limit: 6 }, ...props }: any) => {
    const router = useRouter();
    const { t } = useTranslation('common');
    const user = useReactiveVar(userVar);

    const [page, setPage] = useState<number>(initialInput.page);
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [total, setTotal] = useState<number>(0);

    /** APOLLO REQUESTS **/
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);
    const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

    // Meni followingId sifatida qidiramiz → ya'ni meni follow qilayotganlar (mening followerlarim)
    const followInquiry = { ...initialInput, page, search: { followingId: user?._id } };

    const { refetch } = useQuery(GET_MEMBER_FOLLOWERS, {
        fetchPolicy: 'network-only',
        variables: { input: followInquiry },
        skip: !user?._id,
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setFollowers(data?.getMemberFollowers?.list ?? []);
            setTotal(data?.getMemberFollowers?.metaCounter?.[0]?.total ?? 0);
        },
    });

    /** HANDLERS **/
    // ⚠️ FollowToggleInput — OBYEKT turi ({ followingId }), oddiy string emas!
    const subscribeHandler = async (id: string) => {
        try {
            if (!id) throw new Error(Messages.error1);
            if (!user?._id) throw new Error(Messages.error2);
            await subscribe({ variables: { input: { followingId: id } } });
            await sweetTopSmallSuccessAlert('Subscribed!', 800);
            await refetch({ input: followInquiry });
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    const unsubscribeHandler = async (id: string) => {
        try {
            if (!id) throw new Error(Messages.error1);
            if (!user?._id) throw new Error(Messages.error2);
            await unsubscribe({ variables: { input: { followingId: id } } });
            await sweetTopSmallSuccessAlert('Unsubscribed!', 800);
            await refetch({ input: followInquiry });
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    const likeMemberHandler = async (id: string) => {
        try {
            if (!id) return;
            if (!user?._id) throw new Error(Messages.error2);
            await likeTargetMember({ variables: { input: id } });
            await refetch({ input: followInquiry });
        } catch (err: any) {
            console.log('ERROR, likeMemberHandler:', err.message);
            sweetMixinErrorAlert(err.message).then();
        }
    };

    const paginationHandler = (_e: any, value: number) => setPage(value);

    const goMemberPage = (id?: string) => {
        if (!id || id === user?._id) return;
        router.push(`/member?memberId=${id}`);
    };

    return (
        <Box component="div" className="mypage-content">
            {/* Sarlavha */}
            <Typography className="content-title">{t('Followers')}</Typography>
            <Typography className="content-subtitle">{t('People who follow you')}</Typography>

            {followers.length === 0 ? (
                <Box component="div" className="follow-page-frame">
                    <EmptyList emoji="👥" title={t('No followers yet')} desc={t('People who follow you will appear here')} />
                </Box>
            ) : (
                <Box component="div" className="follow-page-frame">
                    <Box component="div" className="member-grid">
                        {followers.map((follower) => {
                            const member = follower.followerData;
                            if (!member) return null;

                            const isFollowingBack = follower.meFollowed?.[0]?.myFollowing;
                            const isLiked = follower.meLiked?.[0]?.myFavorite;
                            const isAgent = member.memberType === MemberType.AGENT;

                            return (
                                <Stack key={follower._id} className="member-card" alignItems="center">
                                    <Box component="div" className="mc-avatar-wrap" onClick={() => goMemberPage(member._id)}>
                                        <Avatar src={imgUrl(member.memberImage)} className="mc-avatar" />
                                    </Box>

                                    <Stack direction="row" alignItems="center" gap={0.75} className="mc-name-row">
                                        <Typography className="mc-name" onClick={() => goMemberPage(member._id)}>
                                            {member.memberNick}
                                        </Typography>
                                        <Box component="div" className="mc-badge">{t(isAgent ? 'Agent' : 'User')}</Box>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" justifyContent="center" className="mc-stats">
                                        <Stack alignItems="center" className="mc-stat-group">
                                            <Typography className="mc-stat-num">{member.memberFollowers ?? 0}</Typography>
                                            <Typography className="mc-stat-label">{t('Followers')}</Typography>
                                        </Stack>

                                        <Box component="div" className="mc-stat-divider" />

                                        <Stack alignItems="center" className="mc-stat-group">
                                            <Typography className="mc-stat-num">{member.memberFollowings ?? 0}</Typography>
                                            <Typography className="mc-stat-label">{t('Following')}</Typography>
                                        </Stack>

                                        <Box component="div" className="mc-stat-divider" />

                                        <Stack
                                            alignItems="center"
                                            className="mc-stat-group mc-like"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                likeMemberHandler(member._id);
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" gap={0.3}>
                                                {isLiked ? (
                                                    <FavoriteIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
                                                ) : (
                                                    <FavoriteBorderIcon sx={{ fontSize: 15, color: '#999' }} />
                                                )}
                                                <Typography className="mc-stat-num">{member.memberLikes ?? 0}</Typography>
                                            </Stack>
                                            <Typography className="mc-stat-label">{t('Likes')}</Typography>
                                        </Stack>
                                    </Stack>

                                    {user?._id !== follower.followerId && (
                                        <>
                                            {isFollowingBack ? (
                                                <Button
                                                    fullWidth
                                                    className="mc-btn following"
                                                    startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => unsubscribeHandler(member._id)}
                                                >
                                                    {t('Following')}
                                                </Button>
                                            ) : (
                                                <Button fullWidth className="mc-btn follow" onClick={() => subscribeHandler(member._id)}>
                                                    {t('Follow Back')}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </Stack>
                            );
                        })}
                    </Box>

                    {followers.length !== 0 && (
                        <Stack alignItems="center" sx={{ mt: 4 }}>
                            <MuiPagination
                                page={page}
                                count={Math.ceil(total / limit)}
                                onChange={paginationHandler}
                                shape="circular"
                                sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
                            />
                        </Stack>
                    )}

                    {/* Maslahat banneri */}
                    <Stack direction="row" alignItems="center" gap={1.25} className="follow-tip-banner">
                        <AutoAwesomeIcon className="tip-emoji" sx={{ color: '#FF4D8D' }} />
                        <Typography className="tip-text">
                            <b>{t('Tip')}:</b> {t('Follow back to build stronger connections and grow your beauty community!')}
                        </Typography>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default Followers;

Followers.defaultProps = {
    initialInput: {
        page: 1,
        limit,
    },
};