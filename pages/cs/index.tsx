import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
	Box, Stack, Typography, Button, TextField, InputAdornment,
	Chip, Pagination as MuiPagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SendIcon from '@mui/icons-material/Send';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import EmptyList from '../../libs/components/common/Emptylist';
import { GET_FAQS, GET_NOTICES, GET_MY_INQUIRIES } from '../../apollo/user/query';
import { CREATE_INQUIRY } from '../../apollo/user/mutation';
import { Faq } from '../../libs/types/faq/faq';
import { Notice } from '../../libs/types/notice/notice';
import { Inquiry } from '../../libs/types/inquiry/inquiry';
import { FaqCategory } from '../../libs/enums/faq.enum';
import { T } from '../../libs/types/common';
import { userVar } from '../../apollo/store';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/* ─── Konstantalar ─────────────────────────────────────────────────────── */

const CATEGORY_ITEMS = [
	{ value: 'ALL', label: 'All Categories', icon: <CategoryOutlinedIcon /> },
	{ value: FaqCategory.BOOKING, label: 'Booking', icon: <CalendarMonthOutlinedIcon /> },
	{ value: FaqCategory.PAYMENT, label: 'Payments', icon: <CreditCardOutlinedIcon /> },
	{ value: FaqCategory.SALONS, label: 'Salons & Services', icon: <StorefrontOutlinedIcon /> },
	{ value: FaqCategory.ACCOUNT, label: 'Account', icon: <PersonOutlineIcon /> },
	{ value: FaqCategory.OTHER, label: 'Other', icon: <LabelOutlinedIcon /> },
];

const TYPE_BADGE: Record<string, { bg: string; color: string }> = {
	EVENT: { bg: '#EDE4FB', color: '#8E5CE0' },
	NOTICE: { bg: '#DCEBFB', color: '#2F80D8' },
	WARNING: { bg: '#FBE9D8', color: '#E08A2F' },
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
	WAITING: { bg: '#FCE4EC', color: '#E0498A', label: 'Waiting' },
	ANSWERED: { bg: '#DCEBFB', color: '#2F80D8', label: 'Answered' },
	CLOSED: { bg: '#EEEEEE', color: '#888888', label: 'Closed' },
};

const limit = 6;

/* ─── Component ───────────────────────────────────────────────────────────── */

