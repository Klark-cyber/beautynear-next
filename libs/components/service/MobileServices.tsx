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
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
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
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_SERVICES } from '../../../apollo/user/query';
import { LIKE_TARGET_SERVICE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { Service } from '../../types/service/service';
import { ServiceType } from '../../enums/service.enum';
import { toggleSavedService, isServiceSaved } from '../../utils';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const CATEGORY_CHIPS = [
    { label: 'All', value: 'ALL', icon: <GridViewIcon sx={{ fontSize: 15 }} /> },
    { label: 'Hair', value: ServiceType.HAIR, icon: <ContentCutIcon sx={{ fontSize: 15 }} /> },
    { label: 'Nail', value: ServiceType.NAIL, icon: <BrushIcon sx={{ fontSize: 15 }} /> },
    { label: 'Skin', value: ServiceType.SKIN, icon: <SpaIcon sx={{ fontSize: 15 }} /> },
    { label: 'Clinic', value: ServiceType.CLINIC, icon: <AddModeratorOutlinedIcon sx={{ fontSize: 15 }} /> },
    { label: 'Massage', value: ServiceType.MASSAGE, icon: <SelfImprovementIcon sx={{ fontSize: 15 }} /> },
];

const SORT_OPTIONS: { key: 'createdAt' | 'serviceRank' | 'servicePrice'; label: string }[] = [
    { key: 'createdAt', label: 'Latest' },
    { key: 'serviceRank', label: 'Popular' },
    { key: 'servicePrice', label: 'Price' },
];

const EXPLORE_ITEMS = [
    { label: 'Salons', href: '/salons', icon: <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />, color: '#FF4D8D' },
    { label: 'Services', href: '/service', icon: <ContentCutOutlinedIcon sx={{ fontSize: 22 }} />, color: '#9B59B6' },
    { label: 'Specialists', href: '/specialist', icon: <Face3OutlinedIcon sx={{ fontSize: 22 }} />, color: '#2980B9' },
    { label: 'Community', href: '/community', icon: <ForumOutlinedIcon sx={{ fontSize: 22 }} />, color: '#F57C00' },
    { label: 'Saved', href: '/saved', icon: <BookmarkBorderIcon sx={{ fontSize: 22 }} />, color: '#3EA043' },
];

const limit = 8;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileServices = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [searchText, setSearchText] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [sortBy, setSortBy] = useState<'createdAt' | 'serviceRank' | 'servicePrice'>('createdAt');
    const [services, setServices] = useState<Service[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [exploreOpen, setExploreOpen] = useState(false);
    const [savedTick, setSavedTick] = useState(0);

    /** APOLLO REQUESTS **/
    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);

    const buildSearch = useCallback((): T => {
        const search: T = {};
        if (searchText.trim()) search.text = searchText.trim();
        if (activeCategory !== 'ALL') search.typeList = [activeCategory];
        return search;
    }, [searchText, activeCategory]);

    const { refetch, loading, error } = useQuery(GET_SERVICES, {
        fetchPolicy: 'cache-and-network', // ⚠️ TUZATILDI: avval network-only edi — har filtr bosilganda toliq tarmoq sorovi kutilardi, sekin his qilinardi
        variables: { input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } },
        onCompleted: (data: T) => {
            setServices(data?.getServices?.list ?? []);
            setTotal(data?.getServices?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        },
        onError: (err) => console.error('GET_SERVICES XATO:', err.message, err),
    });

    useEffect(() => {
        refetch({ input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
            setServices(data?.getServices?.list ?? []);
            setTotal(data?.getServices?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory, sortBy]);

    useEffect(() => {
        const timer = setTimeout(() => {
            refetch({ input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
                setServices(data?.getServices?.list ?? []);
                setTotal(data?.getServices?.metaCounter?.[0]?.total ?? 0);
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
            const more: Service[] = data?.getServices?.list ?? [];
            setServices((prev) => [...prev, ...more]);
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
        setSortBy('createdAt');
    };

    const likeHandler = async (id: string) => {
        try {
            if (!user?._id) return router.push('/account/join');
            await likeTargetService({ variables: { input: id } });
            setServices((prev) =>
                prev.map((s) =>
                    s._id === id
                        ? { ...s, meLiked: [{ memberId: user._id, likeRefId: id, myFavorite: !s.meLiked?.[0]?.myFavorite }] }
                        : s,
                ),
            );
        } catch (err) {
            console.log('ERROR, likeHandler:', err);
        }
    };

    const activeFilterCount = activeCategory !== 'ALL' ? 1 : 0;

    return (
        <Box component="div" id="mobile-services">
            {/* ═══ HEADER ═══ */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="sv-list-header">
                <IconButton className="sv-list-icon-btn" onClick={() => router.push('/')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography className="sv-list-title">{t('Services')}</Typography>
                <IconButton className="sv-list-icon-btn">
                    <Badge badgeContent={activeFilterCount} color="error">
                        <TuneIcon sx={{ fontSize: 20 }} />
                    </Badge>
                </IconButton>
            </Stack>

            {/* ═══ QIDIRUV ═══ */}
            <Box component="div" className="sv-list-search-wrap">
                <OutlinedInput
                    fullWidth
                    className="sv-list-search-input"
                    placeholder={t('Search services...')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 20 }} /></InputAdornment>}
                />
            </Box>

            {/* ═══ KATEGORIYA CHIP'LARI ═══ */}
            <Stack direction="row" className="sv-list-chip-row">
                {CATEGORY_CHIPS.map((c) => (
                    <Stack
                        key={c.value}
                        direction="row"
                        alignItems="center"
                        gap={0.5}
                        className={`sv-list-chip ${activeCategory === c.value ? 'active' : ''}`}
                        onClick={() => setActiveCategory(c.value)}
                    >
                        {c.icon}
                        <Typography className="sv-list-chip-label">{t(c.label)}</Typography>
                    </Stack>
                ))}
            </Stack>

            {/* ═══ SARALASH QATORI ═══ */}
            <Stack direction="row" className="sv-list-sort-row">
                {SORT_OPTIONS.map((opt) => (
                    <Box
                        key={opt.key}
                        component="div"
                        className={`sv-list-sort-chip ${sortBy === opt.key ? 'active' : ''}`}
                        onClick={() => setSortBy(opt.key)}
                    >
                        {t(opt.label)}
                    </Box>
                ))}
            </Stack>

            {/* ═══ NATIJALAR SARLAVHASI ═══ */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="sv-list-results-head">
                <Typography className="sv-list-results-count">
                    <b>{total}</b> {t('services found')}
                </Typography>
            </Stack>

            {/* ═══ XIZMATLAR RO'YXATI ═══ */}
            <Stack className="sv-list-list">
                {loading && services.length === 0 && (
                    <Stack gap={2}>
                        {[1, 2, 3].map((i) => (
                            <Stack key={i} direction="row" gap={1.5} className="sv-list-skeleton-card">
                                <Box component="div" className="sv-list-skeleton-img" />
                                <Stack sx={{ flex: 1 }} gap={0.75}>
                                    <Box component="div" className="sv-list-skeleton-line" sx={{ width: '70%' }} />
                                    <Box component="div" className="sv-list-skeleton-line" sx={{ width: '50%' }} />
                                    <Box component="div" className="sv-list-skeleton-line" sx={{ width: '40%' }} />
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>
                )}

                {!loading && services.length === 0 && (
                    <Stack alignItems="center" className="sv-list-empty">
                        <Typography className="sv-list-empty-emoji">{error ? '⚠️' : '✂️'}</Typography>
                        <Typography className="sv-list-empty-title">{error ? t('Something went wrong') : t('No services found')}</Typography>
                        {error ? (
                            <Typography sx={{ fontSize: 11, color: '#e53935', mt: 1, textAlign: 'center', px: 2 }}>{error.message}</Typography>
                        ) : (
                            <Typography className="sv-list-empty-desc">{t('Try adjusting your filters or search terms')}</Typography>
                        )}
                        <Box component="div" className="sv-list-empty-btn" onClick={clearFiltersHandler}>{t('Clear filters')}</Box>
                    </Stack>
                )}

                {services.map((svc) => {
                    const liked = svc.meLiked?.[0]?.myFavorite;
                    return (
                        <Stack key={svc._id} direction="row" gap={1.5} className="sv-list-card" onClick={() => router.push(`/service/${svc._id}`)}>
                            <Box component="div" className="sv-list-card-img" style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }}>
                                <IconButton className="sv-list-card-like" onClick={(e: any) => { e.stopPropagation(); likeHandler(svc._id); }}>
                                    {liked ? <FavoriteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />}
                                </IconButton>
                            </Box>

                            <Box component="div" className="sv-list-card-info">
                                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                                    <Box component="div" sx={{ minWidth: 0 }}>
                                        <Typography className="sv-list-card-title">{svc.serviceTitle}</Typography>
                                        <Stack direction="row" alignItems="center" gap={0.3}>
                                            <LocationOnIcon sx={{ fontSize: 11, color: '#aaa' }} />
                                            <Typography className="sv-list-card-sub">{svc.salonData?.salonTitle}</Typography>
                                        </Stack>
                                    </Box>
                                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc', flexShrink: 0 }} />
                                </Stack>

                                <Stack direction="row" alignItems="center" gap={0.75} className="sv-list-card-meta">
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
                                        <Typography className="sv-list-card-rating">{(svc.serviceRating ?? 0).toFixed(1)} ({svc.serviceComments ?? 0})</Typography>
                                    </Stack>
                                    <Typography className="sv-list-card-dur">• {svc.serviceDuration} {t('min')}</Typography>
                                </Stack>

                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                                    <Typography className="sv-list-price-tag">₩{formatPrice(svc.servicePrice)}</Typography>
                                    <IconButton size="small" onClick={(e: any) => { e.stopPropagation(); toggleSavedService(svc._id); setSavedTick((p) => p + 1); }}>
                                        {isServiceSaved(svc._id) ? (
                                            <BookmarkIcon sx={{ fontSize: 22, color: '#FF4D8D' }} />
                                        ) : (
                                            <BookmarkBorderIcon sx={{ fontSize: 22, color: '#ccc' }} />
                                        )}
                                    </IconButton>
                                </Stack>
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>

            {/* ═══ LOAD MORE ═══ */}
            {services.length > 0 && services.length < total && (
                <Box component="div" className="sv-list-load-more" onClick={loadMoreHandler}>
                    <RefreshIcon sx={{ fontSize: 16, className: loadingMore ? 'spin' : '' }} />
                    {loadingMore ? t('Loading...') : t('Load More')}
                </Box>
            )}

            {/* ═══ BOTTOM NAV ═══ */}
            <Stack direction="row" className="sv-list-bottom-nav">
                <Stack alignItems="center" className="sv-list-nav-item" onClick={() => router.push('/')}>
                    <HomeIcon sx={{ fontSize: 22 }} />
                    <Typography className="sv-list-nav-label">{t('Home')}</Typography>
                </Stack>
                <Stack alignItems="center" className="sv-list-nav-item active" onClick={() => setExploreOpen(true)}>
                    <AppsIcon sx={{ fontSize: 22 }} />
                    <Typography className="sv-list-nav-label">{t('Explore')}</Typography>
                </Stack>
                <Stack alignItems="center" className="sv-list-nav-item" onClick={() => router.push('/mypage?category=myFavorites')}>
                    <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                    <Typography className="sv-list-nav-label">{t('Favorites')}</Typography>
                </Stack>
                <Stack alignItems="center" className="sv-list-nav-item" onClick={() => router.push('/mypage')}>
                    <PersonIcon sx={{ fontSize: 22 }} />
                    <Typography className="sv-list-nav-label">{t('My Page')}</Typography>
                </Stack>
            </Stack>

            {/* ═══ EXPLORE MENYUSI ═══ */}
            {exploreOpen && (
                <Box component="div" className="sv-list-explore-backdrop" onClick={() => setExploreOpen(false)}>
                    <Stack className="sv-list-explore-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="sv-list-explore-head">
                            <Typography className="sv-list-explore-title">{t('Explore')}</Typography>
                            <IconButton onClick={() => setExploreOpen(false)}><CloseIcon /></IconButton>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} className="sv-list-explore-grid">
                            {EXPLORE_ITEMS.map((item) => (
                                <Stack
                                    key={item.href}
                                    alignItems="center"
                                    gap={0.75}
                                    className="sv-list-explore-item"
                                    onClick={() => { setExploreOpen(false); router.push(item.href); }}
                                >
                                    <Box component="div" className="sv-list-explore-icon" sx={{ background: `${item.color}18`, color: item.color }}>
                                        {item.icon}
                                    </Box>
                                    <Typography className="sv-list-explore-label">{t(item.label)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default MobileServices;