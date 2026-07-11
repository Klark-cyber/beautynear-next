import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, Chip, Button, IconButton, Pagination as MuiPagination } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import AddIcon from '@mui/icons-material/Add';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_AGENT_SALONS } from '../../../apollo/user/query';
import { UPDATE_SALON } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import EmptyList from '../common/Emptylist';
import { Salon } from '../../types/salon/salon';
import { AgentSalonsInquiry } from '../../types/salon/salon.input';
import { SalonStatus } from '../../enums/salon.enum';
import { T } from '../../types/common';
import { REACT_APP_API_URL } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/banner/default.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatCount = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
};

const TYPE_EMOJI: Record<string, string> = {
    HAIR: '✂️',
    NAIL: '💅',
    SKIN: '🧴',
    CLINIC: '💉',
    MASSAGE: '🪷',
};

const STATUS_TABS = [
    { label: 'Active', value: SalonStatus.ACTIVE },
    { label: 'Paused', value: SalonStatus.PAUSE },
    { label: 'Inactive', value: SalonStatus.INACTIVE },
];

// Har tab uchun bo'sh holat matni
const EMPTY_STATE_TEXT: Record<string, { title: string; desc: string }> = {
    [SalonStatus.ACTIVE]: {
        title: 'No salons yet',
        desc: 'Add your first salon to start receiving bookings',
    },
    [SalonStatus.PAUSE]: {
        title: 'No paused salons',
        desc: 'Salons you temporarily pause will appear here',
    },
    [SalonStatus.INACTIVE]: {
        title: 'No inactive salons',
        desc: 'Salons that are no longer active will appear here',
    },
};

