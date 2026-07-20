import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StarIcon from '@mui/icons-material/Star';
import { useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_VISITED_SALONS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const MobileRecentlyVisited = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [visited, setVisited] = useState<any[]>([]);

    const { error } = useQuery(GET_VISITED_SALONS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 20 } },
        skip: !user?._id,
        onCompleted: (data: T) => setVisited(data?.getVisitedSalons?.list ?? []),
        onError: (err) => console.error('GET_VISITED_SALONS XATO:', err.message, err),
    });

    return (
        <Box component="div" id="mobile-recentlyvisited">
            <Stack className="rv-list">
                {visited.length === 0 && (
                    <Stack alignItems="center" className="rv-empty">
                        <Typography className="rv-empty-emoji">{error ? '⚠️' : '🕐'}</Typography>
                        <Typography className="rv-empty-title">{error ? t('Something went wrong') : t('Nothing viewed yet')}</Typography>
                        {error && <Typography sx={{ fontSize: 11, color: '#e53935', mt: 1, textAlign: 'center', px: 2 }}>{error.message}</Typography>}
                    </Stack>
                )}

                {visited.map((s) => (
                    <Stack key={s._id} direction="row" alignItems="center" gap={1.25} className="rv-card" onClick={() => router.push(`/salons/${s._id}`)}>
                        <Box component="div" className="rv-card-img" style={{ backgroundImage: `url(${imgUrl(s.salonImages?.[0])})` }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography className="rv-card-title">{s.salonTitle}</Typography>
                                <Typography className="rv-time">{moment(s.updatedAt).fromNow()}</Typography>
                            </Stack>
                            <Typography className="rv-card-addr">{s.salonAddress}</Typography>
                            <Stack direction="row" alignItems="center" gap={0.3}>
                                <StarIcon sx={{ fontSize: 11, color: '#FFB800' }} />
                                <Typography className="rv-card-rating">{(s.salonRating ?? 0).toFixed(1)}</Typography>
                            </Stack>
                        </Box>
                        <ChevronRightIcon sx={{ fontSize: 18, color: '#ccc' }} />
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
};

export default MobileRecentlyVisited;