const CsPage: NextPage = () => {
	const { t } = useTranslation('common');
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const tab = (router.query.tab as string) ?? 'notice';

	const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
	const [faqPage, setFaqPage] = useState<number>(1);
	const [faqs, setFaqs] = useState<Faq[]>([]);
	const [faqTotal, setFaqTotal] = useState<number>(0);
	const [openFaqId, setOpenFaqId] = useState<string>('');

	const [noticePage, setNoticePage] = useState<number>(1);
	const [notices, setNotices] = useState<Notice[]>([]);
	const [noticeTotal, setNoticeTotal] = useState<number>(0);

	const [inquiryPage, setInquiryPage] = useState<number>(1);
	const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
	const [inquiryTotal, setInquiryTotal] = useState<number>(0);
	const [subject, setSubject] = useState<string>('');
	const [message, setMessage] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [createInquiry] = useMutation(CREATE_INQUIRY);

	useQuery(GET_FAQS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: faqPage, limit, search: categoryFilter !== 'ALL' ? { faqCategory: categoryFilter } : {} } },
		skip: tab !== 'faq',
		onCompleted: (data: T) => {
			setFaqs(data?.getFaqs?.list ?? []);
			setFaqTotal(data?.getFaqs?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useQuery(GET_NOTICES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: noticePage, limit: 6, search: {} } },
		skip: tab !== 'notice',
		onCompleted: (data: T) => {
			setNotices(data?.getNotices?.list ?? []);
			setNoticeTotal(data?.getNotices?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const { refetch: myInquiriesRefetch } = useQuery(GET_MY_INQUIRIES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: inquiryPage, limit: 4, search: {} } },
		skip: tab !== 'inquiry' || !user?._id,
		onCompleted: (data: T) => {
			setMyInquiries(data?.getMyInquiries?.list ?? []);
			setInquiryTotal(data?.getMyInquiries?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const changeTabHandler = (newTab: string) => {
		router.push({ pathname: '/cs', query: { tab: newTab } }, undefined, { scroll: false });
	};

	const submitInquiryHandler = async () => {
		try {
			if (!subject || !message) throw new Error(t('Please fill in subject and message'));
			await createInquiry({ variables: { input: { inquirySubject: subject, inquiryMessage: message } } });
			setSubject('');
			setMessage('');
			await myInquiriesRefetch({ input: { page: 1, limit: 4, search: {} } });
			await sweetMixinSuccessAlert(t('Your inquiry has been submitted!'));
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (device === 'mobile') {
		return <h1>CS PAGE MOBILE</h1>;
	}

	return (
		<div id="cs-page">
			<div className="container">
				<Stack className="cs-layout" direction="row">
					{/* ═══ CHAP SIDEBAR ═══ */}
					<Stack className="cs-sidebar">
						<Stack className="cs-brand-box">
							<Typography className="cs-brand-title">{t('BeautyNear')}</Typography>
							<Typography className="cs-brand-sub">{t('Help Center')}</Typography>
						</Stack>

						<Stack className="cs-nav">
							<Stack direction="row" alignItems="center" gap={1.25} className={`cs-nav-item ${tab === 'notice' ? 'active' : ''}`} onClick={() => changeTabHandler('notice')}>
								<CampaignOutlinedIcon sx={{ fontSize: 19 }} /> <Typography>{t('Notice')}</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" gap={1.25} className={`cs-nav-item ${tab === 'faq' ? 'active' : ''}`} onClick={() => changeTabHandler('faq')}>
								<HelpOutlineIcon sx={{ fontSize: 19 }} /> <Typography>{t('FAQ')}</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" gap={1.25} className={`cs-nav-item ${tab === 'inquiry' ? 'active' : ''}`} onClick={() => changeTabHandler('inquiry')}>
								<ChatBubbleOutlineIcon sx={{ fontSize: 19 }} /> <Typography>{t('Inquiry')}</Typography>
							</Stack>
						</Stack>

						{tab === 'faq' && (
							<>
								<Typography className="cs-topics-label">{t('Help Topics')}</Typography>
								<Stack className="cs-category-list">
									{CATEGORY_ITEMS.map((cat) => (
										<Stack key={cat.value} direction="row" alignItems="center" gap={1.25} className={`cs-cat-item ${categoryFilter === cat.value ? 'active' : ''}`} onClick={() => { setCategoryFilter(cat.value); setFaqPage(1); }}>
											{cat.icon} <Typography>{t(cat.label)}</Typography>
										</Stack>
									))}
								</Stack>
							</>
						)}

						<Box component="div" className="cs-help-card">
							<SupportAgentIcon sx={{ fontSize: 26, color: '#FF4D8D' }} />
							<Typography className="cs-help-title">{t('Still need help?')}</Typography>
							<Typography className="cs-help-sub">{t('Contact our support team.')}</Typography>
							<Button className="cs-help-btn" startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 15 }} />} onClick={() => changeTabHandler('inquiry')}>
								{t('Contact Support')}
							</Button>
						</Box>
					</Stack>

					{/* ═══ O'NG KONTENT ═══ */}
					<Stack className="cs-main">
						{/* Hero banner */}
						<Stack className="cs-hero" direction="row" alignItems="center" justifyContent="space-between">
							<Box component="div" className="cs-hero-text-box">
								<Typography className="cs-hero-title">{t('Help Center')}</Typography>
								<Typography className="cs-hero-sub">{t('Find answers to common questions or contact our support team.')}</Typography>
							</Box>
							<TextField
								className="cs-hero-search"
								placeholder={t('Search for help articles...')}
								InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#bbb' }} /></InputAdornment> }}
							/>
							<svg className="cs-hero-deco" width="120" height="140" viewBox="0 0 120 140" fill="none">
								<circle cx="90" cy="30" r="4" fill="rgba(255,255,255,0.5)" />
								<circle cx="70" cy="60" r="3" fill="rgba(255,255,255,0.4)" />
								<circle cx="100" cy="80" r="5" fill="rgba(255,255,255,0.35)" />
								<circle cx="60" cy="100" r="3" fill="rgba(255,255,255,0.45)" />
								<circle cx="105" cy="115" r="4" fill="rgba(255,255,255,0.3)" />
								<path d="M20 10 Q60 40 30 130" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
							</svg>
						</Stack>

						{/* NOTICE */}
						{tab === 'notice' && (
							<Box component="div" className="cs-content-frame">
								{notices.length === 0 ? (
									<EmptyList emoji="📢" title={t('No notices yet')} desc={t('Announcements will appear here')} />
								) : (
									<Box component="div" className="notice-grid">
										{notices.map((n) => (
											<Stack key={n._id} className="notice-card">
												<Stack direction="row" justifyContent="space-between" alignItems="center">
													<Chip label={t(n.noticeType)} size="small" sx={{ background: TYPE_BADGE[n.noticeType]?.bg, color: TYPE_BADGE[n.noticeType]?.color, fontWeight: 700, fontSize: 11 }} />
													<Typography className="notice-date-top">{moment(n.createdAt).format('MMM DD, YYYY')}</Typography>
												</Stack>
												<Typography className="notice-title">{n.noticeTitle}</Typography>
												<Typography className="notice-desc">{n.noticeContent}</Typography>
												<Typography className="notice-readmore">{t('Read more')} →</Typography>
												<Stack direction="row" alignItems="center" justifyContent="space-between" className="notice-footer">
													<Stack direction="row" alignItems="center" gap={0.5}>
														<RemoveRedEyeIcon sx={{ fontSize: 14, color: '#aaa' }} />
														<Typography className="notice-meta">{n.noticeViews >= 1000 ? `${(n.noticeViews / 1000).toFixed(1)}K` : n.noticeViews}</Typography>
													</Stack>
													<Stack direction="row" alignItems="center" gap={0.5}>
														<CalendarMonthOutlinedIcon sx={{ fontSize: 13, color: '#aaa' }} />
														<Typography className="notice-meta">{moment(n.createdAt).format('MMM DD, YYYY')}</Typography>
													</Stack>
												</Stack>
											</Stack>
										))}
									</Box>
								)}
								{notices.length !== 0 && (
									<Stack alignItems="center" sx={{ mt: 3 }}>
										<MuiPagination count={Math.ceil(noticeTotal / 6) || 1} page={noticePage} shape="circular" onChange={(_e, v) => setNoticePage(v)} sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }} />
									</Stack>
								)}
							</Box>
						)}

						{/* FAQ */}
						{tab === 'faq' && (
							<Box component="div" className="cs-content-frame">
								{faqs.length === 0 ? (
									<EmptyList emoji="❓" title={t('No FAQs found')} desc={t('Questions will appear here')} />
								) : (
									<Box component="div" className="faq-grid">
										{faqs.map((faq) => {
											const isOpen = openFaqId === faq._id;
											return (
												<Stack key={faq._id} className={`faq-item ${isOpen ? 'open' : ''}`} onClick={() => setOpenFaqId(isOpen ? '' : faq._id)}>
													<Stack direction="row" alignItems="center" justifyContent="space-between">
														<Stack direction="row" alignItems="center" gap={1.5}>
															<Box component="div" className="faq-q-icon"><HelpOutlineIcon sx={{ fontSize: 15 }} /></Box>
															<Typography className="faq-question">{faq.faqQuestion}</Typography>
														</Stack>
														{isOpen ? <ExpandLessIcon sx={{ color: '#aaa' }} /> : <ExpandMoreIcon sx={{ color: '#aaa' }} />}
													</Stack>
													{isOpen && <Typography className="faq-answer">{faq.faqAnswer}</Typography>}
												</Stack>
											);
										})}
									</Box>
								)}
								{faqs.length !== 0 && (
									<Stack alignItems="center" sx={{ mt: 3 }}>
										<MuiPagination count={Math.ceil(faqTotal / limit) || 1} page={faqPage} shape="circular" onChange={(_e, v) => setFaqPage(v)} sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }} />
									</Stack>
								)}
							</Box>
						)}

						{/* INQUIRY */}
						{tab === 'inquiry' && (
							<Box component="div" className="cs-content-frame">
								{!user?._id ? (
									<EmptyList emoji="🔒" title={t('Please login first')} desc={t('You need to be logged in to submit an inquiry')} />
								) : (
									<Stack direction="row" gap={3} className="inquiry-split">
										{/* Chap: forma */}
										<Box component="div" className="inquiry-form-panel">
											<Typography className="inquiry-form-title">{t('Send an Inquiry')}</Typography>
											<Typography className="inquiry-form-sub">{t("We'll get back to you as soon as possible.")}</Typography>

											<Typography className="inquiry-field-label">{t('Subject')}</Typography>
											<TextField fullWidth className="inquiry-input" placeholder={t('Select or enter your subject')} value={subject} onChange={(e) => setSubject(e.target.value)} />

											<Typography className="inquiry-field-label">{t('Message')}</Typography>
											<TextField fullWidth multiline rows={6} className="inquiry-input" placeholder={t('Please describe your issue in detail...')} value={message} onChange={(e) => setMessage(e.target.value)} />

											<Button fullWidth className="inquiry-submit-btn" startIcon={<SendIcon sx={{ fontSize: 16 }} />} onClick={submitInquiryHandler}>
												{t('Send Inquiry')}
											</Button>
										</Box>

										{/* O'ng: mening murojaatlarim */}
										<Box component="div" className="inquiry-list-panel">
											<Typography className="inquiry-list-title">{t('My Inquiries')}</Typography>
											{myInquiries.length === 0 ? (
												<EmptyList emoji="💬" title={t('No inquiries yet')} desc={t('Your submitted inquiries will appear here')} />
											) : (
												<Stack gap={1.25}>
													{myInquiries.map((inq) => (
														<Stack key={inq._id} direction="row" alignItems="center" justifyContent="space-between" className="inquiry-row">
															<Box component="div" sx={{ minWidth: 0, flex: 1 }}>
																<Stack direction="row" alignItems="center" gap={1}>
																	<Typography className="inquiry-subject">{inq.inquirySubject}</Typography>
																	<Typography className="inquiry-row-date">{moment(inq.createdAt).format('MMM DD, YYYY')}</Typography>
																</Stack>
																<Typography className="inquiry-preview">{inq.inquiryMessage}</Typography>
															</Box>
															<Stack direction="row" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
																<Chip label={t(STATUS_BADGE[inq.inquiryStatus].label)} size="small" sx={{ background: STATUS_BADGE[inq.inquiryStatus].bg, color: STATUS_BADGE[inq.inquiryStatus].color, fontWeight: 700, fontSize: 11 }} />
																<ChevronRightIcon sx={{ color: '#ccc' }} />
															</Stack>
														</Stack>
													))}
												</Stack>
											)}
											{inquiryTotal > 4 && (
												<Stack alignItems="center" sx={{ mt: 2 }}>
													<MuiPagination count={Math.ceil(inquiryTotal / 4)} page={inquiryPage} shape="circular" onChange={(_e, v) => setInquiryPage(v)} sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }} />
												</Stack>
											)}
										</Box>
									</Stack>
								)}
							</Box>
						)}
					</Stack>
				</Stack>
			</div>
		</div>
	);
};

export default withLayoutBasic(CsPage);