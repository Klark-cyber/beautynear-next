import React, { useState } from 'react';
import { Stack, Box, Typography, Avatar } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EastIcon from '@mui/icons-material/East';
import Link from 'next/link';
import { sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { REACT_APP_API_URL } from '../../config';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import moment from 'moment';

// Hardcoded upcoming events — backendda events moduli yo'q (portfolio demo)
const EVENTS = [
    { month: 'MAY', day: '24', title: 'K-Beauty Workshop', desc: 'Learn skincare secrets from experts', loc: 'Seoul, Gangnam' },
    { month: 'MAY', day: '30', title: 'Makeup Trends 2026', desc: 'Latest Korean makeup trends', loc: 'Seoul, Apgujeong' },
    { month: 'JUN', day: '07', title: 'Wellness Spa Day', desc: 'Relax & recharge your beauty', loc: 'Seoul, Cheongdam' },
];

const EventsCommunity = () => {
    const { t } = useTranslation('common');
    const device = useDeviceDetect();
    const [articles, setArticles] = useState<BoardArticle[]>([]);

    useQuery(GET_BOARD_ARTICLES, {
        fetchPolicy: 'cache-and-network',
        variables: {
            input: {
                page: 1, limit: 3, sort: 'articleViews', direction: 'DESC',
                search: { articleCategory: BoardArticleCategory.FREE },
            },
        },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => setArticles(data?.getBoardArticles?.list ?? []),
    });

    /** EVENTS column **/
    const EventsColumn = () => (
        <Stack className="ec-col events-col">
            <Stack direction="row" justifyContent="space-between" alignItems="center" className="ec-head">
                <Typography className="ec-title">{t('Upcoming Events')}</Typography>
                <Link href="/cs">
                    <Stack direction="row" alignItems="center" gap={0.5} className="ec-viewall">
                        <Typography className="ecv-text">{t('View all events')}</Typography>
                        <EastIcon sx={{ fontSize: 15 }} />
                    </Stack>
                </Link>
            </Stack>

            <Stack className="events-list">
                {EVENTS.map((ev, i) => (
                    <Stack key={i} direction="row" alignItems="center" className="event-row">
                        <Stack className="ev-date">
                            <Typography className="ev-day">{ev.day}</Typography>
                            <Typography className="ev-month">{ev.month}</Typography>
                        </Stack>
                        <Stack className="ev-info" flex={1}>
                            <Typography className="ev-name">{ev.title}</Typography>
                            <Typography className="ev-desc">{ev.desc}</Typography>
                            <Stack direction="row" alignItems="center" gap={0.25} className="ev-loc">
                                <LocationOnIcon sx={{ fontSize: 12 }} />
                                <Typography className="evl-text">{ev.loc}</Typography>
                            </Stack>
                        </Stack>
                        {/* ⚠️ YANGI — avval hech qanday onClick yo'q edi */}
                        <Box component="div" className="ev-join" onClick={() => sweetTopSmallSuccessAlert(t('Your profile joined event'), 1200)}>
                            {t('Join Event')}
                        </Box>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );

    /** COMMUNITY column **/
    const CommunityColumn = () => (
        <Stack className="ec-col community-col">
            <Stack direction="row" justifyContent="space-between" alignItems="center" className="ec-head">
                <Typography className="ec-title">{t('Community Board Highlights')}</Typography>
                <Link href="/community?articleCategory=FREE">
                    <Stack direction="row" alignItems="center" gap={0.5} className="ec-viewall">
                        <Typography className="ecv-text">{t('View all posts')}</Typography>
                        <EastIcon sx={{ fontSize: 15 }} />
                    </Stack>
                </Link>
            </Stack>

            <Stack direction="row" className="community-grid">
                {articles.map((article) => {
                    const img = article.articleImage
                        ? (article.articleImage.startsWith('http') ? article.articleImage : `${REACT_APP_API_URL}/${article.articleImage}`)
                        : '';
                    const authorImg = article.memberData?.memberImage
                        ? (article.memberData.memberImage.startsWith('http') ? article.memberData.memberImage : `${REACT_APP_API_URL}/${article.memberData.memberImage}`)
                        : '/img/profile/defaultUser.svg';

                    return (
                        <Link key={article._id} href={`/community/detail?articleCategory=${article.articleCategory}&id=${article._id}`}>
                            <Stack className="comm-card">
                                <Stack direction="row" alignItems="center" justifyContent="space-between" className="cc-author">
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Avatar src={authorImg} className="cc-avatar" />
                                        <Typography className="cc-nick">{article.memberData?.memberNick ?? t('User')}</Typography>
                                    </Stack>
                                    <Typography className="cc-time">{moment(article.createdAt).fromNow(true)}</Typography>
                                </Stack>

                                <Typography className="cc-text">{article.articleContent || article.articleTitle}</Typography>

                                {img && <Box component="div" className="cc-img" style={{ backgroundImage: `url(${img})` }} />}

                                <Stack direction="row" alignItems="center" gap={1.5} className="cc-footer">
                                    <Stack direction="row" alignItems="center" gap={0.25}>
                                        <FavoriteBorderIcon sx={{ fontSize: 14, color: '#bbb' }} />
                                        <Typography className="cc-stat">{article.articleLikes}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.25}>
                                        <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: '#bbb' }} />
                                        <Typography className="cc-stat">{article.articleComments}</Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Link>
                    );
                })}
            </Stack>
        </Stack>
    );

    /** MOBILE **/
    if (device === 'mobile') {
        return (
            <Stack className="events-community-section mobile">
                <EventsColumn />
                {!!articles.length && <CommunityColumn />}
            </Stack>
        );
    }

    /** PC **/
    return (
        <Stack className="events-community-section">
            <Stack direction="row" className="ec-container">
                <EventsColumn />
                <Box component="div" className="ec-divider" />
                <CommunityColumn />
            </Stack>
        </Stack>
    );
};

export default EventsCommunity;