import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, OutlinedInput, InputAdornment, Badge } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import BrushIcon from '@mui/icons-material/Brush';
import SpaIcon from '@mui/icons-material/Spa';
import AddModeratorOutlinedIcon from '@mui/icons-material/AddModeratorOutlined';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
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
import { GET_AGENTS } from '../../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE, LIKE_TARGET_MEMBER } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const CATEGORY_CHIPS = [
    { label: 'All', value: 'ALL', icon: <GridViewIcon sx={{ fontSize: 15 }} /> },
    { label: 'Hair', value: 'HAIR', icon: <ContentCutIcon sx={{ fontSize: 15 }} /> },
    { label: 'Nail', value: 'NAIL', icon: <BrushIcon sx={{ fontSize: 15 }} /> },
    { label: 'Skin', value: 'SKIN', icon: <SpaIcon sx={{ fontSize: 15 }} /> },
    { label: 'Clinic', value: 'CLINIC', icon: <AddModeratorOutlinedIcon sx={{ fontSize: 15 }} /> },
    { label: 'Massage', value: 'MASSAGE', icon: <SelfImprovementIcon sx={{ fontSize: 15 }} /> },
];

const EXPLORE_ITEMS = [
    { label: 'Salons', href: '/salons', icon: <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />, color: '#FF4D8D' },
    { label: 'Services', href: '/service', icon: <ContentCutOutlinedIcon sx={{ fontSize: 22 }} />, color: '#9B59B6' },
    { label: 'Specialists', href: '/specialist', icon: <Face3OutlinedIcon sx={{ fontSize: 22 }} />, color: '#2980B9' },
    { label: 'Community', href: '/community', icon: <ForumOutlinedIcon sx={{ fontSize: 22 }} />, color: '#F57C00' },
    { label: 'Saved', href: '/saved', icon: <BookmarkBorderIcon sx={{ fontSize: 22 }} />, color: '#3EA043' },
];

// ⚠️ YANGI — avval "Sort by" faqat statik "Latest" matni edi, hech qanday
// vazifa bajarmasdi.
const SORT_LABELS = {
    createdAt: 'Latest',
    memberLikes: 'Most Liked',
    memberViews: 'Most Viewed',
    memberRank: 'Top Rated',
};