const limit = 5;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MySalons: NextPage = ({
    initialInput = { page: 1, limit, search: { salonStatus: SalonStatus.ACTIVE } },
    ...props
}: any) => {
    const router = useRouter();
    const { t } = useTranslation('common');
    const user = useReactiveVar(userVar);

    const [searchFilter, setSearchFilter] = useState<AgentSalonsInquiry>(initialInput);
    const [salons, setSalons] = useState<Salon[]>([]);
    const [total, setTotal] = useState<number>(0);

    /** APOLLO REQUESTS **/
    const [updateSalon] = useMutation(UPDATE_SALON);

    const { refetch } = useQuery(GET_AGENT_SALONS, {
        fetchPolicy: 'network-only',
        variables: { input: searchFilter },
        skip: !user?._id,
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setSalons(data?.getAgentSalons?.list ?? []);
            setTotal(data?.getAgentSalons?.metaCounter?.[0]?.total ?? 0);
        },
    });

    /** HANDLERS **/
    const changeStatusHandler = (value: SalonStatus) => {
        setSearchFilter({ ...searchFilter, page: 1, search: { salonStatus: value } });
    };

    const paginationHandler = (_e: any, value: number) => {
        setSearchFilter({ ...searchFilter, page: value });
    };

    const goAddSalon = () => {
        router.push({ pathname: '/mypage', query: { category: 'addSalon' } });
    };

    const editSalonHandler = (id: string) => {
        router.push({ pathname: '/mypage', query: { category: 'addSalon', salonId: id } });
    };

    // Nestar'dagi deletePropertyHandler naqshi — soft-delete (salonStatus: DELETE)
    const deleteSalonHandler = async (id: string) => {
        try {
            if (await sweetConfirmAlert('Are you sure to delete this salon?')) {
                await updateSalon({ variables: { input: { _id: id, salonStatus: SalonStatus.DELETE } } });
                await refetch({ input: searchFilter });
            }
        } catch (err: any) {
            await sweetErrorHandling(err);
        }
    };

    return (
        <Box component="div" className="mypage-content">
            {/* Sarlavha + Add New Salon */}
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" className="salons-header-row">
                <Box component="div">
                    <Typography className="content-title">{t('My Salons')}</Typography>
                    <Typography className="content-subtitle">{t('Manage your salon listings')}</Typography>
                </Box>
                <Button className="add-salon-btn" startIcon={<AddIcon />} onClick={goAddSalon}>
                    {t('Add New Salon')}
                </Button>
            </Stack>

            {/* Status tablar */}
            <Stack direction="row" gap={1.5} className="filter-tabs">
                {STATUS_TABS.map((tab) => (
                    <Box
                        key={tab.value}
                        component="div"
                        className={`filter-tab ${searchFilter.search.salonStatus === tab.value ? 'active' : ''}`}
                        onClick={() => changeStatusHandler(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            {/* Salon ro'yxati — umumiy frame ichida */}
            {salons.length === 0 ? (
                <Box component="div" className="follow-page-frame">
                    <EmptyList
                        emoji="🏪"
                        title={t(EMPTY_STATE_TEXT[searchFilter.search.salonStatus ?? SalonStatus.ACTIVE].title)}
                        desc={t(EMPTY_STATE_TEXT[searchFilter.search.salonStatus ?? SalonStatus.ACTIVE].desc)}
                    />
                    {searchFilter.search.salonStatus === SalonStatus.ACTIVE && (
                        <Stack alignItems="center" sx={{ mt: 2 }}>
                            <Button className="add-salon-btn" onClick={goAddSalon}>
                                {t('Add Your First Salon')}
                            </Button>
                        </Stack>
                    )}
                </Box>
            ) : (
                <Box component="div" className="follow-page-frame">
                    <Stack className="salon-list">
                        {salons.map((salon) => {
                            const isActive = salon.salonStatus === SalonStatus.ACTIVE;
                            return (
                                <Stack key={salon._id} direction="row" alignItems="center" className="salon-row">
                                    {/* Rasm */}
                                    <Box
                                        component="div"
                                        className="salon-row-img"
                                        style={{ backgroundImage: `url(${imgUrl(salon.salonImages?.[0])})` }}
                                        onClick={() => router.push(`/salons/${salon._id}`)}
                                    />

                                    {/* Nomi / kategoriya / manzil */}
                                    <Stack className="salon-row-info" flex={1}>
                                        <Typography className="salon-row-name" onClick={() => router.push(`/salons/${salon._id}`)}>
                                            {salon.salonTitle}
                                        </Typography>
                                        <Box component="div" className="salon-row-chip">
                                            {TYPE_EMOJI[salon.salonType]} {t(salon.salonType)}
                                        </Box>
                                        <Stack direction="row" alignItems="center" gap={0.5} className="salon-row-address-row">
                                            <LocationOnIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
                                            <Typography className="salon-row-address">{salon.salonAddress}</Typography>
                                        </Stack>
                                    </Stack>

                                    {/* Statistika */}
                                    <Stack className="salon-row-stats">
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <RemoveRedEyeIcon sx={{ fontSize: 16, color: '#999' }} />
                                            <Typography className="stat-text">{formatCount(salon.salonViews)} {t('views')}</Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.75 }}>
                                            <FavoriteIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
                                            <Typography className="stat-text">{formatCount(salon.salonLikes)} {t('likes')}</Typography>
                                        </Stack>
                                    </Stack>

                                    {/* Status badge */}
                                    <Box component="div" className="salon-row-status-col">
                                        <Chip label={t(salon.salonStatus)} size="small" className={`status-badge ${salon.salonStatus.toLowerCase()}`} />
                                    </Box>

                                    {/* Manage Services — har doim ko'rinadi */}
                                    <Button
                                        className="manage-services-btn"
                                        startIcon={<ContentCutOutlinedIcon sx={{ fontSize: 15 }} />}
                                        onClick={() => router.push({ pathname: '/mypage', query: { category: 'myServices', salonId: salon._id, salonTitle: salon.salonTitle } })}
                                    >
                                        {t('Manage Services')}
                                    </Button>

                                    {/* Edit/Delete — faqat ACTIVE holatda (Nestar konventsiyasi) */}
                                    {isActive && (
                                        <Stack direction="row" alignItems="center" gap={0.75} className="salon-row-actions">
                                            <IconButton className="salon-action-btn edit" onClick={() => editSalonHandler(salon._id)}>
                                                <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <IconButton className="salon-action-btn delete" onClick={() => deleteSalonHandler(salon._id)}>
                                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Stack>
                                    )}
                                </Stack>
                            );
                        })}
                    </Stack>

                    {salons.length !== 0 && (
                        <Stack alignItems="center" sx={{ mt: 4 }}>
                            <MuiPagination
                                page={searchFilter.page}
                                count={Math.ceil(total / limit)}
                                onChange={paginationHandler}
                                shape="circular"
                                sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
                            />
                        </Stack>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default MySalons;

MySalons.defaultProps = {
    initialInput: {
        page: 1,
        limit,
        search: { salonStatus: SalonStatus.ACTIVE },
    },
};