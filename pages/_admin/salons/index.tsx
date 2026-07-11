import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Select, MenuItem, Pagination as MuiPagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_SALONS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_SALON_BY_ADMIN, REMOVE_SALON_BY_ADMIN } from '../../../apollo/admin/mutation';
import SalonList from '../../../libs/components/admin/salons/SalonList';
import { AllSalonsInquiry } from '../../../libs/types/salon/salon.input';
import { Salon } from '../../../libs/types/salon/salon';
import { SalonLocation, SalonStatus } from '../../../libs/enums/salon.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

const STATUS_TABS = [
	{ label: 'All', value: undefined },
	{ label: 'Active', value: SalonStatus.ACTIVE },
	{ label: 'Paused', value: SalonStatus.PAUSE },
	{ label: 'Inactive', value: SalonStatus.INACTIVE },
	{ label: 'Deleted', value: SalonStatus.DELETE },
];

const AdminSalons: NextPage = ({
	initialInquiry = { page: 1, limit: 15, sort: 'createdAt', direction: 'DESC', search: {} },
	...props
}: any) => {
	const [salonsInquiry, setSalonsInquiry] = useState<AllSalonsInquiry>(initialInquiry);
	const [salons, setSalons] = useState<Salon[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [regionFilter, setRegionFilter] = useState<string>('ALL');
	const [anchorEl, setAnchorEl] = useState<any[]>([]);

	/** APOLLO REQUESTS **/
	const [updateSalonByAdmin] = useMutation(UPDATE_SALON_BY_ADMIN);
	const [removeSalonByAdmin] = useMutation(REMOVE_SALON_BY_ADMIN);

	const { refetch } = useQuery(GET_ALL_SALONS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: salonsInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setSalons(data?.getAllSalonsByAdmin?.list ?? []);
			setTotal(data?.getAllSalonsByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const tabChangeHandler = (status: SalonStatus | undefined) => {
		const search: T = { ...salonsInquiry.search };
		if (status) search.salonStatus = status;
		else delete search.salonStatus;
		setSalonsInquiry({ ...salonsInquiry, page: 1, search });
	};

	const regionChangeHandler = (region: string) => {
		setRegionFilter(region);
		const search: T = { ...salonsInquiry.search };
		if (region !== 'ALL') search.salonLocationList = [region as SalonLocation];
		else delete search.salonLocationList;
		setSalonsInquiry({ ...salonsInquiry, page: 1, search });
	};

	const paginationHandler = (_e: any, value: number) => {
		setSalonsInquiry({ ...salonsInquiry, page: value });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const temp = anchorEl.slice();
		temp[index] = e.currentTarget;
		setAnchorEl(temp);
	};

	const menuIconCloseHandler = () => setAnchorEl([]);

	const updateSalonHandler = async (updateData: { _id: string; salonStatus: SalonStatus }) => {
		// ⚠️ Menyu tasdiqlash oynasidan OLDIN yopiladi — Services'dagi bilan
		// bir xil sabab (MUI Menu + SweetAlert to'qnashuvi)
		menuIconCloseHandler();
		try {
			if (await sweetConfirmAlert(`Are you sure to change status to ${updateData.salonStatus}?`)) {
				await updateSalonByAdmin({ variables: { input: updateData } });
				await refetch({ input: salonsInquiry });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	// Faqat DELETE holatidagi (soft-deleted) salonlarni butunlay o'chirish uchun
	const removeSalonHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Are you sure to permanently remove this salon?')) {
				await removeSalonByAdmin({ variables: { input: id } });
				await refetch({ input: salonsInquiry });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const activeStatus = salonsInquiry.search.salonStatus;

	return (
		<Box component="div" className="admin-content">
			<Typography className="admin-page-title">Salon Management</Typography>
			<Typography className="admin-page-subtitle">Manage all salon listings on the platform</Typography>

			{/* Status tablar */}
			<Stack direction="row" gap={1.5} className="admin-filter-tabs">
				{STATUS_TABS.map((tab) => (
					<Box
						key={tab.label}
						component="div"
						className={`admin-filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
						onClick={() => tabChangeHandler(tab.value)}
					>
						{tab.label}
					</Box>
				))}
			</Stack>

			{/* Region filtri */}
			<Stack direction="row" gap={2} className="admin-search-row">
				<Select className="admin-select" value={regionFilter} onChange={(e) => regionChangeHandler(e.target.value)}>
					<MenuItem value="ALL">All Regions</MenuItem>
					{Object.values(SalonLocation)
						.filter((loc) => loc !== SalonLocation.ALL)
						.map((loc) => (
							<MenuItem key={loc} value={loc}>{loc}</MenuItem>
						))}
				</Select>
			</Stack>

			{/* Jadval */}
			<Box component="div" className="admin-table-frame">
				<SalonList
					salons={salons}
					anchorEl={anchorEl}
					menuIconClickHandler={menuIconClickHandler}
					menuIconCloseHandler={menuIconCloseHandler}
					updateSalonHandler={updateSalonHandler}
					removeSalonHandler={removeSalonHandler}
				/>

				{salons.length !== 0 && (
					<Stack alignItems="center" sx={{ mt: 3 }}>
						<MuiPagination
							page={salonsInquiry.page}
							count={Math.ceil(total / salonsInquiry.limit)}
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

AdminSalons.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 15,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminSalons);