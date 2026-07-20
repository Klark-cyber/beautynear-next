import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import {
    Stack,
    Box,
    Typography,
    Button,
    IconButton,
    Chip,
    Pagination as MuiPagination,
    OutlinedInput,
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import MobileServices from '../../libs/components/service/MobileServices';
import StarIcon from '@mui/icons-material/Star';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Servicefilter from '../../libs/components/service/Servicefilter';
import EmptyList from '../../libs/components/common/Emptylist';
import { GET_SERVICES } from '../../apollo/user/query';
import { LIKE_TARGET_SERVICE } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ServiceType } from '../../libs/enums/service.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

// Backend SVISearch FAQAT shu maydonlarni qabul qiladi
const ALLOWED_SEARCH_FIELDS = [
    'memberId',
    'salonId',
    'typeList',
    'locationList',
    'priceMin',
    'priceMax',
    'durationMax',
    'text',
];

const sanitizeInput = (input: any) => {
    const clean: any = {
        page: input?.page ?? 1,
        limit: input?.limit ?? 9,
        sort: input?.sort ?? 'createdAt',
        direction: input?.direction ?? Direction.DESC,
        search: {},
    };
    if (input?.search && typeof input.search === 'object') {
        for (const key of ALLOWED_SEARCH_FIELDS) {
            if (input.search[key] !== undefined && input.search[key] !== null) {
                clean.search[key] = input.search[key];
            }
        }
    }
    return clean;
};

// Hydration-safe narx formati
const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 15600 → 15.6K
const formatViews = (n?: number): string => {
    if (!n) return '0';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
};

const formatRating = (n?: number): string => {
    if (n === undefined || n === null) return '4.9';
    return n.toFixed(1);
};

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const DEFAULT_INPUT = {
    page: 1,
    limit: 9,
    sort: 'createdAt',
    direction: Direction.DESC,
    search: {},
};

/* Kategoriya chiplar — backend ServiceType ga mos (label rasmdagidek) */
const CATEGORY_CHIPS: { label: string; value: ServiceType | null }[] = [
    { label: 'All', value: null },
    { label: 'Facial', value: ServiceType.SKIN },
    { label: 'Nail', value: ServiceType.NAIL },
    { label: 'Hair', value: ServiceType.HAIR },
    { label: 'Massage', value: ServiceType.MASSAGE },
    { label: 'Clinic', value: ServiceType.CLINIC },
];

/* Sort variantlari — rasmdagidek */
const SORT_OPTIONS = [
    { label: 'Latest', sort: 'createdAt', direction: Direction.DESC },
    { label: 'Most Popular', sort: 'serviceViews', direction: Direction.DESC },
    { label: 'Top Rated', sort: 'serviceRank', direction: Direction.DESC },
    { label: 'Price ↑', sort: 'servicePrice', direction: Direction.ASC },
    { label: 'Price ↓', sort: 'servicePrice', direction: Direction.DESC },
];

/* ─── Page ────────────────────────────────────────────────────────────── */

