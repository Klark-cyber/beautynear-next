import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import { useMutation, useQuery } from '@apollo/client';
import { GET_AGENT_SERVICES } from '../../../apollo/user/query';
import { UPDATE_SERVICE } from '../../../apollo/user/mutation';
import { Service } from '../../types/service/service';
import { ServiceStatus } from '../../enums/service.enum';
import { T } from '../../types/common';
import { REACT_APP_API_URL } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};
const formatPrice = (n?: number): string => (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const TYPE_EMOJI: Record<string, string> = {
    HAIR: '✂️',
    NAIL: '💅',
    SKIN: '🧴',
    CLINIC: '💉',
    MASSAGE: '🪷',
};

const STATUS_TABS: { label: string; value?: ServiceStatus }[] = [
    { label: 'All', value: undefined },
    { label: 'Active', value: ServiceStatus.ACTIVE },
    { label: 'Inactive', value: ServiceStatus.INACTIVE },
    { label: 'Deleted', value: ServiceStatus.DELETE },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

// ⚠️ MUHIM: Desktop MyServices.tsx bilan bir xil mantiq — jumladan
// backend salonId bo'yicha filtrlay olmasligi sababli, CLIENT tomonda
// filtrlanadi (Desktop'dagi bilan bir xil vaqtinchalik yechim).

const MobileMyServices = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const salonId = router.query.salonId as string | undefined;
    const salonTitle = router.query.salonTitle as string | undefined;

    const [activeStatus, setActiveStatus] = useState<ServiceStatus | undefined>(undefined);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const [updateService] = useMutation(UPDATE_SERVICE);

    const { refetch } = useQuery(GET_AGENT_SERVICES, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 100, search: activeStatus ? { serviceStatus: activeStatus } : {} } },
        onCompleted: (data: T) => setAllServices(data?.getAgentServices?.list ?? []),
    });

    useEffect(() => {
        refetch({ input: { page: 1, limit: 100, search: activeStatus ? { serviceStatus: activeStatus } : {} } }).then(({ data }) => {
            setAllServices(data?.getAgentServices?.list ?? []);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStatus]);

    // ⚠️ Client-tomon filtri (backend salonId bo'yicha filtrlay olmaydi)
    const services = salonId ? allServices.filter((s) => s.salonId === salonId) : allServices;

    /** HANDLERS **/
    const goAddService = () => {
        const query: T = { category: 'addService' };
        if (salonId) query.salonId = salonId;
        if (salonTitle) query.salonTitle = salonTitle;
        router.push({ pathname: '/mypage', query });
    };

    const editServiceHandler = (id: string) => {
        const query: T = { category: 'addService', serviceId: id };
        if (salonId) query.salonId = salonId;
        if (salonTitle) query.salonTitle = salonTitle;
        router.push({ pathname: '/mypage', query });
    };

    const refetchList = async () => {
        const { data } = await refetch({ input: { page: 1, limit: 100, search: activeStatus ? { serviceStatus: activeStatus } : {} } });
        setAllServices(data?.getAgentServices?.list ?? []);
    };

    const pauseServiceHandler = async (id: string, currentlyInactive: boolean) => {
        try {
            await updateService({ variables: { input: { _id: id, serviceStatus: currentlyInactive ? ServiceStatus.ACTIVE : ServiceStatus.INACTIVE } } });
            await refetchList();
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
        setOpenMenuId(null);
    };

    const deleteServiceHandler = async (id: string) => {
        setOpenMenuId(null);
        try {
            if (await sweetConfirmAlert(t('Are you sure to delete this service?'))) {
                await updateService({ variables: { input: { _id: id, serviceStatus: ServiceStatus.DELETE } } });
                await refetchList();
            }
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    return (
        <Box component="div" id="mobile-myservices">
            {/* ═══ SALON KONTEKSTI (agar filtr bo'lsa) ═══ */}
            {salonId && salonTitle && (
                <Box component="div" className="mv-salon-context">
                    <Typography className="mv-salon-context-label">{t('Managing services for')}</Typography>
                    <Typography className="mv-salon-context-title">{decodeURIComponent(salonTitle)}</Typography>
                </Box>
            )}

            {/* ═══ + QOSHISH TUGMASI ═══ */}
            <Box component="div" className="mv-add-btn" onClick={goAddService}>
                <AddIcon sx={{ fontSize: 18 }} />
                {t('Add New Service')}
            </Box>

            {/* ═══ STATUS TABS ═══ */}
            <Stack direction="row" className="mv-tabs">
                {STATUS_TABS.map((tab) => (
                    <Box
                        key={tab.label}
                        component="div"
                        className={`mv-tab ${activeStatus === tab.value ? 'active' : ''}`}
                        onClick={() => setActiveStatus(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            {/* ═══ XIZMATLAR RO'YXATI ═══ */}
            <Stack className="mv-list">
                {services.length === 0 && (
                    <Stack alignItems="center" className="mv-empty">
                        <Typography className="mv-empty-emoji">✂️</Typography>
                        <Typography className="mv-empty-title">{t('No services yet')}</Typography>
                        <Box component="div" className="mv-empty-btn" onClick={goAddService}>{t('Add Your First Service')}</Box>
                    </Stack>
                )}

                {services.map((svc) => {
                    const isActive = svc.serviceStatus === ServiceStatus.ACTIVE;
                    const isDeleted = svc.serviceStatus === ServiceStatus.DELETE;

                    return (
                        <Stack key={svc._id} direction="row" className="mv-card">
                            <Box component="div" className="mv-card-img" style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }} onClick={() => !isDeleted && editServiceHandler(svc._id)} />
                            <Box className="mv-card-body">
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography className="mv-svc-name">{svc.serviceTitle}</Typography>
                                    <Box component="div" className={`mv-status-badge ${svc.serviceStatus?.toLowerCase()}`}>{t(svc.serviceStatus)}</Box>
                                </Stack>
                                <Box component="div" className="mv-type-chip">{TYPE_EMOJI[svc.serviceType]} {t(svc.serviceType)}</Box>

                                <Stack direction="row" alignItems="center" justifyContent="space-between" className="mv-bottom-row">
                                    <Stack direction="row" alignItems="center" gap={1.25}>
                                        <Typography className="mv-price">₩{formatPrice(svc.servicePrice)}</Typography>
                                        <Stack direction="row" alignItems="center" gap={0.3}>
                                            <AccessTimeIcon sx={{ fontSize: 12, color: '#999' }} />
                                            <Typography className="mv-duration">{svc.serviceDuration}{t('min')}</Typography>
                                        </Stack>
                                    </Stack>

                                    {!isDeleted && (
                                        <IconButton className="mv-menu-btn" onClick={() => setOpenMenuId((p) => (p === svc._id ? null : svc._id))}>
                                            <MoreVertIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    )}
                                </Stack>

                                {openMenuId === svc._id && (
                                    <Stack className="mv-menu-dropdown" onClick={(e: any) => e.stopPropagation()}>
                                        <Box component="div" className="mv-menu-item" onClick={() => editServiceHandler(svc._id)}>
                                            <EditOutlinedIcon sx={{ fontSize: 15 }} /> {t('Edit')}
                                        </Box>
                                        <Box component="div" className="mv-menu-item" onClick={() => pauseServiceHandler(svc._id, !isActive)}>
                                            <PauseCircleOutlineIcon sx={{ fontSize: 15 }} /> {t(isActive ? 'Deactivate' : 'Activate')}
                                        </Box>
                                        <Box component="div" className="mv-menu-item danger" onClick={() => deleteServiceHandler(svc._id)}>
                                            <DeleteOutlineIcon sx={{ fontSize: 15 }} /> {t('Delete')}
                                        </Box>
                                    </Stack>
                                )}
                            </Box>
                        </Stack>
                    );
                })}
            </Stack>
        </Box>
    );
};

export default MobileMyServices;