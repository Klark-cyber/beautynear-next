import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Button, OutlinedInput, InputAdornment, Select, MenuItem, TablePagination, Switch } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/Search';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_FAQS_BY_ADMIN } from '../../../apollo/admin/query';
import { CREATE_FAQ_BY_ADMIN, UPDATE_FAQ_BY_ADMIN, REMOVE_FAQ_BY_ADMIN } from '../../../apollo/admin/mutation';
import { FaqList } from '../../../libs/components/admin/cs/FaqList';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinSuccessAlert } from '../../../libs/sweetAlert';

const STATUS_TABS = [
	{ label: 'All', value: undefined },
	{ label: 'Active', value: 'ACTIVE' },
	{ label: 'Inactive', value: 'INACTIVE' },
];

const CATEGORY_OPTIONS = ['BOOKING', 'PAYMENT', 'ACCOUNT', 'SALONS', 'OTHER'];

const DEFAULT_FORM = { faqCategory: 'BOOKING', faqQuestion: '', faqAnswer: '' };

const limit = 10;

// ⚠️ MUHIM: bu sahifa avval "Users" jadvalidan nusxa kochirilgan,
// hech qanday haqiqiy sorovga ega bolmagan holat edi. Notice bilan bir
// xil naqsh boyicha toliq qayta qurildi.

const AdminFaq: NextPage = () => {
	const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined);
	const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
	const [searchText, setSearchText] = useState('');
	const [faqs, setFaqs] = useState<any[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(limit);

	const [formOpen, setFormOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form, setForm] = useState(DEFAULT_FORM);

	/** APOLLO REQUESTS **/
	const [createFaq] = useMutation(CREATE_FAQ_BY_ADMIN);
	const [updateFaq] = useMutation(UPDATE_FAQ_BY_ADMIN);
	const [removeFaq] = useMutation(REMOVE_FAQ_BY_ADMIN);

	const buildSearch = (): T => {
		const search: T = {};
		if (activeStatus) search.faqStatus = activeStatus;
		if (activeCategory) search.faqCategory = activeCategory;
		if (searchText.trim()) search.text = searchText.trim();
		return search;
	};

	const { refetch } = useQuery(GET_ALL_FAQS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } },
		onCompleted: (data: T) => {
			setFaqs(data?.getAllFaqsByAdmin?.list ?? []);
			setTotal(data?.getAllFaqsByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useEffect(() => {
		refetch({ input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
			setFaqs(data?.getAllFaqsByAdmin?.list ?? []);
			setTotal(data?.getAllFaqsByAdmin?.metaCounter?.[0]?.total ?? 0);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeStatus, activeCategory, page, rowsPerPage]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setPage(0);
			refetch({ input: { page: 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } }).then(({ data }) => {
				setFaqs(data?.getAllFaqsByAdmin?.list ?? []);
				setTotal(data?.getAllFaqsByAdmin?.metaCounter?.[0]?.total ?? 0);
			});
		}, 400);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchText]);

	const refetchList = async () => {
		const { data } = await refetch({ input: { page: page + 1, limit: rowsPerPage, sort: 'createdAt', direction: 'DESC', search: buildSearch() } });
		setFaqs(data?.getAllFaqsByAdmin?.list ?? []);
		setTotal(data?.getAllFaqsByAdmin?.metaCounter?.[0]?.total ?? 0);
	};

	/** HANDLERS **/
	const openCreateForm = () => {
		setEditId(null);
		setForm(DEFAULT_FORM);
		setFormOpen(true);
	};

	const openEditForm = (faq: any) => {
		setEditId(faq._id);
		setForm({
			faqCategory: faq.faqCategory,
			faqQuestion: faq.faqQuestion,
			faqAnswer: faq.faqAnswer,
		});
		setFormOpen(true);
	};

	const closeForm = () => {
		setFormOpen(false);
		setEditId(null);
		setForm(DEFAULT_FORM);
	};

	const submitHandler = async () => {
		if (!form.faqQuestion.trim() || !form.faqAnswer.trim()) return;
		try {
			if (editId) {
				await updateFaq({ variables: { input: { _id: editId, ...form } } });
				await sweetMixinSuccessAlert('FAQ updated successfully.');
			} else {
				await createFaq({ variables: { input: form } });
				await sweetMixinSuccessAlert('FAQ created successfully.');
			}
			closeForm();
			await refetchList();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const deleteHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Are you sure to delete this FAQ?')) {
				await removeFaq({ variables: { input: id } });
				await refetchList();
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const toggleStatusHandler = async (faq: any) => {
		try {
			await updateFaq({ variables: { input: { _id: faq._id, faqStatus: faq.faqStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } } });
			await refetchList();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component="div" className="admin-content">
			<Stack direction="row" alignItems="flex-start" justifyContent="space-between">
				<Box component="div">
					<Typography className="admin-page-title">FAQ Management</Typography>
					<Typography className="admin-page-subtitle">Manage frequently asked questions shown to users</Typography>
				</Box>
				<Button className="admin-add-btn" variant="contained" onClick={openCreateForm}>
					<AddRoundedIcon sx={{ mr: '6px', fontSize: 18 }} />
					Add FAQ
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

			<Stack direction="row" gap={1.5} className="admin-search-row">
				<OutlinedInput
					className="admin-search-input"
					placeholder="Search by question..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 20 }} /></InputAdornment>}
				/>
				<Select
					value={activeCategory ?? 'ALL'}
					onChange={(e) => setActiveCategory(e.target.value === 'ALL' ? undefined : e.target.value)}
					size="small"
					sx={{ minWidth: 160, height: 44, borderRadius: 2, fontFamily: 'Inter, sans-serif', fontSize: 13 }}
				>
					<MenuItem value="ALL">All Categories</MenuItem>
					{CATEGORY_OPTIONS.map((opt) => (
						<MenuItem key={opt} value={opt}>{opt}</MenuItem>
					))}
				</Select>
			</Stack>

			<Stack direction="row" gap={3} alignItems="flex-start">
				<Box component="div" className="admin-table-frame" sx={{ flex: 1 }}>
					<FaqList faqs={faqs} onEdit={openEditForm} onDelete={deleteHandler} onToggleStatus={toggleStatusHandler} />
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
						<Typography className="form-title">{editId ? 'Edit FAQ' : 'Add New FAQ'}</Typography>

						<Typography className="form-label">Category</Typography>
						<Select fullWidth className="form-select" value={form.faqCategory} onChange={(e) => setForm({ ...form, faqCategory: e.target.value })}>
							{CATEGORY_OPTIONS.map((opt) => (
								<MenuItem key={opt} value={opt}>{opt}</MenuItem>
							))}
						</Select>

						<Typography className="form-label">Question</Typography>
						<OutlinedInput
							fullWidth
							className="form-select"
							value={form.faqQuestion}
							onChange={(e) => setForm({ ...form, faqQuestion: e.target.value })}
							placeholder="e.g. How do I cancel a booking?"
						/>

						<Typography className="form-label">Answer</Typography>
						<textarea
							className="form-textarea tall"
							value={form.faqAnswer}
							onChange={(e) => setForm({ ...form, faqAnswer: e.target.value })}
							placeholder="Answer content..."
						/>

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

export default withAdminLayout(AdminFaq);