const ServiceList: NextPage = ({ initialInput, ...props }: any) => {
    const device = useDeviceDetect();
    const router = useRouter();
    const { t } = useTranslation('common');
    const user = useReactiveVar(userVar);

    const [searchFilter, setSearchFilter] = useState<any>(initialInput ?? DEFAULT_INPUT);
    const [services, setServices] = useState<any[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [searchText, setSearchText] = useState<string>('');
    const [activeChip, setActiveChip] = useState<string>('All');
    const [activeSort, setActiveSort] = useState<string>('Latest');
    const [minRating, setMinRating] = useState<number>(0); // frontend-side (backend'da yo'q)

    /** APOLLO **/
    const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);

    const { refetch: servicesRefetch } = useQuery(GET_SERVICES, {
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
        if (router.query.input) {
            try {
                const parsed = JSON.parse(router.query.input as string);
                setSearchFilter(sanitizeInput(parsed));
            } catch {
                setSearchFilter(DEFAULT_INPUT);
            }
        }
    }, [router.query.input]);

    /** HANDLERS **/
    const pushFilter = useCallback(
        async (filter: any) => {
            await router.push(`/service?input=${encodeURIComponent(JSON.stringify(filter))}`, undefined, {
                scroll: false,
            });
        },
        [router],
    );

    const paginationHandler = useCallback(
        async (_e: ChangeEvent<unknown>, page: number) => {
            const next = { ...searchFilter, page };
            await pushFilter(next);
        },
        [searchFilter, pushFilter],
    );

    const chipHandler = useCallback(
        async (chip: { label: string; value: ServiceType | null }) => {
            setActiveChip(chip.label);
            const search: any = { ...searchFilter.search };
            if (chip.value) search.typeList = [chip.value];
            else delete search.typeList;
            await pushFilter({ ...searchFilter, page: 1, search });
        },
        [searchFilter, pushFilter],
    );

    const sortHandler = useCallback(
        async (opt: (typeof SORT_OPTIONS)[0]) => {
            setActiveSort(opt.label);
            await pushFilter({ ...searchFilter, page: 1, sort: opt.sort, direction: opt.direction });
        },
        [searchFilter, pushFilter],
    );

    const searchHandler = useCallback(async () => {
        const search: any = { ...searchFilter.search };
        if (searchText.trim()) search.text = searchText.trim();
        else delete search.text;
        await pushFilter({ ...searchFilter, page: 1, search });
    }, [searchText, searchFilter, pushFilter]);

    const serviceLikeHandler = useCallback(
        async (serviceId: string) => {
            try {
                if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
                await likeTargetService({ variables: { input: serviceId } });
                await servicesRefetch({ input: searchFilter });
                await sweetTopSmallSuccessAlert('success', 800);
            } catch (err: any) {
                sweetMixinErrorAlert(err.message).then();
            }
        },
        [user, searchFilter],
    );

    // Filter komponentidan keladi (Apply Filters)
    const applyFiltersHandler = useCallback(
        async (filterSearch: any, ratingValue: number) => {
            setMinRating(ratingValue);
            const search: any = { ...searchFilter.search, ...filterSearch };
            // bo'sh qiymatlarni tozalash
            for (const key of Object.keys(search)) {
                if (
                    search[key] === undefined ||
                    search[key] === null ||
                    (Array.isArray(search[key]) && search[key].length === 0)
                ) {
                    delete search[key];
                }
            }
            await pushFilter({ ...searchFilter, page: 1, search });
        },
        [searchFilter, pushFilter],
    );

    const resetHandler = useCallback(async () => {
        setSearchText('');
        setActiveChip('All');
        setActiveSort('Latest');
        setMinRating(0);
        await pushFilter(DEFAULT_INPUT);
    }, [pushFilter]);

    // Minimum Rating — frontend-side filter (backend qo'llab-quvvatlamaydi)
    const visibleServices = minRating > 0 ? services.filter((s) => (s.serviceRating ?? 0) >= minRating) : services;

    // ⚠️ TUZATILDI: mobil return BARCHA hook'lardan keyin bo'lishi shart
    // — React qoidasi: hook'lar har renderда bir xil tartibda chaqirilishi kerak.
    // Avval bu return boshqa hook'lardan OLDIN edi, bu "Rendered fewer
    // hooks than expected" xatosiga sabab bo'lgan edi.
    if (device === 'mobile') {
        return <MobileServices />;
    }

    /* ─── RENDER ──────────────────────────────────────────────────────── */
    return (
        <Stack className="services-page">
            <Stack className="services-inner">
                {/* ═══ Yuqori: search + kategoriya chiplar ═══ */}
                <Stack className="services-top">
                    <Stack direction="row" gap={1.5} alignItems="center" className="search-row">
                        <OutlinedInput
                            fullWidth
                            size="small"
                            placeholder={t('Search services, treatments...')}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
                            className="search-input"
                            startAdornment={
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 20, color: '#999' }} />
                                </InputAdornment>
                            }
                        />
                        <Button className="find-now-btn" onClick={searchHandler}>
                            {t('Find Now')}
                        </Button>
                    </Stack>

                    <Stack direction="row" gap={1} className="category-chips" flexWrap="wrap">
                        {CATEGORY_CHIPS.map((chip) => (
                            <Box
                                key={chip.label}
                                component="div"
                                className={`cat-chip ${activeChip === chip.label ? 'active' : ''}`}
                                onClick={() => chipHandler(chip)}
                            >
                                {t(chip.label)}
                            </Box>
                        ))}
                    </Stack>
                </Stack>

                {/* ═══ Asosiy: filter + natijalar ═══ */}
                <Stack direction="row" gap={4.5} alignItems="flex-start" className="services-content">
                    {/* CHAP: filter sidebar */}
                    <Servicefilter onApply={applyFiltersHandler} onReset={resetHandler} />

                    {/* O'NG: natijalar */}
                    <Stack className="services-main">
                        {/* Header: son + sort */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" className="results-header">
                            <Typography className="results-count">
                                <Box component="span" sx={{ color: '#FF4D8D', fontWeight: 800 }}>
                                    {total}
                                </Box>{' '}
                                {t('services found')}
                            </Typography>

                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography sx={{ fontSize: 13, color: '#888' }}>{t('Sort by')}:</Typography>
                                <Stack direction="row" gap={0.75}>
                                    {SORT_OPTIONS.map((opt) => (
                                        <Box
                                            key={opt.label}
                                            component="div"
                                            className={`sort-chip ${activeSort === opt.label ? 'active' : ''}`}
                                            onClick={() => sortHandler(opt)}
                                        >
                                            {t(opt.label)}
                                        </Box>
                                    ))}
                                </Stack>
                            </Stack>
                        </Stack>

                        {/* Cardlar */}
                        {visibleServices.length === 0 ? (
                            <EmptyList emoji="✂️" title={t('No services found')} desc={t('Try adjusting your filters')} />
                        ) : (
                            <Box component="div" className="services-grid">
                                {visibleServices.map((svc) => {
                                    const svcLiked = svc.meLiked?.[0]?.myFavorite;
                                    const isTrending = (svc.serviceRank ?? 0) > 0 || (svc.serviceViews ?? 0) > 50;
                                    return (
                                        <Stack key={svc._id} className="service-card" onClick={() => router.push(`/service/${svc._id}`)}>
                                            {/* Rasm */}
                                            <Box
                                                component="div"
                                                className="svc-img"
                                                style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }}
                                            >
                                                {isTrending && (
                                                    <Stack direction="row" alignItems="center" gap={0.5} className="trending-badge">
                                                        <LocalFireDepartmentIcon sx={{ fontSize: 13 }} />
                                                        <Typography sx={{ fontSize: 11.5, fontWeight: 700 }}>{t('Trending')}</Typography>
                                                    </Stack>
                                                )}
                                                <IconButton
                                                    className={`svc-like-btn ${svcLiked ? 'liked' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        serviceLikeHandler(svc._id);
                                                    }}
                                                >
                                                    {svcLiked ? (
                                                        <FavoriteIcon sx={{ fontSize: 17, color: '#FF4D8D' }} />
                                                    ) : (
                                                        <FavoriteBorderIcon sx={{ fontSize: 17 }} />
                                                    )}
                                                </IconButton>
                                                <Stack direction="row" alignItems="center" gap={0.5} className="views-badge">
                                                    <RemoveRedEyeIcon sx={{ fontSize: 13 }} />
                                                    <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{formatViews(svc.serviceViews)}</Typography>
                                                </Stack>
                                            </Box>

                                            {/* Body */}
                                            <Box component="div" className="svc-body">
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography className="svc-name">{svc.serviceTitle}</Typography>
                                                    <Stack direction="row" alignItems="center" gap={0.4}>
                                                        <StarIcon sx={{ fontSize: 15, color: '#FFB800' }} />
                                                        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#333' }}>
                                                            {formatRating(svc.serviceRating)}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>

                                                {svc.salonData?.salonTitle && (
                                                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.75 }}>
                                                        <LocationOnOutlinedIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
                                                        <Typography className="svc-salon">{svc.salonData.salonTitle}</Typography>
                                                    </Stack>
                                                )}

                                                {svc.memberData?.memberNick && (
                                                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                                                        <PersonOutlineIcon sx={{ fontSize: 15, color: '#999' }} />
                                                        <Typography sx={{ fontSize: 13, color: '#777' }}>
                                                            {t('By')}: {svc.memberData.memberNick}
                                                        </Typography>
                                                    </Stack>
                                                )}

                                                <Box component="div" className="dur-chip">
                                                    {svc.serviceDuration} {t('min')}
                                                </Box>

                                                <Stack direction="row" justifyContent="space-between" alignItems="center" className="price-row">
                                                    <Typography className="svc-price">₩{formatPrice(svc.servicePrice)}</Typography>
                                                    <Stack direction="row" alignItems="center" gap={1.5}>
                                                        <Stack direction="row" alignItems="center" gap={0.4}>
                                                            <FavoriteBorderIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
                                                            <Typography sx={{ fontSize: 12.5, color: '#888' }}>{svc.serviceLikes ?? 0}</Typography>
                                                        </Stack>
                                                        <Stack direction="row" alignItems="center" gap={0.4}>
                                                            <RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
                                                            <Typography sx={{ fontSize: 12.5, color: '#888' }}>{formatViews(svc.serviceViews)}</Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Stack>

                                                <Button fullWidth className="svc-book-btn">{t('Book Now')}</Button>
                                            </Box>
                                        </Stack>
                                    );
                                })}
                            </Box>
                        )}

                        {/* Pagination */}
                        {total > searchFilter.limit && (
                            <Stack alignItems="center" sx={{ mt: 4 }}>
                                <MuiPagination
                                    page={searchFilter.page}
                                    count={Math.ceil(total / searchFilter.limit)}
                                    onChange={paginationHandler}
                                    shape="circular"
                                    sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
                                />
                            </Stack>
                        )}
                    </Stack>
                </Stack>
            </Stack>
        </Stack>
    );
};

/** SSR **/
export async function getServerSideProps(ctx: any) {
    let initialInput = DEFAULT_INPUT;
    if (ctx.query.input) {
        try {
            initialInput = sanitizeInput(JSON.parse(ctx.query.input));
        } catch {
            initialInput = DEFAULT_INPUT;
        }
    }
    return {
        props: {
            initialInput,
            ...(await serverSideTranslations(ctx.locale, ['common'])),
        },
    };
}

export default withLayoutBasic(ServiceList);