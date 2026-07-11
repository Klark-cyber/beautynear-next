import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, Chip, Button, IconButton, Pagination as MuiPagination } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { useMutation, useQuery } from '@apollo/client';
import { GET_AGENT_SERVICES } from '../../../apollo/user/query';
import { UPDATE_SERVICE } from '../../../apollo/user/mutation';
import EmptyList from '../common/Emptylist';
import { Service } from '../../types/service/service';
import { AgentServicesInquiry } from '../../types/service/service.input';
import { ServiceStatus } from '../../enums/service.enum';
import { T } from '../../types/common';
import { REACT_APP_API_URL } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

const imgUrl = (raw?: string): string => {
    if (!raw) return '/img/banner/default.jpg';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const TYPE_EMOJI: Record<string, string> = {
    HAIR: '✂️',
    NAIL: '💅',
    SKIN: '🧴',
    CLINIC: '💉',
    MASSAGE: '🪷',
};

const STATUS_TABS = [
    { label: 'Active', value: ServiceStatus.ACTIVE },
    { label: 'Inactive', value: ServiceStatus.INACTIVE },
];

const limit = 6;

const MyServices: NextPage = ({
    initialInput = { page: 1, limit, search: { serviceStatus: ServiceStatus.ACTIVE } },
    ...props
}: any) => {
    const router = useRouter();
    const { t } = useTranslation('common');
    const { salonId, salonTitle } = router.query;

    const [searchFilter, setSearchFilter] = useState<AgentServicesInquiry>(initialInput);
    const [allServices, setAllServices] = useState<Service[]>([]);

    /** APOLLO REQUESTS **/
    const [updateService] = useMutation(UPDATE_SERVICE);

    const { refetch } = useQuery(GET_AGENT_SERVICES, {
        fetchPolicy: 'network-only',
        variables: { input: searchFilter },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setAllServices(data?.getAgentServices?.list ?? []);
        },
    });

    // Backend'da salonId bo'yicha filtr yo'qligi sababli — shu salonga
    // tegishli xizmatlarni FRONTEND'da ajratamiz (vaqtinchalik yechim)
    const salonServices = salonId ? allServices.filter((svc) => svc.salonId === salonId) : allServices;

    /** HANDLERS **/
    const tabChangeHandler = (status: ServiceStatus) => {
        setSearchFilter({ ...searchFilter, page: 1, search: { serviceStatus: status } });
    };

    const paginationHandler = (_e: any, value: number) => {
        setSearchFilter({ ...searchFilter, page: value });
    };

    const goAddService = () => {
        router.push({ pathname: '/mypage', query: { category: 'addService', salonId, salonTitle } });
    };

    const editServiceHandler = (id: string) => {
        router.push({ pathname: '/mypage', query: { category: 'addService', salonId, salonTitle, serviceId: id } });
    };

    const deleteServiceHandler = async (id: string) => {
        try {
            if (await sweetConfirmAlert('Are you sure to delete this service?')) {
                await updateService({ variables: { input: { _id: id, serviceStatus: ServiceStatus.DELETE } } });
                await refetch({ input: searchFilter });
            }
        } catch (err: any) {
            await sweetErrorHandling(err);
        }
    };

    const activeStatus = searchFilter.search.serviceStatus;

    return (
        <Box component="div" className="mypage-content">
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" className="services-header-row">
                <Box component="div">
                    <Typography className="content-title">{t('Services')}</Typography>
                    <Typography className="content-subtitle">
                        {salonTitle ? `${t('Managing services for')} ${salonTitle}` : t('Manage your service listings')}
                    </Typography>
                </Box>
                <Button className="add-service-btn" startIcon={<AddIcon />} onClick={goAddService}>
                    {t('Add New Service')}
                </Button>
            </Stack>

            <Stack direction="row" gap={1.5} className="filter-tabs">
                {STATUS_TABS.map((tab) => (
                    <Box
                        key={tab.value}
                        component="div"
                        className={`filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
                        onClick={() => tabChangeHandler(tab.value)}
                    >
                        {t(tab.label)}
                    </Box>
                ))}
            </Stack>

            {salonServices.length === 0 ? (
                <Box component="div" className="follow-page-frame">
                    <EmptyList
                        emoji="✂️"
                        title={t('No services yet')}
                        desc={t('Add your first service to start receiving bookings')}
                    />
                    <Stack alignItems="center" sx={{ mt: 2 }}>
                        <Button className="add-service-btn" onClick={goAddService}>
                            {t('Add Your First Service')}
                        </Button>
                    </Stack>
                </Box>
            ) : (
                <Box component="div" className="follow-page-frame">
                    <Stack className="service-list">
                        {salonServices.map((svc) => (
                            <Stack key={svc._id} direction="row" alignItems="center" className="service-row">
                                <Box
                                    component="div"
                                    className="service-row-img"
                                    style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }}
                                />

                                <Stack className="service-row-info" flex={1}>
                                    <Typography className="service-row-name">{svc.serviceTitle}</Typography>
                                    <Box component="div" className="service-row-chip">
                                        {TYPE_EMOJI[svc.serviceType]} {t(svc.serviceType)}
                                    </Box>
                                    <Stack direction="row" alignItems="center" gap={0.5} className="service-row-duration-row">
                                        <AccessTimeIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
                                        <Typography className="service-row-duration">{svc.serviceDuration} {t('min')}</Typography>
                                    </Stack>
                                </Stack>

                                <Box className="service-row-price">
                                    <Typography>₩{formatPrice(svc.servicePrice)}</Typography>
                                </Box>

                                <Box component="div" className="service-row-status-col">
                                    <Chip
                                        label={t(svc.serviceStatus)}
                                        size="small"
                                        className={`status-badge ${svc.serviceStatus.toLowerCase()}`}
                                    />
                                </Box>

                                <Stack direction="row" alignItems="center" gap={0.75} className="service-row-actions">
                                    <IconButton className="service-action-btn edit" onClick={() => editServiceHandler(svc._id)}>
                                        <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton className="service-action-btn delete" onClick={() => deleteServiceHandler(svc._id)}>
                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>

                    {salonServices.length !== 0 && (
                        <Stack alignItems="center" sx={{ mt: 4 }}>
                            <MuiPagination
                                page={searchFilter.page}
                                count={Math.ceil(salonServices.length / limit) || 1}
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

export default MyServices;