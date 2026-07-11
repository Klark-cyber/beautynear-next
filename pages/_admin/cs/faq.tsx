import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Select, MenuItem, OutlinedInput, InputAdornment, Button, IconButton, Pagination as MuiPagination } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import moment from 'moment';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_FAQS_BY_ADMIN } from '../../../apollo/admin/query';
import { CREATE_FAQ_BY_ADMIN, UPDATE_FAQ_BY_ADMIN, REMOVE_FAQ_BY_ADMIN } from '../../../apollo/admin/mutation';
import { Faq } from '../../../libs/types/faq/faq';
import { AllFaqsInquiry } from '../../../libs/types/faq/faq.input';
import { FaqCategory, FaqStatus } from '../../../libs/enums/faq.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

const CATEGORY_LABEL: Record<string, string> = {
	BOOKING: 'Booking',
	PAYMENT: 'Payment',
	ACCOUNT: 'Account',
	SALONS: 'Salons',
	OTHER: 'Other',
};

const STATUS_TABS = [
	{ label: 'All', value: undefined },
	{ label: 'Active', value: FaqStatus.ACTIVE },
	{ label: 'Inactive', value: FaqStatus.INACTIVE },
	{ label: 'Deleted', value: FaqStatus.DELETE },
];

const EMPTY_FORM = { _id: '', faqCategory: FaqCategory.BOOKING, faqQuestion: '', faqAnswer: '', faqStatus: FaqStatus.ACTIVE };

