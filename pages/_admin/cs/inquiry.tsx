import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, OutlinedInput, InputAdornment, TablePagination, Select, MenuItem, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_INQUIRIES_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_INQUIRY_BY_ADMIN } from '../../../apollo/admin/mutation';
import { InquiryList } from '../../../libs/components/admin/cs/InquiryList';
import { T } from '../../../libs/types/common';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';

const STATUS_TABS = [
	{ label: 'All', value: undefined },
	{ label: 'Waiting', value: 'WAITING' },
	{ label: 'Answered', value: 'ANSWERED' },
	{ label: 'Closed', value: 'CLOSED' },
];

const limit = 10;

// ⚠️ MUHIM: bu sahifa avval "Users" jadvalidan nusxa kochirilgan,
// hech qanday haqiqiy sorovga ega bolmagan holat edi. Notice/FAQ bilan
// bir xil naqsh boyicha toliq qayta qurildi — faqat bu yerda ADMIN
// javob YOZADI (create/delete emas).

const AdminInquiry: NextPage = () => {
	const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
	const [searchText, setSearchText] = useState('');
	const [inquiries, setInquiries] = useState<any[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(limit);

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [replyText, setReplyText] = useState('');

	/** APOLLO REQUESTS **/
	const [updateInquiry] = useMutation(UPDATE_INQUIRY_BY_ADMIN);

	const buildSearch = (): T => {
		const search: T = {};
		if (activeStatus) search.inquiryStatus = activeStatus;
		if (searchText.trim()) search.text = searchText.trim();
		return search;
	};

	const { refetch } = useQuery(GET_ALL_INQUIRIES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } },
		onCompleted: (data: T) => {
			setInquiries(data?.getAllInquiriesByAdmin?.list ?? []);
			setTotal(data?.getAllInquiriesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useEffect(() => {
		refetch({ input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
			setInquiries(data?.getAllInquiriesByAdmin?.list ?? []);
			setTotal(data?.getAllInquiriesByAdmin?.metaCounter?.[0]?.total ?? 0);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeStatus, page, rowsPerPage]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setPage(0);
			refetch({ input: { page: 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
				setInquiries(data?.getAllInquiriesByAdmin?.list ?? []);
				setTotal(data?.getAllInquiriesByAdmin?.metaCounter?.[0]?.total ?? 0);
			});
		}, 400);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchText]);

	const refetchList = async () => {
		const { data } = await refetch({ input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } });
		setInquiries(data?.getAllInquiriesByAdmin?.list ?? []);
		setTotal(data?.getAllInquiriesByAdmin?.metaCounter?.[0]?.total ?? 0);
	};

	/** HANDLERS **/
	const selectHandler = (inquiry: any) => {
		setSelectedId(inquiry._id);
		setReplyText(inquiry.inquiryReply ?? '');
	};

	const closeSidePanel = () => {
		setSelectedId(null);
		setReplyText('');
	};

	const selected = inquiries.find((i) => i._id === selectedId);

	const sendReplyHandler = async () => {
		if (!replyText.trim() || !selectedId) return;
		try {
			await updateInquiry({ variables: { input: { _id: selectedId, inquiryReply: replyText, inquiryStatus: 'ANSWERED' } } });
			await sweetMixinSuccessAlert('Reply sent successfully.');
			await refetchList();
			closeSidePanel();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const changeStatusHandler = async (status: string) => {
		if (!selectedId) return;
		try {
			await updateInquiry({ variables: { input: { _id: selectedId, inquiryStatus: status } } });
			await refetchList();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component="div" className="admin-content">
			<Typography className="admin-page-title">Support Inquiries</Typography>
			<Typography className="admin-page-subtitle">View and respond to user support messages</Typography>

			<Stack direction="row" gap={1.5} className="admin-filter-tabs">
				{STATUS_TABS.map((tab) => (
					<Box
						key={tab.label}
						component="div"
						className={`admin-filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
						onClick={() => setActiveStatus(tab.value)}
					>
						{tab.label}
					</Box>
				))}
			</Stack>

			<Stack direction="row" className="admin-search-row">
				<OutlinedInput
					className="admin-search-input"
					placeholder="Search by subject..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 20 }} /></InputAdornment>}
				/>
			</Stack>

			<Stack direction="row" gap={3} alignItems="flex-start">
				<Box component="div" className="admin-table-frame" sx={{ flex: 1 }}>
					<InquiryList inquiries={inquiries} onSelect={selectHandler} selectedId={selectedId} />
					<TablePagination
						rowsPerPageOptions={[10, 20, 40]}
						component="div"
						count={total}
						rowsPerPage={rowsPerPage}
						page={page}
						onPageChange={(_, newPage) => setPage(newPage)}
						onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
					/>
				</Box>

				{selected && (
					<Box component="div" className="admin-side-form">
						<Typography className="form-title">{selected.inquirySubject}</Typography>

						<Typography className="form-label">From</Typography>
						<Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#333' }}>
							{selected.memberData?.memberNick} · {selected.memberData?.memberPhone}
						</Typography>

						<Typography className="form-label">Message</Typography>
						<Box component="div" sx={{ background: '#FAFAFA', borderRadius: 2, padding: '12px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#444', lineHeight: 1.6 }}>
							{selected.inquiryMessage}
						</Box>

						<Typography className="form-label">Status</Typography>
						<Select fullWidth className="form-select" value={selected.inquiryStatus} onChange={(e) => changeStatusHandler(e.target.value)}>
							<MenuItem value="WAITING">Waiting</MenuItem>
							<MenuItem value="ANSWERED">Answered</MenuItem>
							<MenuItem value="CLOSED">Closed</MenuItem>
						</Select>

						<Typography className="form-label">Reply</Typography>
						<textarea
							className="form-textarea tall"
							value={replyText}
							onChange={(e) => setReplyText(e.target.value)}
							placeholder="Write your reply..."
						/>

						<Stack direction="row" gap={1.5} sx={{ mt: 2.5 }}>
							<Button className="form-cancel-btn" onClick={closeSidePanel}>Close</Button>
							<Button className="form-save-btn" onClick={sendReplyHandler}>Send Reply</Button>
						</Stack>
					</Box>
				)}
			</Stack>
		</Box>
	);
};

export default withAdminLayout(AdminInquiry);