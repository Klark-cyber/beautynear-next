import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, OutlinedInput, InputAdornment } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import AppsIcon from '@mui/icons-material/Apps';
import PersonIcon from '@mui/icons-material/Person';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import Face3OutlinedIcon from '@mui/icons-material/Face3Outlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const CATEGORY_CHIPS = [
    { label: 'All', value: 'ALL', icon: <GridViewIcon sx={{ fontSize: 14 }} /> },
    { label: 'Recommend', value: 'RECOMMEND', icon: <FavoriteIcon sx={{ fontSize: 14 }} /> },
    { label: 'News', value: 'NEWS', icon: <ArticleOutlinedIcon sx={{ fontSize: 14 }} /> },
    { label: 'Humor', value: 'HUMOR', icon: <Typography sx={{ fontSize: 13 }}>😄</Typography> },
];

const CATEGORY_COLORS: Record<string, string> = {
    RECOMMEND: '#FF4D8D',
    NEWS: '#2980B9',
    HUMOR: '#F5A623',
    FREE: '#888',
};

const EXPLORE_ITEMS = [
    { label: 'Salons', href: '/salons', icon: <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />, color: '#FF4D8D' },
    { label: 'Services', href: '/service', icon: <ContentCutOutlinedIcon sx={{ fontSize: 22 }} />, color: '#9B59B6' },
    { label: 'Specialists', href: '/specialist', icon: <Face3OutlinedIcon sx={{ fontSize: 22 }} />, color: '#2980B9' },
    { label: 'Community', href: '/community', icon: <ForumOutlinedIcon sx={{ fontSize: 22 }} />, color: '#F57C00' },
    { label: 'Saved', href: '/saved', icon: <BookmarkBorderIcon sx={{ fontSize: 22 }} />, color: '#3EA043' },
];

const limit = 8;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileCommunity = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [searchText, setSearchText] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [articles, setArticles] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [exploreOpen, setExploreOpen] = useState(false);

    /** APOLLO REQUESTS **/
    const [likeTargetArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

    const buildSearch = useCallback((): T => {
        const search: T = {};
        if (searchText.trim()) search.text = searchText.trim();
        if (activeCategory !== 'ALL') search.articleCategory = activeCategory;
        return search;
    }, [searchText, activeCategory]);

    const { refetch, loading, error } = useQuery(GET_BOARD_ARTICLES, {
        fetchPolicy: 'cache-and-network', // ⚠️ TUZATILDI: avval network-only edi — har filtr bosilganda toliq tarmoq sorovi kutilardi, sekin his qilinardi
        variables: { input: { page: 1, limit, sort: 'createdAt', direction: 'DESC', search: buildSearch() } },
        onCompleted: (data: T) => {
            setArticles(data?.getBoardArticles?.list ?? []);
            setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        },
        onError: (err) => console.error('GET_BOARD_ARTICLES XATO:', err.message, err),
    });

    useEffect(() => {
        refetch({ input: { page: 1, limit, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
            setArticles(data?.getBoardArticles?.list ?? []);
            setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory]);

    useEffect(() => {
        const timer = setTimeout(() => {
            refetch({ input: { page: 1, limit, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
                setArticles(data?.getBoardArticles?.list ?? []);
                setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
                setPage(1);
            });
        }, 450);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText]);

    /** HANDLERS **/
    const loadMoreHandler = async () => {
        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const { data } = await refetch({ input: { page: nextPage, limit, sort: 'createdAt', direction: 'DESC', search: buildSearch() } });
            const more: any[] = data?.getBoardArticles?.list ?? [];
            setArticles((prev) => [...prev, ...more]);
            setPage(nextPage);
        } catch (err) {
            console.log('ERROR, loadMoreHandler:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    const clearFiltersHandler = () => {
        setSearchText('');
        setActiveCategory('ALL');
    };

    const likeHandler = async (id: string) => {
        try {
            if (!user?._id) return router.push('/account/join');
            await likeTargetArticle({ variables: { input: id } });
            setArticles((prev) =>
                prev.map((a) =>
                    a._id === id
                        ? {
                            ...a,
                            meLiked: [{ memberId: user._id, likeRefId: id, myFavorite: !a.meLiked?.[0]?.myFavorite }],
                            articleLikes: (a.articleLikes ?? 0) + (a.meLiked?.[0]?.myFavorite ? -1 : 1),
                        }
                        : a,
                ),
            );
        } catch (err) {
            console.log('ERROR, likeHandler:', err);
        }
    };

    return (
        <Box component="div" id="mobile-community">
            {/* ═══ HEADER ═══ */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="cm-header">
                <IconButton className="cm-icon-btn" onClick={() => router.push('/')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography className="cm-title">{t('Community')}</Typography>
                <Box sx={{ width: 38 }} />
            </Stack>

            {/* ═══ QIDIRUV ═══ */}
            <Box component="div" className="cm-search-wrap">
                <OutlinedInput
                    fullWidth
                    className="cm-search-input"
                    placeholder={t('Search articles...')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 20 }} /></InputAdornment>}
                />
            </Box>

            {/* ═══ KATEGORIYA CHIP'LARI ═══ */}
            <Stack direction="row" className="cm-chip-row">
                {CATEGORY_CHIPS.map((c) => (
                    <Stack
                        key={c.value}
                        direction="row"
                        alignItems="center"
                        gap={0.5}
                        className={`cm-chip ${activeCategory === c.value ? 'active' : ''}`}
                        onClick={() => setActiveCategory(c.value)}
                    >
                        {c.icon}
                        <Typography className="cm-chip-label">{t(c.label)}</Typography>
                    </Stack>
                ))}
            </Stack>

            {/* ═══ MAQOLALAR RO'YXATI ═══ */}
            <Stack className="cm-list">
                {loading && articles.length === 0 && (
                    <Stack gap={2}>
                        {[1, 2, 3].map((i) => (
                            <Stack key={i} className="cm-skeleton-card" gap={1}>
                                <Box component="div" className="cm-skeleton-line" sx={{ width: '40%', height: 10 }} />
                                <Box component="div" className="cm-skeleton-line" sx={{ width: '80%', height: 16 }} />
                                <Box component="div" className="cm-skeleton-line" sx={{ width: '100%', height: 60 }} />
                            </Stack>
                        ))}
                    </Stack>
                )}

                {!loading && articles.length === 0 && (
                    <Stack alignItems="center" className="cm-empty">
                        <Typography className="cm-empty-emoji">{error ? '⚠️' : '📝'}</Typography>
                        <Typography className="cm-empty-title">{error ? t('Something went wrong') : t('No articles found')}</Typography>
                        <Box component="div" className="cm-empty-btn" onClick={clearFiltersHandler}>{t('Clear filters')}</Box>
                    </Stack>
                )}

                {articles.map((a) => {
                    const liked = a.meLiked?.[0]?.myFavorite;
                    const catColor = CATEGORY_COLORS[a.articleCategory] ?? '#888';
                    return (
                        <Stack key={a._id} className="cm-card" onClick={() => router.push(`/community/detail?id=${a._id}`)}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" gap={0.75}>
                                    <Box component="div" className="cm-avatar" style={{ backgroundImage: `url(${imgUrl(a.memberData?.memberImage)})` }} />
                                    <Box>
                                        <Typography className="cm-author">{a.memberData?.memberNick}</Typography>
                                        <Typography className="cm-time">{moment(a.createdAt).fromNow()}</Typography>
                                    </Box>
                                </Stack>
                                <Box component="div" className="cm-cat-badge" sx={{ background: `${catColor}18`, color: catColor }}>
                                    {t(a.articleCategory)}
                                </Box>
                            </Stack>

                            <Stack direction="row" gap={1.5} sx={{ mt: 1 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography className="cm-card-title">{a.articleTitle}</Typography>
                                    <Typography className="cm-card-preview">{a.articleContent}</Typography>
                                </Box>
                                {a.articleImage && (
                                    <Box component="div" className="cm-card-thumb" style={{ backgroundImage: `url(${imgUrl(a.articleImage)})` }} />
                                )}
                            </Stack>

                            <Stack direction="row" alignItems="center" justifyContent="space-between" className="cm-card-footer">
                                <Stack direction="row" alignItems="center" gap={1.5}>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <FavoriteBorderIcon sx={{ fontSize: 14, color: '#aaa' }} />
                                        <Typography className="cm-meta-text">{a.articleLikes ?? 0}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <ChatBubbleOutlineIcon sx={{ fontSize: 13, color: '#aaa' }} />
                                        <Typography className="cm-meta-text">{a.articleComments ?? 0}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <RemoveRedEyeOutlinedIcon sx={{ fontSize: 14, color: '#aaa' }} />
                                        <Typography className="cm-meta-text">{a.articleViews ?? 0}</Typography>
                                    </Stack>
                                </Stack>
                                <IconButton size="small" onClick={(e: any) => { e.stopPropagation(); likeHandler(a._id); }}>
                                    {liked ? <FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 18, color: '#ccc' }} />}
                                </IconButton>
                            </Stack>
                        </Stack>
                    );
                })}
            </Stack>

            {/* ═══ LOAD MORE ═══ */}
            {articles.length > 0 && articles.length < total && (
                <Box component="div" className="cm-load-more" onClick={loadMoreHandler}>
                    <RefreshIcon sx={{ fontSize: 16, className: loadingMore ? 'spin' : '' }} />
                    {loadingMore ? t('Loading...') : t('Load More')}
                </Box>
            )}

            {/* ═══ BOTTOM NAV ═══ */}
            <Stack direction="row" className="cm-bottom-nav">
                <Stack alignItems="center" className="cm-nav-item" onClick={() => router.push('/')}>
                    <HomeIcon sx={{ fontSize: 22 }} />
                    <Typography className="cm-nav-label">{t('Home')}</Typography>
                </Stack>
                <Stack alignItems="center" className="cm-nav-item active" onClick={() => setExploreOpen(true)}>
                    <AppsIcon sx={{ fontSize: 22 }} />
                    <Typography className="cm-nav-label">{t('Explore')}</Typography>
                </Stack>
                <Stack alignItems="center" className="cm-nav-item" onClick={() => router.push('/mypage?category=myFavorites')}>
                    <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                    <Typography className="cm-nav-label">{t('Favorites')}</Typography>
                </Stack>
                <Stack alignItems="center" className="cm-nav-item" onClick={() => router.push('/mypage')}>
                    <PersonIcon sx={{ fontSize: 22 }} />
                    <Typography className="cm-nav-label">{t('My Page')}</Typography>
                </Stack>
            </Stack>

            {/* ═══ EXPLORE MENYUSI ═══ */}
            {exploreOpen && (
                <Box component="div" className="cm-explore-backdrop" onClick={() => setExploreOpen(false)}>
                    <Stack className="cm-explore-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="cm-explore-head">
                            <Typography className="cm-explore-title">{t('Explore')}</Typography>
                            <IconButton onClick={() => setExploreOpen(false)}><CloseIcon /></IconButton>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} className="cm-explore-grid">
                            {EXPLORE_ITEMS.map((item) => (
                                <Stack
                                    key={item.href}
                                    alignItems="center"
                                    gap={0.75}
                                    className="cm-explore-item"
                                    onClick={() => { setExploreOpen(false); router.push(item.href); }}
                                >
                                    <Box component="div" className="cm-explore-icon" sx={{ background: `${item.color}18`, color: item.color }}>
                                        {item.icon}
                                    </Box>
                                    <Typography className="cm-explore-label">{t(item.label)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default MobileCommunity;