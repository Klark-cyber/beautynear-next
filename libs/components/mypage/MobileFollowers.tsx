import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_MEMBER_FOLLOWERS } from '../../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const MobileFollowers = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [followers, setFollowers] = useState<any[]>([]);
    const [subscribe] = useMutation(SUBSCRIBE);

    const { error } = useQuery(GET_MEMBER_FOLLOWERS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 30, search: { followingId: user?._id } } },
        skip: !user?._id,
        onCompleted: (data: T) => setFollowers(data?.getMemberFollowers?.list ?? []),
        onError: (err) => console.error('GET_MEMBER_FOLLOWERS XATO:', err.message, err),
    });

    const followBackHandler = async (followerId: string) => {
        try {
            await subscribe({ variables: { input: { followingId: followerId } } });
            setFollowers((prev) =>
                prev.map((f) => (f.followerId === followerId ? { ...f, meFollowed: [{ followingId: followerId, followerId: user._id, myFollowing: true }] } : f)),
            );
        } catch (err) {
            console.log('ERROR, followBackHandler:', err);
        }
    };

    return (
        <Box component="div" id="mobile-followers">
            <Stack className="fw-list">
                {followers.length === 0 && (
                    <Stack alignItems="center" className="fw-empty">
                        <Typography className="fw-empty-emoji">{error ? '⚠️' : '👥'}</Typography>
                        <Typography className="fw-empty-title">{error ? t('Something went wrong') : t('No followers yet')}</Typography>
                        {error && <Typography sx={{ fontSize: 11, color: '#e53935', mt: 1, textAlign: 'center', px: 2 }}>{error.message}</Typography>}
                    </Stack>
                )}

                {followers.map((f) => {
                    const person = f.followerData;
                    const isFollowingBack = Boolean(f.meFollowed?.[0]?.myFollowing);
                    return (
                        <Stack key={f._id} direction="row" alignItems="center" gap={1.25} className="fw-card">
                            <Box
                                component="div"
                                className="fw-avatar"
                                style={{ backgroundImage: `url(${imgUrl(person?.memberImage)})` }}
                                onClick={() => person?.memberType === 'AGENT' && router.push(`/specialist/detail?id=${person._id}`)}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography className="fw-name">{person?.memberNick}</Typography>
                                <Typography className="fw-role">{person?.memberType === 'AGENT' ? (person?.memberSpecialty?.[0] ?? t('Specialist')) : t('User')}</Typography>
                            </Box>
                            <Box
                                component="div"
                                className={`fw-follow-btn ${isFollowingBack ? 'following' : ''}`}
                                onClick={() => !isFollowingBack && followBackHandler(f.followerId)}
                            >
                                {t(isFollowingBack ? 'Following' : 'Follow Back')}
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>
        </Box>
    );
};

export default MobileFollowers;