const AdminFaq: NextPage = ({
	initialInquiry = { page: 1, limit: 6, sort: 'createdAt', direction: 'DESC', search: {} },
	...props
}: any) => {
	const [inquiry, setInquiry] = useState<AllFaqsInquiry>(initialInquiry);
	const [faqs, setFaqs] = useState<Faq[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
	const [searchText, setSearchText] = useState<string>('');
	const [form, setForm] = useState<any>(EMPTY_FORM);
	const isEditMode = Boolean(form._id);

	/** APOLLO REQUESTS **/
	const [createFaqByAdmin] = useMutation(CREATE_FAQ_BY_ADMIN);
	const [updateFaqByAdmin] = useMutation(UPDATE_FAQ_BY_ADMIN);
	const [removeFaqByAdmin] = useMutation(REMOVE_FAQ_BY_ADMIN);

	const { refetch } = useQuery(GET_ALL_FAQS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setFaqs(data?.getAllFaqsByAdmin?.list ?? []);
			setTotal(data?.getAllFaqsByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const tabChangeHandler = (status: FaqStatus | undefined) => {
		const search: T = { ...inquiry.search };
		if (status) search.faqStatus = status;
		else delete search.faqStatus;
		setInquiry({ ...inquiry, page: 1, search });
	};

	const categoryChangeHandler = (category: string) => {
		setCategoryFilter(category);
		const search: T = { ...inquiry.search };
		if (category !== 'ALL') search.faqCategory = category as FaqCategory;
		else delete search.faqCategory;
		setInquiry({ ...inquiry, page: 1, search });
	};

	const searchHandler = () => {
		setInquiry({ ...inquiry, page: 1, search: { ...inquiry.search, text: searchText } });
	};

	const paginationHandler = (_e: any, value: number) => setInquiry({ ...inquiry, page: value });

	const editHandler = (faq: Faq) => {
		setForm({ _id: faq._id, faqCategory: faq.faqCategory, faqQuestion: faq.faqQuestion, faqAnswer: faq.faqAnswer, faqStatus: faq.faqStatus });
	};

	const cancelHandler = () => setForm(EMPTY_FORM);

	const saveHandler = async () => {
		try {
			if (!form.faqQuestion || !form.faqAnswer) throw new Error('Please fill in question and answer');
			if (isEditMode) {
				await updateFaqByAdmin({ variables: { input: { _id: form._id, faqCategory: form.faqCategory, faqQuestion: form.faqQuestion, faqAnswer: form.faqAnswer, faqStatus: form.faqStatus } } });
			} else {
				await createFaqByAdmin({ variables: { input: { faqCategory: form.faqCategory, faqQuestion: form.faqQuestion, faqAnswer: form.faqAnswer } } });
			}
			setForm(EMPTY_FORM);
			await refetch({ input: inquiry });
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const deleteHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Are you sure to permanently delete this FAQ?')) {
				await removeFaqByAdmin({ variables: { input: id } });
				await refetch({ input: inquiry });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const activeStatus = inquiry.search.faqStatus;

	return (
		<Box component="div" className="admin-content">
			<Typography className="admin-page-title">FAQ Management</Typography>
			<Typography className="admin-page-subtitle">Manage frequently asked questions and answers.</Typography>

			<Stack direction="row" gap={1.5} className="admin-filter-tabs">
				{STATUS_TABS.map((tab) => (
					<Box key={tab.label} component="div" className={`admin-filter-tab ${activeStatus === tab.value ? 'active' : ''}`} onClick={() => tabChangeHandler(tab.value)}>
						{tab.label}
					</Box>
				))}
			</Stack>

			<Stack direction="row" gap={3}>
				{/* Chap: jadval */}
				<Stack sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" gap={2} className="admin-search-row" alignItems="center" justifyContent="space-between">
						<Stack direction="row" gap={2}>
							<Select className="admin-select" value={categoryFilter} onChange={(e) => categoryChangeHandler(e.target.value)}>
								<MenuItem value="ALL">All Categories</MenuItem>
								{(Object.values(FaqCategory) as FaqCategory[]).map((cat) => (
									<MenuItem key={cat} value={cat}>{CATEGORY_LABEL[cat]}</MenuItem>
								))}
							</Select>
							<OutlinedInput
								className="admin-search-input"
								placeholder="Search questions..."
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
								startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /></InputAdornment>}
							/>
						</Stack>
						<Button className="admin-add-btn" startIcon={<AddIcon />} onClick={() => setForm(EMPTY_FORM)}>Add FAQ</Button>
					</Stack>

					<Box component="div" className="admin-table-frame">
						<Stack className="admin-member-table">
							<Stack direction="row" alignItems="center" className="admin-table-head">
								<Typography className="th" sx={{ flex: '0 0 40px' }}>#</Typography>
								<Typography className="th" sx={{ flex: 1 }}>Question</Typography>
								<Typography className="th" sx={{ flex: '0 0 110px' }}>Category</Typography>
								<Typography className="th" sx={{ flex: '0 0 90px' }}>Status</Typography>
								<Typography className="th" sx={{ flex: '0 0 110px' }}>Created At</Typography>
								<Typography className="th" sx={{ flex: '0 0 70px' }} align="center">Actions</Typography>
							</Stack>

							{faqs.length === 0 && <Stack alignItems="center" className="admin-no-data"><Typography>No FAQs found</Typography></Stack>}

							{faqs.map((faq, i) => (
								<Stack key={faq._id} direction="row" alignItems="center" className="admin-table-row">
									<Typography className="td" sx={{ flex: '0 0 40px' }}>{(inquiry.page - 1) * inquiry.limit + i + 1}</Typography>
									<Typography className="member-nick" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faq.faqQuestion}</Typography>
									<Box sx={{ flex: '0 0 110px' }}>
										<span className={`admin-chip type-agent`}>{CATEGORY_LABEL[faq.faqCategory]}</span>
									</Box>
									<Box sx={{ flex: '0 0 90px' }}>
										<span className={`admin-chip status-${faq.faqStatus === FaqStatus.ACTIVE ? 'active' : faq.faqStatus === FaqStatus.INACTIVE ? 'paused' : 'deleted'}`}>{faq.faqStatus}</span>
									</Box>
									<Typography className="td" sx={{ flex: '0 0 110px' }}>{moment(faq.createdAt).format('MMM DD, YYYY')}</Typography>
									<Stack direction="row" gap={0.5} sx={{ flex: '0 0 70px' }} justifyContent="center">
										<IconButton size="small" onClick={() => editHandler(faq)}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
										<IconButton size="small" onClick={() => deleteHandler(faq._id)}><DeleteOutlineIcon sx={{ fontSize: 16, color: '#FF4D6A' }} /></IconButton>
									</Stack>
								</Stack>
							))}
						</Stack>

						{faqs.length !== 0 && (
							<Stack alignItems="center" sx={{ mt: 3 }}>
								<MuiPagination page={inquiry.page} count={Math.ceil(total / inquiry.limit) || 1} onChange={paginationHandler} shape="circular" sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }} />
							</Stack>
						)}
					</Box>
				</Stack>

				{/* O'ng: Add/Edit forma */}
				<Box component="div" className="admin-side-form">
					<Typography className="form-title">{isEditMode ? 'Edit FAQ' : 'Add FAQ'}</Typography>

					<Typography className="form-label">Category</Typography>
					<Select fullWidth className="form-select" value={form.faqCategory} onChange={(e) => setForm({ ...form, faqCategory: e.target.value })}>
						{(Object.values(FaqCategory) as FaqCategory[]).map((cat) => (
							<MenuItem key={cat} value={cat}>{CATEGORY_LABEL[cat]}</MenuItem>
						))}
					</Select>

					<Typography className="form-label">Question</Typography>
					<textarea className="form-textarea" placeholder="Enter question" value={form.faqQuestion} onChange={(e) => setForm({ ...form, faqQuestion: e.target.value })} />

					<Typography className="form-label">Answer</Typography>
					<textarea className="form-textarea tall" placeholder="Enter answer" value={form.faqAnswer} onChange={(e) => setForm({ ...form, faqAnswer: e.target.value })} />

					{isEditMode && (
						<>
							<Typography className="form-label">Status</Typography>
							<Select fullWidth className="form-select" value={form.faqStatus} onChange={(e) => setForm({ ...form, faqStatus: e.target.value })}>
								{(Object.values(FaqStatus) as FaqStatus[]).map((s) => (
									<MenuItem key={s} value={s}>{s}</MenuItem>
								))}
							</Select>
						</>
					)}

					<Stack direction="row" gap={1} justifyContent="flex-end" sx={{ mt: 3 }}>
						<Button className="form-cancel-btn" onClick={cancelHandler}>Cancel</Button>
						<Button className="form-save-btn" onClick={saveHandler}>Save FAQ</Button>
					</Stack>
				</Box>
			</Stack>
		</Box>
	);
};

AdminFaq.defaultProps = {
	initialInquiry: { page: 1, limit: 6, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminFaq);