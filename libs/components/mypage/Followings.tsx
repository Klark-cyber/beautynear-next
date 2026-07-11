import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, Avatar, Button, Pagination as MuiPagination } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE, LIKE_TARGET_MEMBER } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import EmptyList from '../common/Emptylist';
import { Following } from '../../types/follow/follow';
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

const Followings: NextPage = ({ initialInput = { page: 1, limit: 6 }, ...props }: any) => {
    const router = useRouter();
    const { t } = useTranslation('common');
    const user = useReactiveVar(userVar);

    const [page, setPage] = useState<number>(initialInput.page);
    const [followings, setFollowings] = useState<Following[]>([]);
    const [total, setTotal] = useState<number>(0);

    /** APOLLO REQUESTS **/
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);
    const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

    // Meni followerId sifatida qidiramiz → ya'ni men follow qilayotganlar (mening followinglarim)
    const followInquiry = { ...initialInput, page, search: { followerId: user?._id } };

    const { refetch } = useQuery(GET_MEMBER_FOLLOWINGS, {
        fetchPolicy: 'network-only',
        variables: { input: followInquiry },
        skip: !user?._id,
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setFollowings(data?.getMemberFollowings?.list ?? []);
            setTotal(data?.getMemberFollowings?.metaCounter?.[0]?.total ?? 0);
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
            <Typography className="content-title">{t('Followings')}</Typography>
            <Typography className="content-subtitle">{t('People you follow')}</Typography>

            {followings.length === 0 ? (
                <Box component="div" className="follow-page-frame">
                    <EmptyList
                        emoji="👤"
                        title={t('No followings yet')}
                        desc={t('Salons and specialists you follow will appear here')}
                    />
                </Box>
            ) : (
                <Box component="div" className="follow-page-frame">
                    <Box component="div" className="member-grid">
                        {followings.map((following) => {
                            const member = following.followingData;
                            if (!member) return null;

                            // Followings ro'yxatidagi hamma allaqachon "men follow qilayotgan" odam —
                            // shu sababli tugma odatda doim "Unfollow" holatida bo'ladi
                            const isFollowingBack = following.meFollowed?.[0]?.myFollowing ?? true;
                            const isLiked = following.meLiked?.[0]?.myFavorite;
                            const isAgent = member.memberType === MemberType.AGENT;

                            return (
                                <Stack key={following._id} className="member-card" alignItems="center">
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

                                    {user?._id !== following.followingId && (
                                        <>
                                            {isFollowingBack ? (
                                                <Button
                                                    fullWidth
                                                    className="mc-btn unfollow"
                                                    startIcon={<PersonRemoveOutlinedIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => unsubscribeHandler(member._id)}
                                                >
                                                    {t('Unfollow')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    fullWidth
                                                    className="mc-btn follow"
                                                    startIcon={<PersonAddOutlinedIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => subscribeHandler(member._id)}
                                                >
                                                    {t('Follow')}
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </Stack>
                            );
                        })}
                    </Box>

                    {followings.length !== 0 && (
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
                </Box>
            )}
        </Box>
    );
};

export default Followings;

Followings.defaultProps = {
    initialInput: {
        page: 1,
        limit,
    },
};