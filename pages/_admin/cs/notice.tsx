import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Button, OutlinedInput, InputAdornment, Select, MenuItem, TablePagination, Switch } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/Search';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_NOTICES_BY_ADMIN } from '../../../apollo/admin/query';
import { CREATE_NOTICE_BY_ADMIN, UPDATE_NOTICE_BY_ADMIN, REMOVE_NOTICE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { NoticeList } from '../../../libs/components/admin/cs/NoticeList';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';

// ⚠️ TUZATILDI: "Deleted" tab olib tashlandi — backend'dagi
// removeNoticeByAdmin HAQIQIY (qattiq) o'chirish qiladi, shuning uchun
// "DELETE" statusidagi yozuvlar hech qachon mavjud bo'lmaydi.
const STATUS_TABS = [
	{ label: 'All', value: undefined },
	{ label: 'Active', value: 'ACTIVE' },
];

const TYPE_OPTIONS = ['NOTICE', 'EVENT', 'WARNING'];

const DEFAULT_FORM = { noticeType: 'NOTICE', noticeTitle: '', noticeContent: '', noticePinned: false };

const limit = 10;

const AdminNotice: NextPage = () => {
	const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
	const [searchText, setSearchText] = useState('');
	const [notices, setNotices] = useState<any[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(limit);

	const [formOpen, setFormOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form, setForm] = useState(DEFAULT_FORM);

	/** APOLLO REQUESTS **/
	const [createNotice] = useMutation(CREATE_NOTICE_BY_ADMIN);
	const [updateNotice] = useMutation(UPDATE_NOTICE_BY_ADMIN);
	const [removeNotice] = useMutation(REMOVE_NOTICE_BY_ADMIN);

	const buildSearch = (): T => {
		const search: T = {};
		if (activeStatus) search.noticeStatus = activeStatus;
		if (searchText.trim()) search.text = searchText.trim();
		return search;
	};

	const { refetch } = useQuery(GET_ALL_NOTICES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } },
		onCompleted: (data: T) => {
			setNotices(data?.getAllNoticesByAdmin?.list ?? []);
			setTotal(data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useEffect(() => {
		refetch({ input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
			setNotices(data?.getAllNoticesByAdmin?.list ?? []);
			setTotal(data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeStatus, page, rowsPerPage]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setPage(0);
			refetch({ input: { page: 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
				setNotices(data?.getAllNoticesByAdmin?.list ?? []);
				setTotal(data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
			});
		}, 400);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchText]);

	const refetchList = async () => {
		const { data } = await refetch({ input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } });
		setNotices(data?.getAllNoticesByAdmin?.list ?? []);
		setTotal(data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
	};

	/** HANDLERS **/
	const openCreateForm = () => {
		setEditId(null);
		setForm(DEFAULT_FORM);
		setFormOpen(true);
	};

	const openEditForm = (notice: any) => {
		setEditId(notice._id);
		setForm({
			noticeType: notice.noticeType,
			noticeTitle: notice.noticeTitle,
			noticeContent: notice.noticeContent,
			noticePinned: notice.noticePinned,
		});
		setFormOpen(true);
	};

	const closeForm = () => {
		setFormOpen(false);
		setEditId(null);
		setForm(DEFAULT_FORM);
	};

	const submitHandler = async () => {
		if (!form.noticeTitle.trim() || !form.noticeContent.trim()) return;
		try {
			if (editId) {
				await updateNotice({ variables: { input: { _id: editId, ...form } } });
				await sweetMixinSuccessAlert('Notice updated successfully.');
			} else {
				await createNotice({ variables: { input: form } });
				await sweetMixinSuccessAlert('Notice created successfully.');
			}
			closeForm();
			await refetchList();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const deleteHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Are you sure to delete this notice?')) {
				await removeNotice({ variables: { input: id } });
				await refetchList();
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const togglePinHandler = async (notice: any) => {
		try {
			await updateNotice({ variables: { input: { _id: notice._id, noticePinned: !notice.noticePinned } } });
			await refetchList();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component="div" className="admin-content">
			<Stack direction="row" alignItems="flex-start" justifyContent="space-between">
				<Box component="div">
					<Typography className="admin-page-title">Notice Management</Typography>
					<Typography className="admin-page-subtitle">Create and manage platform-wide notices, events, and warnings</Typography>
				</Box>
				<Button className="admin-add-btn" variant="contained" onClick={openCreateForm}>
					<AddRoundedIcon sx={{ mr: '6px', fontSize: 18 }} />
					Add Notice
				</Button>
			</Stack>

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
					placeholder="Search by title..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 20 }} /></InputAdornment>}
				/>
			</Stack>

			<Stack direction="row" gap={3} alignItems="flex-start">
				<Box component="div" className="admin-table-frame" sx={{ flex: 1 }}>
					<NoticeList notices={notices} onEdit={openEditForm} onDelete={deleteHandler} onTogglePin={togglePinHandler} />
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

				{formOpen && (
					<Box component="div" className="admin-side-form">
						<Typography className="form-title">{editId ? 'Edit Notice' : 'Add New Notice'}</Typography>

						<Typography className="form-label">Type</Typography>
						<Select fullWidth className="form-select" value={form.noticeType} onChange={(e) => setForm({ ...form, noticeType: e.target.value })}>
							{TYPE_OPTIONS.map((opt) => (
								<MenuItem key={opt} value={opt}>{opt}</MenuItem>
							))}
						</Select>

						<Typography className="form-label">Title</Typography>
						<OutlinedInput
							fullWidth
							className="form-select"
							value={form.noticeTitle}
							onChange={(e) => setForm({ ...form, noticeTitle: e.target.value })}
							placeholder="Notice title"
						/>

						<Typography className="form-label">Content</Typography>
						<textarea
							className="form-textarea tall"
							value={form.noticeContent}
							onChange={(e) => setForm({ ...form, noticeContent: e.target.value })}
							placeholder="Notice content..."
						/>

						<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
							<Typography className="form-label" sx={{ margin: '0 !important' }}>Pin to top</Typography>
							<Switch checked={form.noticePinned} onChange={(e) => setForm({ ...form, noticePinned: e.target.checked })} />
						</Stack>

						<Stack direction="row" gap={1.5} sx={{ mt: 2.5 }}>
							<Button className="form-cancel-btn" onClick={closeForm}>Cancel</Button>
							<Button className="form-save-btn" onClick={submitHandler}>{editId ? 'Update' : 'Create'}</Button>
						</Stack>
					</Box>
				)}
			</Stack>
		</Box>
	);
};

export default withAdminLayout(AdminNotice);