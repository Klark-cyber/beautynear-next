import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, OutlinedInput, InputAdornment, Switch, Badge } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import BrushIcon from '@mui/icons-material/Brush';
import SpaIcon from '@mui/icons-material/Spa';
import AddModeratorOutlinedIcon from '@mui/icons-material/AddModeratorOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StarIcon from '@mui/icons-material/Star';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
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
import { GET_SALONS } from '../../../apollo/user/query';
import { LIKE_TARGET_SALON } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { Salon } from '../../types/salon/salon';
import { SalonType, SalonLocation } from '../../enums/salon.enum';
import { isSalonOpen, toggleSavedSalon, isSalonSaved } from '../../utils';
import { getUserCoords, hasUserLocation, calcDistanceKm, formatDistance } from '../../geo';

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
    { label: 'Hair', value: SalonType.HAIR, icon: <ContentCutIcon sx={{ fontSize: 15 }} /> },
    { label: 'Nail', value: SalonType.NAIL, icon: <BrushIcon sx={{ fontSize: 15 }} /> },
    { label: 'Skin', value: SalonType.SKIN, icon: <SpaIcon sx={{ fontSize: 15 }} /> },
    { label: 'Clinic', value: SalonType.CLINIC, icon: <AddModeratorOutlinedIcon sx={{ fontSize: 15 }} /> },
    { label: 'More', value: 'MORE', icon: <MoreHorizIcon sx={{ fontSize: 15 }} /> },
];

const LOCATION_CHIPS = [
    { label: 'All Korea', value: 'ALL' },
    { label: 'Seoul', value: SalonLocation.SEOUL },
    { label: 'Busan', value: SalonLocation.BUSAN },
    { label: 'Daegu', value: SalonLocation.DAEGU },
    { label: 'Incheon', value: SalonLocation.INCHEON },
    { label: 'Jeju', value: SalonLocation.JEJU },
];

// ⚠️ YANGI — Homepage bilan bir xil Explore menyusi
const EXPLORE_ITEMS = [
    { label: 'Salons', href: '/salons', icon: <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />, color: '#FF4D8D' },
    { label: 'Services', href: '/service', icon: <ContentCutOutlinedIcon sx={{ fontSize: 22 }} />, color: '#9B59B6' },
    { label: 'Specialists', href: '/specialist', icon: <Face3OutlinedIcon sx={{ fontSize: 22 }} />, color: '#2980B9' },
    { label: 'Community', href: '/community', icon: <ForumOutlinedIcon sx={{ fontSize: 22 }} />, color: '#F57C00' },
    { label: 'Saved', href: '/saved', icon: <BookmarkBorderIcon sx={{ fontSize: 22 }} />, color: '#3EA043' },
];

const AVATARS_MINI = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80',
];

