import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { UNSUBSCRIBE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const MobileFollowings = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [followings, setFollowings] = useState<any[]>([]);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);

    const { error } = useQuery(GET_MEMBER_FOLLOWINGS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 30, search: { followerId: user?._id } } },
        skip: !user?._id,
        onCompleted: (data: T) => setFollowings(data?.getMemberFollowings?.list ?? []),
        onError: (err) => console.error('GET_MEMBER_FOLLOWINGS XATO:', err.message, err),
    });

    const unfollowHandler = async (followingId: string) => {
        try {
            await unsubscribe({ variables: { input: { followingId } } });
            setFollowings((prev) => prev.filter((f) => f.followingId !== followingId));
        } catch (err) {
            console.log('ERROR, unfollowHandler:', err);
        }
    };

    return (
        <Box component="div" id="mobile-followings">
            <Stack className="fw-list">
                {followings.length === 0 && (
                    <Stack alignItems="center" className="fw-empty">
                        <Typography className="fw-empty-emoji">{error ? '⚠️' : '👤'}</Typography>
                        <Typography className="fw-empty-title">{error ? t('Something went wrong') : t("You're not following anyone yet")}</Typography>
                        {error && <Typography sx={{ fontSize: 11, color: '#e53935', mt: 1, textAlign: 'center', px: 2 }}>{error.message}</Typography>}
                    </Stack>
                )}

                {followings.map((f) => {
                    const person = f.followingData;
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
                            <Box component="div" className="fw-follow-btn following" onClick={() => unfollowHandler(f.followingId)}>
                                {t('Unfollow')}
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>
        </Box>
    );
};

export default MobileFollowings;