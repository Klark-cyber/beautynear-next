import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import {
    Stack, Box, Typography, Button, OutlinedInput,
    Select, MenuItem, InputAdornment, Drawer,
    Checkbox, Radio, RadioGroup, FormControlLabel,
    Slider, Collapse, IconButton,
} from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import Pagination from '../../libs/components/common/Pagination';
import EmptyList from '../../libs/components/common/Emptylist';
import RatingStars from '../../libs/components/common/Ratingstars';
import { GET_SERVICES } from '../../apollo/user/query';
import { LIKE_TARGET_SERVICE } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Service } from '../../libs/types/service/service';
import { ServicesInquiry } from '../../libs/types/service/service.input';
import { ServiceType } from '../../libs/enums/service.enum';
import { SalonLocation } from '../../libs/enums/salon.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { isSalonOpen } from '../../libs/utils';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import Link from 'next/link';

export const getServerSideProps = async ({ locale, query }: any) => {
    const input = query?.input ? JSON.parse(query.input) : null;
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
            initialInput: input ?? {
                page: 1, limit: 9,
                sort: 'createdAt',
                direction: Direction.DESC,
                search: {},
            },
        },
    };
};

const LOCATIONS = Object.values(SalonLocation);
const TYPES = Object.values(ServiceType);
const TYPE_EMOJI: Record<string, string> = {
    FACIAL: '🧖‍♀️', NAIL: '💅', HAIR: '✂️',
    MASSAGE: '🪷', CLINIC: '💉', BOTOX: '💉',
};
const SORT_OPTIONS = [
    { value: 'createdAt', label: 'Latest' },
    { value: 'serviceLikes', label: 'Most Popular' },
    { value: 'serviceRank', label: 'Top Rated' },
    { value: 'servicePriceAsc', label: 'Price ↑' },
    { value: 'servicePriceDesc', label: 'Price ↓' },
];
const TYPE_CHIPS = [
    { value: null, label: 'All' },
    ...Object.values(ServiceType).map((t) => ({ value: t, label: t })),
];
const DURATION_OPTIONS = [
    { label: 'Under 30 min', max: 30 },
    { label: '30 - 60 min', max: 60 },
    { label: '60 - 90 min', max: 90 },
    { label: '90+ min', max: 999 },
];
const RATINGS = [
    { value: 4.5, label: '4.5 & above' },
    { value: 4.0, label: '4.0 & above' },
    { value: 3.5, label: '3.5 & above' },
];

