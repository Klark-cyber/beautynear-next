import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Select, MenuItem, Pagination as MuiPagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_SERVICES_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_SERVICE_BY_ADMIN, REMOVE_SERVICE_BY_ADMIN } from '../../../apollo/admin/mutation';
import ServiceList from '../../../libs/components/admin/services/ServiceList';
import { AllServicesInquiry } from '../../../libs/types/service/service.input';
import { Service } from '../../../libs/types/service/service';
import { ServiceStatus, ServiceType } from '../../../libs/enums/service.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

const STATUS_TABS = [
    { label: 'All', value: undefined },
    { label: 'Active', value: ServiceStatus.ACTIVE },
    { label: 'Inactive', value: ServiceStatus.INACTIVE },
    { label: 'Deleted', value: ServiceStatus.DELETE },
];

const AdminServices: NextPage = ({
    initialInquiry = { page: 1, limit: 15, sort: 'createdAt', direction: 'DESC', search: {} },
    ...props
}: any) => {
    const [servicesInquiry, setServicesInquiry] = useState<AllServicesInquiry>(initialInquiry);
    const [services, setServices] = useState<Service[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [anchorEl, setAnchorEl] = useState<any[]>([]);

    /** APOLLO REQUESTS **/
    const [updateServiceByAdmin] = useMutation(UPDATE_SERVICE_BY_ADMIN);
    const [removeServiceByAdmin] = useMutation(REMOVE_SERVICE_BY_ADMIN);

    const { refetch } = useQuery(GET_ALL_SERVICES_BY_ADMIN, {
        fetchPolicy: 'network-only',
        variables: { input: servicesInquiry },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setServices(data?.getAllServicesByAdmin?.list ?? []);
            setTotal(data?.getAllServicesByAdmin?.metaCounter?.[0]?.total ?? 0);
        },
    });

    /** HANDLERS **/
    const tabChangeHandler = (status: ServiceStatus | undefined) => {
        const search: T = { ...servicesInquiry.search };
        if (status) search.serviceStatus = status;
        else delete search.serviceStatus;
        setServicesInquiry({ ...servicesInquiry, page: 1, search });
    };

    const typeChangeHandler = (type: string) => {
        setTypeFilter(type);
        const search: T = { ...servicesInquiry.search };
        if (type !== 'ALL') search.typeList = [type as ServiceType];
        else delete search.typeList;
        setServicesInquiry({ ...servicesInquiry, page: 1, search });
    };

    const paginationHandler = (_e: any, value: number) => {
        setServicesInquiry({ ...servicesInquiry, page: value });
    };

    const menuIconClickHandler = (e: any, index: number) => {
        const temp = anchorEl.slice();
        temp[index] = e.currentTarget;
        setAnchorEl(temp);
    };

    const menuIconCloseHandler = () => setAnchorEl([]);

    const updateServiceHandler = async (updateData: { _id: string; serviceStatus: ServiceStatus }) => {
        // ⚠️ Menyu (Status dropdown) tasdiqlash oynasidan OLDIN yopiladi —
        // aks holda MUI Menu'ning orqa foni SweetAlert bilan to'qnashib,
        // "OK" tugmasini ikki marta bosish talab qilinadi
        menuIconCloseHandler();
        try {
            if (await sweetConfirmAlert(`Are you sure to change status to ${updateData.serviceStatus}?`)) {
                await updateServiceByAdmin({ variables: { input: updateData } });
                await refetch({ input: servicesInquiry });
            }
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    // Faqat DELETE holatidagi (soft-deleted) xizmatlarni butunlay o'chirish uchun
    const removeServiceHandler = async (id: string) => {
        try {
            if (await sweetConfirmAlert('Are you sure to permanently remove this service?')) {
                await removeServiceByAdmin({ variables: { input: id } });
                await refetch({ input: servicesInquiry });
            }
        } catch (err: any) {
            sweetErrorHandling(err).then();
        }
    };

    return (
        <Box component="div" className="admin-content">
            <Typography className="admin-page-title">Service Management</Typography>
            <Typography className="admin-page-subtitle">Manage all services offered across salons</Typography>

            {/* Status tablar — endi backend AllServicesInquiry orqali qollab-quvvatlaydi */}
            <Stack direction="row" gap={1.5} className="admin-filter-tabs">
                {STATUS_TABS.map((tab) => (
                    <Box
                        key={tab.label}
                        component="div"
                        className={`admin-filter-tab ${servicesInquiry.search.serviceStatus === tab.value ? 'active' : ''}`}
                        onClick={() => tabChangeHandler(tab.value)}
                    >
                        {tab.label}
                    </Box>
                ))}
            </Stack>

            {/* Type filtri */}
            <Stack direction="row" gap={2} className="admin-search-row">
                <Select className="admin-select" value={typeFilter} onChange={(e) => typeChangeHandler(e.target.value)}>
                    <MenuItem value="ALL">All Types</MenuItem>
                    {Object.values(ServiceType).map((type) => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                </Select>
            </Stack>

            {/* Jadval */}
            <Box component="div" className="admin-table-frame">
                <ServiceList
                    services={services}
                    anchorEl={anchorEl}
                    menuIconClickHandler={menuIconClickHandler}
                    menuIconCloseHandler={menuIconCloseHandler}
                    updateServiceHandler={updateServiceHandler}
                    removeServiceHandler={removeServiceHandler}
                />

                {services.length !== 0 && (
                    <Stack alignItems="center" sx={{ mt: 3 }}>
                        <MuiPagination
                            page={servicesInquiry.page}
                            count={Math.ceil(total / servicesInquiry.limit)}
                            onChange={paginationHandler}
                            shape="circular"
                            sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
                        />
                    </Stack>
                )}
            </Box>
        </Box>
    );
};

AdminServices.defaultProps = {
    initialInquiry: {
        page: 1,
        limit: 15,
        sort: 'createdAt',
        direction: 'DESC',
        search: {},
    },
};

export default withAdminLayout(AdminServices);