const limit = 8;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileSpecialists = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [searchText, setSearchText] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [sortBy, setSortBy] = useState<'createdAt' | 'memberLikes' | 'memberViews' | 'memberRank'>('createdAt');
    const [sortOpen, setSortOpen] = useState(false);
    const [specialists, setSpecialists] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [exploreOpen, setExploreOpen] = useState(false);

    /** APOLLO REQUESTS **/
    const [subscribe] = useMutation(SUBSCRIBE);
    const [unsubscribe] = useMutation(UNSUBSCRIBE);
    const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

    const buildSearch = useCallback((): T => {
        const search: T = {};
        if (searchText.trim()) search.text = searchText.trim();
        if (activeCategory !== 'ALL') search.memberSpecialty = [activeCategory];
        return search;
    }, [searchText, activeCategory]);

    const { refetch, loading, error } = useQuery(GET_AGENTS, {
        fetchPolicy: 'cache-and-network', // ⚠️ TUZATILDI: avval network-only edi — har filtr bosilganda toliq tarmoq sorovi kutilardi, sekin his qilinardi
        variables: { input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } },
        onCompleted: (data: T) => {
            setSpecialists(data?.getAgents?.list ?? []);
            setTotal(data?.getAgents?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        },
        onError: (err) => console.error('GET_AGENTS XATO:', err.message, err),
    });

    useEffect(() => {
        refetch({ input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
            setSpecialists(data?.getAgents?.list ?? []);
            setTotal(data?.getAgents?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory, sortBy]);

    useEffect(() => {
        const timer = setTimeout(() => {
            refetch({ input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
                setSpecialists(data?.getAgents?.list ?? []);
                setTotal(data?.getAgents?.metaCounter?.[0]?.total ?? 0);
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
            const { data } = await refetch({ input: { page: nextPage, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } });
            const more: any[] = data?.getAgents?.list ?? [];
            setSpecialists((prev) => [...prev, ...more]);
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
            await likeTargetMember({ variables: { input: id } });
            setSpecialists((prev) =>
                prev.map((s) =>
                    s._id === id ? { ...s, meLiked: [{ memberId: user._id, likeRefId: id, myFavorite: !s.meLiked?.[0]?.myFavorite }] } : s,
                ),
            );
        } catch (err) {
            console.log('ERROR, likeHandler:', err);
        }
    };

    const followHandler = async (id: string, isFollowing: boolean) => {
        try {
            if (!user?._id) return router.push('/account/join');
            if (isFollowing) await unsubscribe({ variables: { input: { followingId: id } } });
            else await subscribe({ variables: { input: { followingId: id } } });
            setSpecialists((prev) =>
                prev.map((s) =>
                    s._id === id
                        ? {
                            ...s,
                            meFollowed: [{ followingId: id, followerId: user._id, myFollowing: !isFollowing }],
                            // ⚠️ TUZATILDI: avval follower soni yangilanmasdi
                            memberFollowers: (s.memberFollowers ?? 0) + (isFollowing ? -1 : 1),
                        }
                        : s,
                ),
            );
        } catch (err) {
            console.log('ERROR, followHandler:', err);
        }
    };

    const activeFilterCount = activeCategory !== 'ALL' ? 1 : 0;

    return (
        <Box component="div" id="mobile-specialists">
            {/* ═══ HEADER ═══ */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="sp-header">
                <IconButton className="sp-icon-btn" onClick={() => router.push('/')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography className="sp-title">{t('Specialists')}</Typography>
                <IconButton className="sp-icon-btn">
                    <Badge badgeContent={activeFilterCount} color="error">
                        <TuneIcon sx={{ fontSize: 20 }} />
                    </Badge>
                </IconButton>
            </Stack>

            {/* ═══ QIDIRUV ═══ */}
            <Box component="div" className="sp-search-wrap">
                <OutlinedInput
                    fullWidth
                    className="sp-search-input"
                    placeholder={t('Search by name or specialty...')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 20 }} /></InputAdornment>}
                />
            </Box>

            {/* ═══ KATEGORIYA CHIP'LARI ═══ */}
            <Stack direction="row" className="sp-chip-row">
                {CATEGORY_CHIPS.map((c) => (
                    <Stack
                        key={c.value}
                        alignItems="center"
                        gap={0.5}
                        className={`sp-cat-item ${activeCategory === c.value ? 'active' : ''}`}
                        onClick={() => setActiveCategory(c.value)}
                    >
                        <Box component="div" className="sp-cat-circle">{c.icon}</Box>
                        <Typography className="sp-cat-label">{t(c.label)}</Typography>
                    </Stack>
                ))}
            </Stack>

            {/* ═══ SARALASH ═══ */}
            <Stack className="sp-sort-wrap">
                <Stack direction="row" alignItems="center" gap={0.3} className="sp-sort-row" onClick={() => setSortOpen((p) => !p)}>
                    <Typography className="sp-sort-label">{t('Sort by')}</Typography>
                    <Typography className="sp-sort-value">{t(SORT_LABELS[sortBy])}</Typography>
                    <KeyboardArrowDownIcon sx={{ fontSize: 16, color: '#888' }} />
                </Stack>
                {sortOpen && (
                    <Stack className="sp-sort-dropdown">
                        {(Object.keys(SORT_LABELS) as Array<keyof typeof SORT_LABELS>).map((key) => (
                            <Box
                                key={key}
                                component="div"
                                className={`sp-sort-option ${sortBy === key ? 'active' : ''}`}
                                onClick={() => { setSortBy(key); setSortOpen(false); }}
                            >
                                {t(SORT_LABELS[key])}
                            </Box>
                        ))}
                    </Stack>
                )}
            </Stack>

            {/* ═══ NATIJALAR SARLAVHASI ═══ */}
            <Typography className="sp-results-count">
                <b>{total}</b> {t('specialists found')}
            </Typography>

            {/* ═══ SPECIALIST RO'YXATI ═══ */}
            <Stack className="sp-list">
                {loading && specialists.length === 0 && (
                    <Stack gap={2}>
                        {[1, 2, 3].map((i) => (
                            <Stack key={i} direction="row" gap={1.5} className="sp-skeleton-card">
                                <Box component="div" className="sp-skeleton-avatar" />
                                <Stack sx={{ flex: 1 }} gap={0.75}>
                                    <Box component="div" className="sp-skeleton-line" sx={{ width: '60%' }} />
                                    <Box component="div" className="sp-skeleton-line" sx={{ width: '40%' }} />
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>
                )}

                {!loading && specialists.length === 0 && (
                    <Stack alignItems="center" className="sp-empty">
                        <Typography className="sp-empty-emoji">{error ? '⚠️' : '💇'}</Typography>
                        <Typography className="sp-empty-title">{error ? t('Something went wrong') : t('No specialists found')}</Typography>
                        <Box component="div" className="sp-empty-btn" onClick={clearFiltersHandler}>{t('Clear filters')}</Box>
                    </Stack>
                )}

                {specialists.map((sp) => {
                    const isFollowing = Boolean(sp.meFollowed?.[0]?.myFollowing);
                    return (
                        <Stack key={sp._id} className="sp-card" onClick={() => router.push(`/specialist/detail?id=${sp._id}`)}>
                            <Stack direction="row" gap={1.25}>
                                <Box component="div" className="sp-card-avatar" style={{ backgroundImage: `url(${imgUrl(sp.memberImage)})` }} />
                                <Box component="div" sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" alignItems="center" gap={0.5}>
                                        <Typography className="sp-card-name">{sp.memberNick}</Typography>
                                        <Box component="div" className="sp-agent-badge">{t('AGENT')}</Box>
                                    </Stack>
                                    <Typography className="sp-card-specialty">{(sp.memberSpecialty ?? []).join(' • ')}</Typography>
                                    <Stack direction="row" alignItems="center" gap={0.3} sx={{ mt: 0.5 }}>
                                        <StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
                                        <Typography className="sp-card-rating">{(sp.salonRating ?? 4.8).toFixed(1)} ({sp.memberViews ?? 0})</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <AccessTimeIcon sx={{ fontSize: 12, color: '#aaa' }} />
                                        <Typography className="sp-card-meta">{sp.memberExperience ?? 0} {t('years experience')}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <PeopleAltOutlinedIcon sx={{ fontSize: 12, color: '#aaa' }} />
                                        <Typography className="sp-card-meta">{sp.memberFollowers ?? 0} {t('followers')}</Typography>
                                    </Stack>
                                </Box>
                                <IconButton size="small" onClick={(e: any) => { e.stopPropagation(); likeHandler(sp._id); }}>
                                    {sp.meLiked?.[0]?.myFavorite ? (
                                        <FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                                    ) : (
                                        <FavoriteBorderIcon sx={{ fontSize: 18, color: '#ccc' }} />
                                    )}
                                </IconButton>
                            </Stack>

                            {sp.salonData && (
                                <Stack direction="row" alignItems="center" justifyContent="space-between" className="sp-salon-row">
                                    <Box sx={{ minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" gap={0.4}>
                                            <StorefrontOutlinedIcon sx={{ fontSize: 12, color: '#FF4D8D' }} />
                                            <Typography className="sp-salon-name">{sp.salonData.salonTitle}</Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" gap={0.3}>
                                            <LocationOnIcon sx={{ fontSize: 11, color: '#aaa' }} />
                                            <Typography className="sp-salon-addr">{sp.salonData.salonAddress}</Typography>
                                        </Stack>
                                    </Box>
                                    <Box
                                        component="div"
                                        className={`sp-follow-btn ${isFollowing ? 'following' : ''}`}
                                        onClick={(e: any) => { e.stopPropagation(); followHandler(sp._id, isFollowing); }}
                                    >
                                        {t(isFollowing ? 'Following' : 'Follow')}
                                    </Box>
                                </Stack>
                            )}
                        </Stack>
                    );
                })}
            </Stack>

            {/* ═══ LOAD MORE ═══ */}
            {specialists.length > 0 && specialists.length < total && (
                <Box component="div" className="sp-load-more" onClick={loadMoreHandler}>
                    <RefreshIcon sx={{ fontSize: 16, className: loadingMore ? 'spin' : '' }} />
                    {loadingMore ? t('Loading...') : t('Load More')}
                </Box>
            )}

            {/* ═══ BOTTOM NAV — Homepage bilan bir xil ═══ */}
            <Stack direction="row" className="sp-bottom-nav">
                <Stack alignItems="center" className="sp-nav-item" onClick={() => router.push('/')}>
                    <HomeIcon sx={{ fontSize: 22 }} />
                    <Typography className="sp-nav-label">{t('Home')}</Typography>
                </Stack>
                <Stack alignItems="center" className="sp-nav-item active" onClick={() => setExploreOpen(true)}>
                    <AppsIcon sx={{ fontSize: 22 }} />
                    <Typography className="sp-nav-label">{t('Explore')}</Typography>
                </Stack>
                <Stack alignItems="center" className="sp-nav-item" onClick={() => router.push('/mypage?category=myFavorites')}>
                    <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                    <Typography className="sp-nav-label">{t('Favorites')}</Typography>
                </Stack>
                <Stack alignItems="center" className="sp-nav-item" onClick={() => router.push('/mypage')}>
                    <PersonIcon sx={{ fontSize: 22 }} />
                    <Typography className="sp-nav-label">{t('My Page')}</Typography>
                </Stack>
            </Stack>

            {/* ═══ EXPLORE MENYUSI ═══ */}
            {exploreOpen && (
                <Box component="div" className="sp-explore-backdrop" onClick={() => setExploreOpen(false)}>
                    <Stack className="sp-explore-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="sp-explore-head">
                            <Typography className="sp-explore-title">{t('Explore')}</Typography>
                            <IconButton onClick={() => setExploreOpen(false)}><CloseIcon /></IconButton>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} className="sp-explore-grid">
                            {EXPLORE_ITEMS.map((item) => (
                                <Stack
                                    key={item.href}
                                    alignItems="center"
                                    gap={0.75}
                                    className="sp-explore-item"
                                    onClick={() => { setExploreOpen(false); router.push(item.href); }}
                                >
                                    <Box component="div" className="sp-explore-icon" sx={{ background: `${item.color}18`, color: item.color }}>
                                        {item.icon}
                                    </Box>
                                    <Typography className="sp-explore-label">{t(item.label)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default MobileSpecialists;