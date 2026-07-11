import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Chip, TextField, Select, MenuItem, Pagination as MuiPagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import MemberList from '../../../libs/components/admin/users/MemberList';
import { MembersInquiry } from '../../../libs/types/member/member.input';
import { Member } from '../../../libs/types/member/member';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { T } from '../../../libs/types/common';
import { sweetErrorHandling } from '../../../libs/sweetAlert';

const STATUS_TABS = [
	{ label: 'All', value: undefined },
	{ label: 'Active', value: MemberStatus.ACTIVE },
	{ label: 'Inactive', value: MemberStatus.INACTIVE },
	{ label: 'Paused', value: MemberStatus.PAUSE },
	{ label: 'Deleted', value: MemberStatus.DELETE },
];

const AdminMembers: NextPage = ({
	initialInquiry = { page: 1, limit: 15, sort: 'createdAt', direction: 'DESC', search: {} },
	...props
}: any) => {
	const [membersInquiry, setMembersInquiry] = useState<MembersInquiry>(initialInquiry);
	const [members, setMembers] = useState<Member[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchText, setSearchText] = useState<string>('');
	const [typeFilter, setTypeFilter] = useState<string>('ALL');
	const [anchorEl, setAnchorEl] = useState<any[]>([]);

	/** APOLLO REQUESTS **/
	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);

	const { refetch } = useQuery(GET_ALL_MEMBERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: membersInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMembers(data?.getAllMembersByAdmin?.list ?? []);
			setTotal(data?.getAllMembersByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const tabChangeHandler = (status: MemberStatus | undefined) => {
		const search: T = { ...membersInquiry.search };
		if (status) search.memberStatus = status;
		else delete search.memberStatus;
		setMembersInquiry({ ...membersInquiry, page: 1, search });
	};

	const typeChangeHandler = (type: string) => {
		setTypeFilter(type);
		const search: T = { ...membersInquiry.search };
		if (type !== 'ALL') search.memberType = type as MemberType;
		else delete search.memberType;
		setMembersInquiry({ ...membersInquiry, page: 1, search });
	};

	const searchTextHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key !== 'Enter') return;
		setMembersInquiry({ ...membersInquiry, page: 1, search: { ...membersInquiry.search, text: searchText } });
	};

	const paginationHandler = (_e: any, value: number) => {
		setMembersInquiry({ ...membersInquiry, page: value });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const temp = anchorEl.slice();
		temp[index] = e.currentTarget;
		setAnchorEl(temp);
	};

	const menuIconCloseHandler = () => setAnchorEl([]);

	const updateMemberHandler = async (updateData: { _id: string; memberType?: MemberType; memberStatus?: MemberStatus }) => {
		try {
			await updateMemberByAdmin({ variables: { input: updateData } });
			menuIconCloseHandler();
			await refetch({ input: membersInquiry });
		} catch (err: any) {
			menuIconCloseHandler();
			sweetErrorHandling(err).then();
		}
	};

	const activeStatus = membersInquiry.search.memberStatus;

	return (
		<Box component="div" className="admin-content">
			<Typography className="admin-page-title">Member Management</Typography>
			<Typography className="admin-page-subtitle">Manage all users, agents, and admins on the platform</Typography>

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

			{/* Qidiruv + Type filtri */}
			<Stack direction="row" gap={2} className="admin-search-row">
				<Box component="div" className="admin-search-input">
					<SearchIcon sx={{ fontSize: 18, color: '#999' }} />
					<input
						placeholder="Search by nickname..."
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						onKeyDown={searchTextHandler}
					/>
				</Box>
				<Select
					className="admin-select"
					value={typeFilter}
					onChange={(e) => typeChangeHandler(e.target.value)}
				>
					<MenuItem value="ALL">All Types</MenuItem>
					<MenuItem value={MemberType.USER}>User</MenuItem>
					<MenuItem value={MemberType.AGENT}>Agent</MenuItem>
					<MenuItem value={MemberType.ADMIN}>Admin</MenuItem>
				</Select>
			</Stack>

			{/* Jadval */}
			<Box component="div" className="admin-table-frame">
				<MemberList
					members={members}
					anchorEl={anchorEl}
					menuIconClickHandler={menuIconClickHandler}
					menuIconCloseHandler={menuIconCloseHandler}
					updateMemberHandler={updateMemberHandler}
				/>

				{members.length !== 0 && (
					<Stack alignItems="center" sx={{ mt: 3 }}>
						<MuiPagination
							page={membersInquiry.page}
							count={Math.ceil(total / membersInquiry.limit)}
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

AdminMembers.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 15,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminMembers);