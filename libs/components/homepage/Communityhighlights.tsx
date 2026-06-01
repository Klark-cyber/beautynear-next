import React, { useState } from 'react';
import { Stack, Box, Typography, Avatar, IconButton } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { REACT_APP_API_URL } from '../../config';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import moment from 'moment';

const CommunityHighlights = () => {
    const { t } = useTranslation('common');
    const device = useDeviceDetect();
    const [articles, setArticles] = useState < BoardArticle[] > ([]);

    useQuery(GET_BOARD_ARTICLES, {
        fetchPolicy: 'cache-and-network',
        variables: {
            input: {
                page: 1, limit: 6, sort: 'articleViews', direction: 'DESC',
                search: { articleCategory: BoardArticleCategory.FREE },
            },
        },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => setArticles(data?.getBoardArticles?.list ?? []),
    });

    if (!articles.length) return null;

    const ArticleCard = ({ article }: { article: BoardArticle }) => {
        const img = article.articleImage ? `${REACT_APP_API_URL}/${article.articleImage}` : '/img/community/default.jpg';
        const authorImg = article.memberData?.memberImage ? `${REACT_APP_API_URL}/${article.memberData.memberImage}` : '/img/profile/defaultUser.svg';

        return (
            <Link href={`/community/detail?articleCategory=${article.articleCategory}&id=${article._id}`}>
                <Stack
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        background: '#fff',
                        border: '1px solid rgba(255,77,141,0.08)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.25s',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(255,77,141,0.12)', borderColor: 'rgba(255,77,141,0.2)' },
                    }}
                >
                    {/* Author + time */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, pb: 1 }}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Avatar src={authorImg} sx={{ width: 28, height: 28 }} />
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333' }}>
                                {article.memberData?.memberNick ?? 'User'}
                            </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: 11, color: '#bbb' }}>
                            {moment(article.createdAt).fromNow()}
                        </Typography>
                    </Stack>

                    {/* Content */}
                    <Box component="div" sx={{ px: 1.5, pb: 1 }}>
                        <Typography sx={{ fontSize: 13, color: '#333', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {article.articleContent || article.articleTitle}
                        </Typography>
                    </Box>

                    {/* Image */}
                    {article.articleImage && (
                        <Box component="div" sx={{ mx: 1.5, mb: 1, borderRadius: 2, overflow: 'hidden', height: 120 }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                    )}

                    {/* Footer */}
                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ px: 1.5, pb: 1.5 }}>
                        <Stack direction="row" alignItems="center" gap={0.25}>
                            <IconButton size="small" sx={{ p: 0.25, '&:hover': { color: '#FF4D8D' } }}>
                                <FavoriteBorderIcon sx={{ fontSize: 14, color: '#bbb' }} />
                            </IconButton>
                            <Typography sx={{ fontSize: 11, color: '#bbb' }}>{article.articleLikes}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={0.25}>
                            <IconButton size="small" sx={{ p: 0.25 }}>
                                <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: '#bbb' }} />
                            </IconButton>
                            <Typography sx={{ fontSize: 11, color: '#bbb' }}>{article.articleComments}</Typography>
                        </Stack>
                        <Box component="div" sx={{ flex: 1 }} />
                        <IconButton size="small" sx={{ p: 0.25, '&:hover': { color: '#FF4D8D' } }}>
                            <BookmarkBorderIcon sx={{ fontSize: 14, color: '#bbb' }} />
                        </IconButton>
                    </Stack>
                </Stack>
            </Link>
        );
    };

    // Mobile: horizontal scroll
    if (device === 'mobile') {
        return (
            <Stack sx={{ py: 4, background: '#fff' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, mb: 2 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{t('Community Highlights')}</Typography>
                    <Link href="/community?articleCategory=FREE">
                        <Typography sx={{ fontSize: 12, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer' }}>{t('View all')}</Typography>
                    </Link>
                </Stack>
                <Stack direction="row" gap={1.5} sx={{ px: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, pb: 1 }}>
                    {articles.slice(0, 4).map((a) => (
                        <Box key={a._id} component="div" sx={{ flexShrink: 0, width: 220 }}>
                            <ArticleCard article={a} />
                        </Box>
                    ))}
                </Stack>
            </Stack>
        );
    }

    // Desktop: grid layout
    return (
        <Stack sx={{ py: 7, px: 4, background: '#fff' }}>
            <Stack sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box component="div">
                        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', mb: 0.25 }}>{t('Community Board Highlights')}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#888' }}>{t('Real experiences from real customers')}</Typography>
                    </Box>
                    <Link href="/community?articleCategory=FREE">
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#FF4D8D' }}>{t('View all posts')}</Typography>
                            <Typography sx={{ color: '#FF4D8D' }}>→</Typography>
                        </Stack>
                    </Link>
                </Stack>

                {/* 3-column grid */}
                <Stack direction="row" gap={2}>
                    {articles.slice(0, 3).map((article) => (
                        <Box key={article._id} component="div" sx={{ flex: 1 }}>
                            <ArticleCard article={article} />
                        </Box>
                    ))}
                </Stack>
            </Stack>
        </Stack>
    );
};

export default CommunityHighlights;