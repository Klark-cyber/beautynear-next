import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, OutlinedInput, InputAdornment } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_AGENT_SALONS, GET_AGENT_SERVICES } from '../../../apollo/user/query';
import { UPDATE_SALON } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { Salon } from '../../types/salon/salon';
import { SalonStatus } from '../../enums/salon.enum';
import { T } from '../../types/common';
import { REACT_APP_API_URL } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatCount = (n?: number): string => {
    if (!n) return '0';
    return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
};

const TYPE_EMOJI: Record<string, string> = {
    HAIR: '✂️',
    NAIL: '💅',
    SKIN: '🧴',
    CLINIC: '💉',
    MASSAGE: '🪷',
};

// ⚠️ TUZATILDI: "Deleted" tab OLIB TASHLANDI — backend'ning
// getAgentSalons so'rovi salonStatus:DELETE bo'yicha filtrlashni
// ATAYLAB man qiladi ("Not Allowed Request!" xatosi shundan edi).
// Bu — backend'ning ongli arxitektura qarori (o'chirilgan salonlar
// qayta ko'rsatilmasligi kerak), shuning uchun frontend shunga moslandi.
const STATUS_TABS: { label: string; value?: SalonStatus }[] = [
    { label: 'All', value: undefined },
    { label: 'Active', value: SalonStatus.ACTIVE },
    { label: 'Paused', value: SalonStatus.PAUSE },
    { label: 'Inactive', value: SalonStatus.INACTIVE },
];

const limit = 8;

/* ─── Component ───────────────────────────────────────────────────────────── */

// ⚠️ MUHIM: Desktop MySalons.tsx bilan bir xil query/handler mantiqidan
// foydalanadi (GET_AGENT_SALONS, UPDATE_SALON soft-delete) — faqat
// ChatGPT/Figma spetsifikatsiyasi asosida to'liq yangi premium mobil UI.

const MobileMySalons = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [activeStatus, setActiveStatus] = useState<SalonStatus | undefined>(SalonStatus.ACTIVE);
    const [searchText, setSearchText] = useState('');
    const [salons, setSalons] = useState<Salon[]>([]);
    const [total, setTotal] = useState(0);
    const [servicesTotal, setServicesTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const [updateSalon] = useMutation(UPDATE_SALON);

    const buildSearch = useCallback((): T => {
        const search: T = {};
        if (activeStatus) search.salonStatus = activeStatus;
        if (searchText.trim()) search.text = searchText.trim();
        return search;
    }, [activeStatus, searchText]);

    const { refetch } = useQuery(GET_AGENT_SALONS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit, search: buildSearch() } },
        skip: !user?._id,
        onCompleted: (data: T) => {
            setSalons(data?.getAgentSalons?.list ?? []);
            setTotal(data?.getAgentSalons?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        },
    });

    // Statistika uchun — jami xizmatlar soni
    useQuery(GET_AGENT_SERVICES, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 1, search: {} } },
        skip: !user?._id,
        onCompleted: (data: T) => setServicesTotal(data?.getAgentServices?.metaCounter?.[0]?.total ?? 0),
    });

    useEffect(() => {
        refetch({ input: { page: 1, limit, search: buildSearch() } }).then(({ data }) => {
            setSalons(data?.getAgentSalons?.list ?? []);
            setTotal(data?.getAgentSalons?.metaCounter?.[0]?.total ?? 0);
            setPage(1);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStatus]);

    useEffect(() => {
        const timer = setTimeout(() => {
            refetch({ input: { page: 1, limit, search: buildSearch() } }).then(({ data }) => {
                setSalons(data?.getAgentSalons?.list ?? []);
                setTotal(data?.getAgentSalons?.metaCounter?.[0]?.total ?? 0);
                setPage(1);
            });
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText]);

    // O'rtacha reyting (statistika kartasi uchun)
    const avgRating = salons.length
        ? salons.reduce((sum, s) => sum + (s.salonRating ?? 0), 0) / salons.length
        : 0;

    /** HANDLERS **/
    const loadMoreHandler = async () => {
        const nextPage = page + 1;
        const { data } = await refetch({ input: { page: nextPage, limit, search: buildSearch() } });
        setSalons((prev) => [...prev, ...(data?.getAgentSalons?.list ?? [])]);
        setPage(nextPage);
    };

    const goAddSalon = () => router.push('/mypage?category=addSalon');
    const editSalonHandler = (id: string) => router.push(`/mypage?category=addSalon&salonId=${id}`);

    const deleteSalonHandler = async (id: string) => {
        setOpenMenuId(null);
        try {
            if (await sweetConfirmAlert(t('Are you sure to delete this salon?'))) {
                await updateSalon({ variables: { input: { _id: id, salonStatus: SalonStatus.DELETE } } });
                await refetch({ input: { page: 1, limit, search: buildSearch() } });
            }
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    return (
        <Box component="div" id="mobile-mysalons" onClick={() => openMenuId && setOpenMenuId(null)}>
            {/* ═══ HEADER ═══ */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="ms-header">
                <IconButton className="ms-icon-btn" onClick={() => router.push('/mypage')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
                </IconButton>
                <Typography className="ms-title">{t('My Salons')}</Typography>
                <IconButton className="ms-icon-btn">
                    <NotificationsNoneIcon sx={{ fontSize: 19 }} />
                </IconButton>
            </Stack>

            {/* ═══ GREETING CARD ═══ */}
            <Stack className="ms-greeting-card">
                <Stack direction="row" alignItems="center" gap={1.5}>
                    <Box component="div" className="ms-greeting-avatar" style={{ backgroundImage: `url(${imgUrl(user?.memberImage, '/img/profile/defaultUser.svg')})` }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography className="ms-greeting-hello">{t('Welcome back')},</Typography>
                        <Typography className="ms-greeting-name">{user?.memberNick}</Typography>
                    </Box>
                </Stack>
                <Stack direction="row" gap={1} className="ms-greeting-actions">
                    <Box component="div" className="ms-greeting-btn full" onClick={() => router.push('/mypage?category=myProfile')}>
                        {t('Manage Profile')}
                    </Box>
                </Stack>
            </Stack>

            {/* ═══ STATISTIKA ═══ */}
            <Stack direction="row" className="ms-stats-row">
                <Stack alignItems="center" className="ms-stat-card">
                    <Typography className="ms-stat-num">{total}</Typography>
                    <Typography className="ms-stat-label">{t('Salons')}</Typography>
                </Stack>
                <Stack alignItems="center" className="ms-stat-card">
                    <Typography className="ms-stat-num">{servicesTotal}</Typography>
                    <Typography className="ms-stat-label">{t('Services')}</Typography>
                </Stack>
                <Stack alignItems="center" className="ms-stat-card">
                    <Stack direction="row" alignItems="center" gap={0.3}>
                        <StarIcon sx={{ fontSize: 15, color: '#F5B100' }} />
                        <Typography className="ms-stat-num">{avgRating.toFixed(1)}</Typography>
                    </Stack>
                    <Typography className="ms-stat-label">{t('Rating')}</Typography>
                </Stack>
            </Stack>

            {/* ═══ QIDIRUV ═══ */}
            <Stack direction="row" gap={1} className="ms-search-row">
                <OutlinedInput
                    fullWidth
                    className="ms-search-input"
                    placeholder={t('Search your salons...')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 19 }} /></InputAdornment>}
                />
                <IconButton className="ms-filter-btn">
                    <TuneIcon sx={{ fontSize: 19, color: '#FF4D8D' }} />
                </IconButton>
            </Stack>

            {/* ═══ STATUS TABS ═══ */}
            <Stack direction="row" className="ms-tabs">
                {STATUS_TABS.map((tab) => (
                    <Box
                        key={tab.label}
                        component="div"
                        className={`ms-tab ${activeStatus === tab.value ? 'active' : ''}`}
                        onClick={() => setActiveStatus(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            {/* ═══ SALON KARTALARI ═══ */}
            <Stack className="ms-list">
                {salons.length === 0 && (
                    <Stack alignItems="center" className="ms-empty">
                        <Typography className="ms-empty-emoji">🏪</Typography>
                        <Typography className="ms-empty-title">{t('No salons yet')}</Typography>
                        <Typography className="ms-empty-desc">{t('Add your first salon to start receiving bookings')}</Typography>
                        <Box component="div" className="ms-empty-btn" onClick={goAddSalon}>{t('Add Your First Salon')}</Box>
                    </Stack>
                )}

                {salons.map((salon) => {
                    const isActive = salon.salonStatus === SalonStatus.ACTIVE;
                    const isPaused = salon.salonStatus === SalonStatus.PAUSE;
                    const isDeleted = salon.salonStatus === SalonStatus.DELETE;

                    return (
                        <Stack key={salon._id} className="ms-card">
                            <Box component="div" className="ms-card-img" style={{ backgroundImage: `url(${imgUrl(salon.salonImages?.[0])})` }} onClick={() => !isDeleted && editSalonHandler(salon._id)}>
                                <Box component="div" className={`ms-status-badge ${salon.salonStatus?.toLowerCase()}`}>
                                    {t(salon.salonStatus)}
                                </Box>
                                {!isDeleted && (
                                    <IconButton className="ms-menu-btn" onClick={(e: any) => { e.stopPropagation(); setOpenMenuId((p) => (p === salon._id ? null : salon._id)); }}>
                                        <MoreVertIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                )}
                                {openMenuId === salon._id && (
                                    <Stack className="ms-menu-dropdown" onClick={(e: any) => e.stopPropagation()}>
                                        <Box component="div" className="ms-menu-item" onClick={() => editSalonHandler(salon._id)}>
                                            <EditOutlinedIcon sx={{ fontSize: 15 }} /> {t('Edit')}
                                        </Box>
                                        <Box component="div" className="ms-menu-item danger" onClick={() => deleteSalonHandler(salon._id)}>
                                            <DeleteOutlineIcon sx={{ fontSize: 15 }} /> {t('Delete')}
                                        </Box>
                                    </Stack>
                                )}
                            </Box>

                            <Box component="div" className="ms-card-body">
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography className="ms-salon-name">{salon.salonTitle}</Typography>
                                    <Box component="div" className="ms-type-chip">{TYPE_EMOJI[salon.salonType]} {t(salon.salonType)}</Box>
                                </Stack>
                                <Stack direction="row" alignItems="center" gap={0.4} sx={{ mt: 0.5 }}>
                                    <LocationOnIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                                    <Typography className="ms-salon-addr">{salon.salonAddress}</Typography>
                                </Stack>

                                <Stack direction="row" alignItems="center" gap={1.5} className="ms-meta-row">
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <StarIcon sx={{ fontSize: 13, color: '#F5B100' }} />
                                        <Typography className="ms-meta-text">{(salon.salonRating ?? 0).toFixed(1)}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <FavoriteIcon sx={{ fontSize: 12, color: '#FF4D8D' }} />
                                        <Typography className="ms-meta-text">{formatCount(salon.salonLikes)}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.3}>
                                        <RemoveRedEyeOutlinedIcon sx={{ fontSize: 13, color: '#999' }} />
                                        <Typography className="ms-meta-text">{formatCount(salon.salonViews)}</Typography>
                                    </Stack>
                                </Stack>

                                <Box component="div" className="ms-manage-services-btn" onClick={() => router.push(`/mypage?category=myServices&salonId=${salon._id}&salonTitle=${encodeURIComponent(salon.salonTitle)}`)}>
                                    <ContentCutOutlinedIcon sx={{ fontSize: 15 }} />
                                    {t('Manage Services')}
                                </Box>
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>

            {/* ═══ LOAD MORE ═══ */}
            {salons.length > 0 && salons.length < total && (
                <Box component="div" className="ms-load-more" onClick={loadMoreHandler}>
                    {t('Load More')}
                </Box>
            )}

            {/* ═══ FLOATING ADD BUTTON ═══ */}
            <Box component="div" className="ms-fab" onClick={goAddSalon}>
                <AddIcon sx={{ fontSize: 26, color: '#fff' }} />
            </Box>
        </Box>
    );
};

export default MobileMySalons;