// ── Filter section collapsible ────────────────────────────────────────────────
const FilterSection = ({ title, icon, children }: any) => {
    const [open, setOpen] = useState(true);
    return (
        <Box component="div" className="filter-section">
            <Stack direction="row" justifyContent="space-between" alignItems="center"
                onClick={() => setOpen(!open)} className="filter-section-header">
                <Typography className="filter-section-title">
                    {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{title}
                </Typography>
                {open ? <ExpandLessIcon sx={{ fontSize: 16, color: '#888' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#888' }} />}
            </Stack>
            <Collapse in={open}>
                <Box component="div" className="filter-section-body">{children}</Box>
            </Collapse>
        </Box>
    );
};

const Services: NextPage = ({ initialInput }: any) => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const user = useReactiveVar(userVar);

    const [searchFilter, setSearchFilter] = useState<ServicesInquiry>(initialInput);
    const [services, setServices] = useState<Service[]>([]);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [activeTypeChip, setActiveTypeChip] = useState<ServiceType | null>(null);
    const [activeSort, setActiveSort] = useState('createdAt');
    const [priceRange, setPriceRange] = useState<number[]>([10000, 500000]);
    const [minRating, setMinRating] = useState<number | null>(null);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    /** APOLLO **/
    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);

    const { refetch } = useQuery(GET_SERVICES, {
        fetchPolicy: 'network-only',
        variables: { input: searchFilter },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setServices(data?.getServices?.list ?? []);
            setTotal(data?.getServices?.metaCounter?.[0]?.total ?? 0);
        },
    });

    /** LIFECYCLES **/
    useEffect(() => {
        if (router.query.input) setSearchFilter(JSON.parse(router.query.input as string));
    }, [router.query.input]);

    useEffect(() => {
        if (searchFilter?.search?.typeList?.length === 0) {
            const updated = { ...searchFilter };
            delete updated.search.typeList;
            setSearchFilter(updated);
            router.push(`/services?input=${JSON.stringify(updated)}`, undefined, { scroll: false }).then();
        }
    }, [searchFilter]);

    /** HANDLERS **/
    const likeHandler = useCallback(async (id: string) => {
        try {
            if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
            await likeTargetService({ variables: { input: id } });
            await refetch({ input: searchFilter });
            await sweetTopSmallSuccessAlert('success', 800);
        } catch (err: any) {
            sweetMixinErrorAlert(err.message).then();
        }
    }, [user, searchFilter]);

    const pushFilter = useCallback(async (updated: ServicesInquiry) => {
        setSearchFilter(updated);
        await router.push(`/services?input=${JSON.stringify(updated)}`, undefined, { scroll: false });
    }, []);

    const searchHandler = useCallback(async () => {
        const updated = { ...searchFilter, search: { ...searchFilter.search, text: searchText }, page: 1 };
        await pushFilter(updated);
    }, [searchText, searchFilter]);

    const typeChipHandler = useCallback(async (type: ServiceType | null) => {
        setActiveTypeChip(type);
        const search = { ...searchFilter.search };
        if (type) search.typeList = [type];
        else delete search.typeList;
        await pushFilter({ ...searchFilter, search, page: 1 });
    }, [searchFilter]);

    const sortHandler = useCallback(async (sort: string) => {
        setActiveSort(sort);
        await pushFilter({ ...searchFilter, sort, page: 1 });
    }, [searchFilter]);

    const locationHandler = useCallback(async (location: SalonLocation) => {
        const search = { ...searchFilter.search };
        if (location === SalonLocation.ALL) delete search.locationList;
        else search.locationList = [location];
        await pushFilter({ ...searchFilter, search, page: 1 });
    }, [searchFilter]);

    const typeFilterHandler = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const current = searchFilter.search.typeList ?? [];
        const typeList = checked
            ? [...current, value as ServiceType]
            : current.filter((t) => t !== value);
        const search = { ...searchFilter.search };
        if (typeList.length) search.typeList = typeList;
        else delete search.typeList;
        await pushFilter({ ...searchFilter, search, page: 1 });
    }, [searchFilter]);

    const priceHandler = useCallback(async (values: number[]) => {
        await pushFilter({
            ...searchFilter,
            search: { ...searchFilter.search, priceMin: values[0], priceMax: values[1] },
            page: 1,
        });
    }, [searchFilter]);

    const durationHandler = useCallback(async (max: number) => {
        await pushFilter({
            ...searchFilter,
            search: { ...searchFilter.search, durationMax: max },
            page: 1,
        });
    }, [searchFilter]);

    const resetHandler = useCallback(async () => {
        setSearchText('');
        setPriceRange([10000, 500000]);
        setMinRating(null);
        setActiveTypeChip(null);
        setActiveSort('createdAt');
        await pushFilter(initialInput);
    }, [initialInput]);

    const pageHandler = useCallback(async (page: number) => {
        await pushFilter({ ...searchFilter, page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [searchFilter]);

    // ── Service Card ────────────────────────────────────────────────────────────
    const ServiceCard = ({ svc }: { svc: Service }) => {
        const img = svc.serviceImages?.[0] ? `${REACT_APP_API_URL}/${svc.serviceImages[0]}` : '/img/banner/default.jpg';
        const liked = svc.meLiked?.[0]?.myFavorite;

        return (
            <Stack className="service-card">
                {/* Image */}
                <Box component="div" className="service-card-img"
                    style={{ backgroundImage: `url(${img})` }}
                    onClick={() => router.push(`/services/${svc._id}`)}>
                    <Box component="div" className="trending-badge">
                        <WhatshotIcon sx={{ fontSize: 11 }} />
                        <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{t('Trending')}</Typography>
                    </Box>
                    <IconButton className={`like-btn ${liked ? 'liked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); likeHandler(svc._id); }}>
                        {liked ? <FavoriteIcon sx={{ fontSize: 15, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 15 }} />}
                    </IconButton>
                    <Stack direction="row" alignItems="center" gap={0.5} className="views-overlay">
                        <RemoveRedEyeIcon sx={{ fontSize: 12 }} />
                        <Typography sx={{ fontSize: 11 }}>
                            {svc.serviceViews >= 1000 ? `${(svc.serviceViews / 1000).toFixed(1)}K` : svc.serviceViews}
                        </Typography>
                    </Stack>
                </Box>

                {/* Info */}
                <Box component="div" className="service-card-info">
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                        <Typography className="service-name" onClick={() => router.push(`/services/${svc._id}`)}>
                            {svc.serviceTitle}
                        </Typography>
                        <RatingStars rating={svc.serviceRating || 4.9} size="small" showNumber />
                    </Stack>

                    {svc.salonData && (
                        <Link href={`/salons/${svc.salonId}`}>
                            <Typography className="salon-link">🏪 {svc.salonData.salonTitle}</Typography>
                        </Link>
                    )}
                    {svc.memberData && (
                        <Typography className="specialist-text">👤 {t('By')}: {svc.memberData.memberNick}</Typography>
                    )}

                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 13, color: '#888' }} />
                        <Typography sx={{ fontSize: 12, color: '#888' }}>{svc.serviceDuration} min</Typography>
                    </Stack>

                    <Box component="div" className="service-divider" />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography className="service-price">₩{svc.servicePrice?.toLocaleString()}</Typography>
                        <Stack direction="row" alignItems="center" gap={1.5}>
                            <Stack direction="row" alignItems="center" gap={0.25}>
                                <FavoriteBorderIcon sx={{ fontSize: 12, color: '#999' }} />
                                <Typography sx={{ fontSize: 11, color: '#999' }}>{svc.serviceLikes}</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={0.25}>
                                <RemoveRedEyeIcon sx={{ fontSize: 12, color: '#999' }} />
                                <Typography sx={{ fontSize: 11, color: '#999' }}>
                                    {svc.serviceViews >= 1000 ? `${(svc.serviceViews / 1000).toFixed(1)}K` : svc.serviceViews}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Stack>

                    <Button fullWidth className="book-btn" onClick={() => router.push(`/services/${svc._id}`)}>
                        {t('Book Now')}
                    </Button>
                </Box>
            </Stack>
        );
    };

    // ── Filter sidebar ──────────────────────────────────────────────────────────
    const FilterSidebar = () => (
        <Stack className="service-filter">
            <Stack direction="row" justifyContent="space-between" alignItems="center" className="filter-header">
                <Stack direction="row" alignItems="center" gap={1}>
                    <TuneIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                    <Typography className="filter-title">{t('Filters')}</Typography>
                </Stack>
            </Stack>

            {/* Location */}
            <FilterSection title={t('Location')} icon="📍">
                <RadioGroup value={searchFilter.search.locationList?.[0] ?? SalonLocation.ALL}>
                    {LOCATIONS.map((loc) => (
                        <FormControlLabel key={loc} value={loc}
                            onClick={() => locationHandler(loc)}
                            control={<Radio size="small" sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.5 }} />}
                            label={<Typography sx={{ fontSize: 13, color: searchFilter.search.locationList?.[0] === loc ? '#FF4D8D' : '#333', fontWeight: searchFilter.search.locationList?.[0] === loc ? 600 : 400 }}>
                                {loc === SalonLocation.ALL ? `🇰🇷 ${t('All Korea')}` : loc}
                            </Typography>}
                        />
                    ))}
                </RadioGroup>
            </FilterSection>

            {/* Service Type */}
            <FilterSection title={t('Service Type')} icon="✂️">
                {TYPES.map((type) => (
                    <Stack key={type} direction="row" alignItems="center" className="filter-check-row">
                        <Checkbox size="small" value={type}
                            checked={(searchFilter.search.typeList ?? []).includes(type)}
                            onChange={typeFilterHandler}
                            sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.5 }} />
                        <Typography sx={{ fontSize: 13, color: '#333' }}>
                            {TYPE_EMOJI[type] ?? '💄'} {t(type)}
                        </Typography>
                    </Stack>
                ))}
            </FilterSection>

            {/* Price Range */}
            <FilterSection title={t('Price Range')} icon="💰">
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: 11, color: '#888' }}>₩{priceRange[0].toLocaleString()}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#888' }}>₩{priceRange[1].toLocaleString()}+</Typography>
                </Stack>
                <Slider value={priceRange}
                    onChange={(_, val) => setPriceRange(val as number[])}
                    onChangeCommitted={(_, val) => priceHandler(val as number[])}
                    min={10000} max={500000} step={10000}
                    sx={{ color: '#FF4D8D', '& .MuiSlider-thumb': { width: 16, height: 16 }, '& .MuiSlider-track': { height: 4 }, '& .MuiSlider-rail': { height: 4, opacity: 0.3 } }} />
            </FilterSection>

            {/* Rating */}
            <FilterSection title={t('Minimum Rating')} icon="⭐">
                <RadioGroup value={minRating ?? ''}>
                    {RATINGS.map((r) => (
                        <FormControlLabel key={r.value} value={r.value}
                            onClick={() => setMinRating(minRating === r.value ? null : r.value)}
                            control={<Radio size="small" sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.5 }} />}
                            label={
                                <Stack direction="row" alignItems="center" gap={0.5}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <span key={s} style={{ fontSize: 12, color: s <= Math.floor(r.value) ? '#FFB800' : '#ddd' }}>★</span>
                                    ))}
                                    <Typography sx={{ fontSize: 12, color: '#555' }}>{r.label}</Typography>
                                </Stack>
                            }
                        />
                    ))}
                </RadioGroup>
            </FilterSection>

            {/* Duration */}
            <FilterSection title={t('Duration')} icon="⏱️">
                {DURATION_OPTIONS.map((d) => (
                    <Stack key={d.label} direction="row" alignItems="center" className="filter-check-row">
                        <Checkbox size="small"
                            checked={searchFilter.search.durationMax === d.max}
                            onChange={(e) => e.target.checked ? durationHandler(d.max) : durationHandler(999)}
                            sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.5 }} />
                        <Typography sx={{ fontSize: 13, color: '#333' }}>{t(d.label)}</Typography>
                    </Stack>
                ))}
            </FilterSection>

            {/* Buttons */}
            <Box component="div" sx={{ p: '12px 20px 16px' }}>
                <Button fullWidth className="reset-btn" startIcon={<RefreshIcon />} onClick={resetHandler}>
                    {t('Reset')}
                </Button>
            </Box>
        </Stack>
    );

    // ── MOBILE ──────────────────────────────────────────────────────────────────
    if (device === 'mobile') {
        return (
            <Stack className="services-page mobile">
                {/* Search */}
                <Stack className="mobile-search-bar">
                    <OutlinedInput fullWidth size="small"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t('Search services, treatments...')}
                        onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
                        startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /></InputAdornment>}
                        endAdornment={<InputAdornment position="end"><IconButton size="small" onClick={() => setMobileFilterOpen(true)}><TuneIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /></IconButton></InputAdornment>}
                        sx={{ borderRadius: 2.5, fontSize: 13, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}
                    />
                </Stack>

                {/* Type chips */}
                <Stack direction="row" gap={1} className="mobile-type-chips">
                    {TYPE_CHIPS.map((chip) => (
                        <Box key={chip.label} component="div"
                            onClick={() => typeChipHandler(chip.value as ServiceType | null)}
                            className={`type-chip ${activeTypeChip === chip.value ? 'active' : ''}`}>
                            {t(chip.label)}
                        </Box>
                    ))}
                </Stack>

                {/* Results + sort */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1 }}>
                    <Typography sx={{ fontSize: 13, color: '#888' }}>
                        <Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{total}</Box> {t('services found')}
                    </Typography>
                    <Select value={activeSort} onChange={(e) => sortHandler(e.target.value)} size="small"
                        sx={{ fontSize: 12, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}>
                        {SORT_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{t(s.label)}</MenuItem>)}
                    </Select>
                </Stack>

                {/* Cards — horizontal layout */}
                <Stack gap={1.5} sx={{ px: 2 }}>
                    {services.length === 0 ? (
                        <EmptyList emoji="✂️" title={t('No services found')} desc={t('Try changing filters')} />
                    ) : (
                        services.map((svc) => {
                            const img = svc.serviceImages?.[0] ? `${REACT_APP_API_URL}/${svc.serviceImages[0]}` : '/img/banner/default.jpg';
                            const liked = svc.meLiked?.[0]?.myFavorite;
                            return (
                                <Stack key={svc._id} className="service-mobile-card" direction="row">
                                    <Box component="div" className="mobile-svc-img"
                                        style={{ backgroundImage: `url(${img})` }}
                                        onClick={() => router.push(`/services/${svc._id}`)}>
                                        <Box component="div" className="trending-badge-sm">🔥</Box>
                                    </Box>
                                    <Box component="div" className="mobile-svc-info">
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Typography className="mobile-svc-name" onClick={() => router.push(`/services/${svc._id}`)}>
                                                {svc.serviceTitle}
                                            </Typography>
                                            <IconButton size="small" onClick={() => likeHandler(svc._id)} sx={{ p: 0.25 }}>
                                                {liked ? <FavoriteIcon sx={{ fontSize: 14, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 14, color: '#999' }} />}
                                            </IconButton>
                                        </Stack>
                                        {svc.salonData && (
                                            <Typography sx={{ fontSize: 11, color: '#FF4D8D', fontWeight: 600, mb: 0.25 }}>
                                                🏪 {svc.salonData.salonTitle}
                                            </Typography>
                                        )}
                                        {svc.memberData && (
                                            <Typography sx={{ fontSize: 11, color: '#888', mb: 0.25 }}>
                                                👤 {t('By')}: {svc.memberData.memberNick}
                                            </Typography>
                                        )}
                                        <Typography sx={{ fontSize: 11, color: '#888', mb: 0.5 }}>⏱️ {svc.serviceDuration} min</Typography>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#FF4D8D' }}>₩{svc.servicePrice?.toLocaleString()}</Typography>
                                            <Button size="small" className="book-btn-sm" onClick={() => router.push(`/services/${svc._id}`)}>
                                                {t('Book')}
                                            </Button>
                                        </Stack>
                                        <Stack direction="row" gap={1} sx={{ mt: 0.5 }}>
                                            <Typography sx={{ fontSize: 10, color: '#bbb' }}>❤️ {svc.serviceLikes}</Typography>
                                            <Typography sx={{ fontSize: 10, color: '#bbb' }}>👁️ {svc.serviceViews >= 1000 ? `${(svc.serviceViews / 1000).toFixed(1)}K` : svc.serviceViews}</Typography>
                                        </Stack>
                                    </Box>
                                </Stack>
                            );
                        })
                    )}
                </Stack>

                <Pagination page={searchFilter.page} limit={searchFilter.limit} total={total} onChange={pageHandler} />

                {/* Bottom bar */}
                <Stack direction="row" className="mobile-bottom-bar">
                    <Button fullWidth startIcon={<TuneIcon />} className="mobile-filter-btn" onClick={() => setMobileFilterOpen(true)}>
                        {t('Filter')}
                    </Button>
                    <Select value={activeSort} onChange={(e) => sortHandler(e.target.value)} size="small" className="mobile-sort-select">
                        {SORT_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{t(s.label)}</MenuItem>)}
                    </Select>
                </Stack>

                {/* Filter drawer */}
                <Drawer anchor="bottom" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}
                    PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflow: 'auto' } }}>
                    <Box component="div" sx={{ p: 2 }}><FilterSidebar /></Box>
                </Drawer>
            </Stack>
        );
    }

    // ── DESKTOP ─────────────────────────────────────────────────────────────────
    return (
        <Stack className="services-page">
            {/* Top bar */}
            <Stack className="services-top-bar">
                <Stack className="services-top-inner" direction="row" alignItems="center" gap={2}>
                    <OutlinedInput value={searchText} onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t('Search services, treatments...')}
                        onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
                        startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /></InputAdornment>}
                        sx={{ flex: 1, borderRadius: 2.5, fontSize: 14, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' }, '&:hover fieldset': { borderColor: '#FF4D8D' }, '&.Mui-focused fieldset': { borderColor: '#FF4D8D' } }}
                    />
                    <Stack direction="row" alignItems="center" gap={0.75}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
                        <Select value={searchFilter.search.locationList?.[0] ?? SalonLocation.ALL}
                            onChange={(e) => locationHandler(e.target.value as SalonLocation)} size="small"
                            sx={{ minWidth: 140, borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}>
                            {LOCATIONS.map((loc) => (
                                <MenuItem key={loc} value={loc}>{loc === SalonLocation.ALL ? `🇰🇷 ${t('All Korea')}` : loc}</MenuItem>
                            ))}
                        </Select>
                    </Stack>
                    <Button className="find-now-btn" onClick={searchHandler}>{t('Find Now')}</Button>
                </Stack>
                <Stack direction="row" gap={1} className="type-chips-bar">
                    {TYPE_CHIPS.map((chip) => (
                        <Box key={chip.label} component="div"
                            onClick={() => typeChipHandler(chip.value as ServiceType | null)}
                            className={`type-chip ${activeTypeChip === chip.value ? 'active' : ''}`}>
                            {t(chip.label)}
                        </Box>
                    ))}
                </Stack>
            </Stack>

            {/* Main */}
            <Stack direction="row" className="services-main">
                <Box component="div" className="services-sidebar"><FilterSidebar /></Box>
                <Stack className="services-content">
                    <Stack direction="row" justifyContent="space-between" alignItems="center" className="results-header">
                        <Typography className="results-count">
                            <Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{total}</Box> {t('services found')}
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography sx={{ fontSize: 13, color: '#888' }}>{t('Sort by')}:</Typography>
                            {SORT_OPTIONS.map((s) => (
                                <Box key={s.value} component="div"
                                    onClick={() => sortHandler(s.value)}
                                    className={`sort-chip ${activeSort === s.value ? 'active' : ''}`}>
                                    {t(s.label)}
                                </Box>
                            ))}
                        </Stack>
                    </Stack>

                    {services.length === 0 ? (
                        <EmptyList emoji="✂️" title={t('No services found')} desc={t('Try adjusting your filters')} buttonText="Clear filters" buttonHref="/services" />
                    ) : (
                        <Stack className="services-grid">
                            {services.map((svc) => <ServiceCard key={svc._id} svc={svc} />)}
                        </Stack>
                    )}
                    <Pagination page={searchFilter.page} limit={searchFilter.limit} total={total} onChange={pageHandler} />
                </Stack>
            </Stack>
        </Stack>
    );
};

export default withLayoutBasic(Services);