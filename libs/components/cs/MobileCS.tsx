import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useQuery } from '@apollo/client';
import moment from 'moment';
import { GET_NOTICES } from '../../../apollo/user/query';
import { T } from '../../types/common';

const TABS = [
    { label: 'All', value: undefined },
    { label: 'Notices', value: 'NOTICE' },
    { label: 'Events', value: 'EVENT' },
];

const TYPE_STYLE: Record<string, { emoji: string; color: string }> = {
    NOTICE: { emoji: '📢', color: '#2980B9' },
    EVENT: { emoji: '🎉', color: '#FF4D8D' },
    WARNING: { emoji: '⚠️', color: '#E67E22' },
};

const limit = 15;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileCS = () => {
    const { t } = useTranslation('common');
    const router = useRouter();

    const [activeType, setActiveType] = useState<string | undefined>(undefined);
    const [notices, setNotices] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { refetch } = useQuery(GET_NOTICES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit, sort: 'createdAt', direction: 'DESC', search: activeType ? { noticeType: activeType } : {} } },
        onCompleted: (data: T) => {
            setNotices(data?.getNotices?.list ?? []);
            setTotal(data?.getNotices?.metaCounter?.[0]?.total ?? 0);
        },
    });

    useEffect(() => {
        refetch({ input: { page: 1, limit, sort: 'createdAt', direction: 'DESC', search: activeType ? { noticeType: activeType } : {} } }).then(({ data }) => {
            setNotices(data?.getNotices?.list ?? []);
            setTotal(data?.getNotices?.metaCounter?.[0]?.total ?? 0);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeType]);

    // Pin qilinganlar tepada
    const sortedNotices = [...notices].sort((a, b) => (b.noticePinned ? 1 : 0) - (a.noticePinned ? 1 : 0));

    return (
        <Box component="div" id="mobile-cs">
            <Stack direction="row" alignItems="center" gap={1.5} className="cs-header">
                <IconButton className="cs-icon-btn" onClick={() => router.push('/')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography className="cs-title">{t('Notices & Events')}</Typography>
            </Stack>

            <Stack direction="row" className="cs-tabs">
                {TABS.map((tab) => (
                    <Box
                        key={tab.label}
                        component="div"
                        className={`cs-tab ${activeType === tab.value ? 'active' : ''}`}
                        onClick={() => setActiveType(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            <Stack className="cs-list">
                {sortedNotices.length === 0 && (
                    <Stack alignItems="center" className="cs-empty">
                        <Typography className="cs-empty-emoji">📭</Typography>
                        <Typography className="cs-empty-title">{t('No notices yet')}</Typography>
                    </Stack>
                )}

                {sortedNotices.map((n) => {
                    const style = TYPE_STYLE[n.noticeType] ?? TYPE_STYLE.NOTICE;
                    const isOpen = expandedId === n._id;
                    return (
                        <Stack key={n._id} className="cs-card" onClick={() => setExpandedId(isOpen ? null : n._id)}>
                            <Stack direction="row" alignItems="center" gap={0.75}>
                                {n.noticePinned && <PushPinIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />}
                                <Box component="div" className="cs-type-badge" sx={{ background: `${style.color}18`, color: style.color }}>
                                    {style.emoji} {t(n.noticeType)}
                                </Box>
                                <Typography className="cs-time">{moment(n.createdAt).fromNow()}</Typography>
                            </Stack>
                            <Typography className="cs-card-title">{n.noticeTitle}</Typography>
                            {isOpen && <Typography className="cs-card-content">{n.noticeContent}</Typography>}
                            <Stack direction="row" alignItems="center" gap={0.3} className="cs-views-row">
                                <RemoveRedEyeOutlinedIcon sx={{ fontSize: 12, color: '#bbb' }} />
                                <Typography className="cs-views">{n.noticeViews ?? 0} {t('views')}</Typography>
                            </Stack>
                        </Stack>
                    );
                })}
            </Stack>
        </Box>
    );
};

export default MobileCS;