const limit = 8;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileSalons = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [searchText, setSearchText] = useState('');
    const [userCoords] = useState(() => (hasUserLocation() ? getUserCoords() : null));
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [activeLocation, setActiveLocation] = useState('ALL');
    const [openNow, setOpenNow] = useState(false);
    const [sortBy, setSortBy] = useState<'createdAt' | 'salonRank' | 'salonViews'>('createdAt');

    // ⚠️ YANGI — avval Homepage'dan yuborilgan ?input={"search":{"typeList":[...]}}
    // parametri BUTUNLAY e'tiborsiz qoldirilar edi, shuning uchun kategoriya
    // chip'idan (masalan "Nails") bosilganda filtr qo'llanilmasdi.
    useEffect(() => {
        if (!router.isReady || !router.query.input) return;
        try {
            const parsed = JSON.parse(router.query.input as string);
            const typeList = parsed?.search?.typeList;
            if (Array.isArray(typeList) && typeList.length > 0) {
                setActiveCategory(typeList[0]);
            }
        } catch (err) {
            console.log('ERROR, parsing ?input= param:', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.isReady, router.query.input]);
    const [salons, setSalons] = useState<Salon[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [exploreOpen, setExploreOpen] = useState(false);
    const [savedTick, setSavedTick] = useState(0); // ⚠️ bookmark bosilganda UI'ni yangilash uchun

    /** APOLLO REQUESTS **/
    const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);

    const buildSearch = useCallback((): T => {
        const search: T = {};
        if (searchText.trim()) search.text = searchText.trim();
        if (activeCategory !== 'ALL' && activeCategory !== 'MORE') search.typeList = [activeCategory];
        if (activeLocation !== 'ALL') search.locationList = [activeLocation];
        // ⚠️ TUZATILDI: avval localStorage'dagi geolokatsiya avtomatik
        // qo'shilar edi — ba'zi salonlarning salonLocation2d maydoni
        // hali noto'g'ri ([0,0]) bo'lgani uchun bu HECH QANDAY natija
        // qaytarmaslikka olib kelardi. Endi olib tashlandi — kerak
        // bo'lsa alohida "Near Me" filtri sifatida qo'shiladi.
        return search;
    }, [searchText, activeCategory, activeLocation]);

    const { refetch, loading, error } = useQuery(GET_SALONS, {
        fetchPolicy: 'cache-and-network', // ⚠️ TUZATILDI: avval network-only edi — har filtr bosilganda toliq tarmoq sorovi kutilardi, sekin his qilinardi
        variables: { input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } },
        onCompleted: (data: T) => {
            setSalons(data?.getSalons?.list ?? []);
            setTotal(data?.getSalons?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        },
        onError: (err) => {
            // ⚠️ TUZATILDI: avval xato jimgina yutilib, "0 salons found"
            // ko'rinardi — endi konsolga aniq chiqadi
            console.error('GET_SALONS XATO:', err.message, err);
        },
    });

    // Filtr o'zgarganda qayta so'rov
    useEffect(() => {
        refetch({ input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
            setSalons(data?.getSalons?.list ?? []);
            setTotal(data?.getSalons?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategory, activeLocation, sortBy]);

    // Qidiruv — debounce bilan
    useEffect(() => {
        const timer = setTimeout(() => {
            refetch({ input: { page: 1, limit, sort: sortBy, direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
                setSalons(data?.getSalons?.list ?? []);
                setTotal(data?.getSalons?.metaCounter?.[0]?.total ?? 0);
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
            const more: Salon[] = data?.getSalons?.list ?? [];
            setSalons((prev) => [...prev, ...more]);
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
        setActiveLocation('ALL');
        setOpenNow(false);
        setSortBy('createdAt');
    };

    const likeHandler = async (id: string) => {
        try {
            if (!user?._id) return router.push('/account/join');
            await likeTargetSalon({ variables: { input: id } });
            setSalons((prev) =>
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

    const activeFilterCount = [activeCategory !== 'ALL', activeLocation !== 'ALL', openNow].filter(Boolean).length;

    // "Open Now" — mahalliy filtrlash (backend'da hali mavjud emas)
    const visibleSalons = openNow ? salons.filter((s) => isSalonOpen(s.salonWorkHours)) : salons;

    return (
        <Box component="div" id="mobile-salons">
            {/* ═══ HEADER ═══ */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="ms-header">
                <IconButton className="ms-icon-btn" onClick={() => router.push('/')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography className="ms-title">{t('Salons')}</Typography>
                <IconButton className="ms-icon-btn">
                    <Badge badgeContent={activeFilterCount} color="error">
                        <TuneIcon sx={{ fontSize: 20 }} />
                    </Badge>
                </IconButton>
            </Stack>

            {/* ═══ QIDIRUV ═══ */}
            <Box component="div" className="ms-search-wrap">
                <OutlinedInput
                    fullWidth
                    className="ms-search-input"
                    placeholder={t('Search salons, specialists, services...')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 20 }} /></InputAdornment>}
                />
            </Box>

            {/* ═══ KATEGORIYA CHIP'LARI ═══ */}
            <Stack direction="row" className="ms-chip-row">
                {CATEGORY_CHIPS.map((c) => (
                    <Stack
                        key={c.value}
                        direction="row"
                        alignItems="center"
                        gap={0.5}
                        className={`ms-chip ${activeCategory === c.value ? 'active' : ''}`}
                        onClick={() => setActiveCategory(c.value)}
                    >
                        {c.icon}
                        <Typography className="ms-chip-label">{t(c.label)}</Typography>
                    </Stack>
                ))}
            </Stack>

            {/* ═══ JOYLASHUV CHIP'LARI ═══ */}
            <Stack direction="row" className="ms-chip-row">
                {LOCATION_CHIPS.map((l) => (
                    <Stack
                        key={l.value}
                        direction="row"
                        alignItems="center"
                        gap={0.5}
                        className={`ms-chip ${activeLocation === l.value ? 'active' : ''}`}
                        onClick={() => setActiveLocation(l.value)}
                    >
                        {l.value === 'ALL' && <LocationOnIcon sx={{ fontSize: 14 }} />}
                        <Typography className="ms-chip-label">{t(l.label)}</Typography>
                    </Stack>
                ))}
            </Stack>

            {/* ═══ FILTR QATORI ═══ */}
            <Stack direction="row" alignItems="center" className="ms-filter-bar">
                <Stack direction="row" alignItems="center" gap={0.3} className="ms-filter-item">
                    <Typography className="ms-filter-label">{t('Price')}</Typography>
                    <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                </Stack>
                <Stack
                    direction="row"
                    alignItems="center"
                    gap={0.3}
                    className="ms-filter-item"
                    onClick={() => setSortBy(sortBy === 'createdAt' ? 'salonRank' : sortBy === 'salonRank' ? 'salonViews' : 'createdAt')}
                >
                    <Typography className="ms-filter-label">
                        {t('Sort')}: {t(sortBy === 'createdAt' ? 'Latest' : sortBy === 'salonRank' ? 'Popular' : 'Most Viewed')}
                    </Typography>
                    <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.3} className="ms-filter-item">
                    <Typography className="ms-filter-label">{t('Open Now')}</Typography>
                    <Switch size="small" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5} className="ms-filter-item ms-filter-btn">
                    <TuneIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
                    <Typography className="ms-filter-label pink">{t('Filters')}</Typography>
                    {activeFilterCount > 0 && <Box component="div" className="ms-filter-badge">{activeFilterCount}</Box>}
                </Stack>
            </Stack>

            {/* ═══ NATIJALAR SARLAVHASI ═══ */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="ms-results-head">
                <Typography className="ms-results-count">
                    <b>{total}</b> {t('salons found')}
                </Typography>
                <Stack direction="row" alignItems="center" gap={0.3}>
                    <Typography className="ms-sort-label">{t('Sort by')}</Typography>
                    <Box component="div" className="ms-sort-pill">
                        {t(sortBy === 'createdAt' ? 'Latest' : sortBy === 'salonRank' ? 'Popular' : 'Most Viewed')} <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
                    </Box>
                </Stack>
            </Stack>

            {/* ═══ SALON RO'YXATI ═══ */}
            <Stack className="ms-list">
                {loading && salons.length === 0 && (
                    <Stack gap={2}>
                        {[1, 2, 3].map((i) => (
                            <Stack key={i} direction="row" gap={1.5} className="ms-skeleton-card">
                                <Box component="div" className="ms-skeleton-img" />
                                <Stack sx={{ flex: 1 }} gap={0.75}>
                                    <Box component="div" className="ms-skeleton-line" sx={{ width: '70%' }} />
                                    <Box component="div" className="ms-skeleton-line" sx={{ width: '50%' }} />
                                    <Box component="div" className="ms-skeleton-line" sx={{ width: '40%' }} />
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>
                )}

                {!loading && visibleSalons.length === 0 && (
                    <Stack alignItems="center" className="ms-empty">
                        <Typography className="ms-empty-emoji">💇‍♀️</Typography>
                        <Typography className="ms-empty-title">{error ? t('Something went wrong') : t('No salons found')}</Typography>
                        {error ? (
                            <Typography sx={{ fontSize: 11, color: '#e53935', mt: 1, textAlign: 'center', px: 2 }}>{error.message}</Typography>
                        ) : (
                            <Typography className="ms-empty-desc">{t('Try adjusting your filters or search terms')}</Typography>
                        )}
                        <Box component="div" className="ms-empty-btn" onClick={clearFiltersHandler}>{t('Clear filters')}</Box>
                    </Stack>
                )}

                {visibleSalons.map((salon) => {
                    const liked = salon.meLiked?.[0]?.myFavorite;
                    const open = isSalonOpen(salon.salonWorkHours);
                    return (
                        <Stack key={salon._id} direction="row" gap={1.5} className="ms-card" onClick={() => router.push(`/salons/${salon._id}`)}>
                            <Box component="div" className="ms-card-img" style={{ backgroundImage: `url(${imgUrl(salon.salonImages?.[0])})` }}>
                                <Box component="div" className={`ms-badge-status ${open ? 'open' : 'closed'}`}>{t(open ? 'Open' : 'Closed')}</Box>
                                <IconButton className="ms-card-like" onClick={(e: any) => { e.stopPropagation(); likeHandler(salon._id); }}>
                                    {liked ? <FavoriteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />}
                                </IconButton>
                                {!!salon.salonImages?.length && (
                                    <Stack direction="row" alignItems="center" gap={0.3} className="ms-photo-count">
                                        <ImageOutlinedIcon sx={{ fontSize: 11 }} />
                                        <Typography>{salon.salonImages.length}</Typography>
                                    </Stack>
                                )}
                            </Box>

                            <Box component="div" className="ms-card-info">
                                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                                    <Box component="div" sx={{ minWidth: 0 }}>
                                        <Typography className="ms-card-title">{salon.salonTitle}</Typography>
                                        <Typography className="ms-card-sub">{t(salon.salonType)} • {salon.salonAddress}</Typography>
                                    </Box>
                                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc', flexShrink: 0 }} />
                                </Stack>

                                <Stack direction="row" alignItems="center" gap={0.75} className="ms-card-meta">
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
                                        <Typography className="ms-card-rating">{(salon.salonRating ?? 0).toFixed(1)} ({salon.salonLikes ?? 0})</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.2}>
                                        <LocationOnIcon sx={{ fontSize: 12, color: '#aaa' }} />
                                        <Typography className="ms-card-dist">
                                            {userCoords ? formatDistance(calcDistanceKm(userCoords.lat, userCoords.lng, salon.salonLatitude, salon.salonLongitude)) || '—' : '—'}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                                    <Box component="div" className="ms-deposit-pill">{t('Deposit')} ₩{formatPrice(salon.depositAmount ?? 10000)}</Box>
                                    <IconButton size="small" onClick={(e: any) => { e.stopPropagation(); toggleSavedSalon(salon._id); setSavedTick((p) => p + 1); }}>
                                        {isSalonSaved(salon._id) ? (
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

            {/* ═══ "Can't find the right salon?" ═══ */}
            {visibleSalons.length > 0 && (
                <Box component="div" className="ms-recommend-banner">
                    <Box component="div" className="ms-recommend-left">
                        <Typography className="ms-recommend-title">{t("Can't find the right salon?")}</Typography>
                        <Typography className="ms-recommend-desc">{t('Let us help you find the perfect salon for your needs.')}</Typography>
                        <Box component="div" className="ms-recommend-btn" onClick={() => router.push('/community')}>{t('Get Recommendation')}</Box>
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1.5 }}>
                            <Stack direction="row" className="ms-mini-avatars">
                                {AVATARS_MINI.map((src, i) => (
                                    <Box key={i} component="div" className={`ms-mini-av av${i}`}><img src={src} alt="" /></Box>
                                ))}
                            </Stack>
                            <Typography className="ms-mini-count">+12K</Typography>
                        </Stack>
                    </Box>
                    <Box component="div" className="ms-recommend-map">
                        <Box component="div" className="ms-map-center">🌸</Box>
                        <LocationOnIcon className="pin pin1" />
                        <LocationOnIcon className="pin pin2" />
                        <LocationOnIcon className="pin pin3" />
                    </Box>
                </Box>
            )}

            {/* ═══ LOAD MORE ═══ */}
            {visibleSalons.length > 0 && visibleSalons.length < total && (
                <Box component="div" className="ms-load-more" onClick={loadMoreHandler}>
                    <RefreshIcon sx={{ fontSize: 16, className: loadingMore ? 'spin' : '' }} />
                    {loadingMore ? t('Loading...') : t('Load More')}
                </Box>
            )}

            {/* ═══ BOTTOM NAV — Homepage bilan bir xil ═══ */}
            <Stack direction="row" className="ms-bottom-nav">
                <Stack alignItems="center" className="ms-nav-item" onClick={() => router.push('/')}>
                    <HomeIcon sx={{ fontSize: 22 }} />
                    <Typography className="ms-nav-label">{t('Home')}</Typography>
                </Stack>
                <Stack alignItems="center" className="ms-nav-item active" onClick={() => setExploreOpen(true)}>
                    <AppsIcon sx={{ fontSize: 22 }} />
                    <Typography className="ms-nav-label">{t('Explore')}</Typography>
                </Stack>
                <Stack alignItems="center" className="ms-nav-item" onClick={() => router.push('/mypage?category=myFavorites')}>
                    <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                    <Typography className="ms-nav-label">{t('Favorites')}</Typography>
                </Stack>
                <Stack alignItems="center" className="ms-nav-item" onClick={() => router.push('/mypage')}>
                    <PersonIcon sx={{ fontSize: 22 }} />
                    <Typography className="ms-nav-label">{t('My Page')}</Typography>
                </Stack>
            </Stack>

            {/* ═══ EXPLORE MENYUSI ═══ */}
            {exploreOpen && (
                <Box component="div" className="ms-explore-backdrop" onClick={() => setExploreOpen(false)}>
                    <Stack className="ms-explore-sheet" onClick={(e: any) => e.stopPropagation()}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" className="ms-explore-head">
                            <Typography className="ms-explore-title">{t('Explore')}</Typography>
                            <IconButton onClick={() => setExploreOpen(false)}><CloseIcon /></IconButton>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" gap={1.5} className="ms-explore-grid">
                            {EXPLORE_ITEMS.map((item) => (
                                <Stack
                                    key={item.href}
                                    alignItems="center"
                                    gap={0.75}
                                    className="ms-explore-item"
                                    onClick={() => { setExploreOpen(false); router.push(item.href); }}
                                >
                                    <Box component="div" className="ms-explore-icon" sx={{ background: `${item.color}18`, color: item.color }}>
                                        {item.icon}
                                    </Box>
                                    <Typography className="ms-explore-label">{t(item.label)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default MobileSalons;