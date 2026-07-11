import React from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography } from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import { useQuery } from '@apollo/client';
import {
	GET_ALL_MEMBERS_BY_ADMIN,
	GET_ALL_SALONS_BY_ADMIN,
	GET_ALL_SERVICES_BY_ADMIN,
	GET_ALL_BOOKINGS_BY_ADMIN,
	GET_ALL_BOARD_ARTICLES_BY_ADMIN,
	GET_ALL_FAQS_BY_ADMIN,
	GET_ALL_NOTICES_BY_ADMIN,
	GET_ALL_INQUIRIES_BY_ADMIN,
} from '../../apollo/admin/query';
import { T } from '../../libs/types/common';

// Har bir domen uchun — faqat metaCounter kerak, shuning uchun limit:1
const LITE_INPUT = { page: 1, limit: 1, sort: 'createdAt', direction: 'DESC', search: {} };

interface StatRow {
	label: string;
	icon: React.ReactNode;
	url: string;
	total: number;
	color: string;
}

const AdminHome: NextPage = () => {
	const router = useRouter();
	const [counts, setCounts] = React.useState<Record<string, number>>({});

	const setCount = (key: string) => (data: T) => {
		const total =
			data?.getAllMembersByAdmin?.metaCounter?.[0]?.total ??
			data?.getAllSalonsByAdmin?.metaCounter?.[0]?.total ??
			data?.getAllServicesByAdmin?.metaCounter?.[0]?.total ??
			data?.getAllBookingsByAdmin?.metaCounter?.[0]?.total ??
			data?.getAllBoardArticlesByAdmin?.metaCounter?.[0]?.total ??
			data?.getAllFaqsByAdmin?.metaCounter?.[0]?.total ??
			data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ??
			data?.getAllInquiriesByAdmin?.metaCounter?.[0]?.total ??
			0;
		setCounts((prev) => ({ ...prev, [key]: total }));
	};

	/** APOLLO REQUESTS — har biri faqat sonini olish uchun **/
	useQuery(GET_ALL_MEMBERS_BY_ADMIN, { fetchPolicy: 'network-only', variables: { input: LITE_INPUT }, onCompleted: setCount('members') });
	useQuery(GET_ALL_SALONS_BY_ADMIN, { fetchPolicy: 'network-only', variables: { input: LITE_INPUT }, onCompleted: setCount('salons') });
	useQuery(GET_ALL_SERVICES_BY_ADMIN, { fetchPolicy: 'network-only', variables: { input: LITE_INPUT }, onCompleted: setCount('services') });
	useQuery(GET_ALL_BOOKINGS_BY_ADMIN, { fetchPolicy: 'network-only', variables: { input: LITE_INPUT }, onCompleted: setCount('bookings') });
	useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, { fetchPolicy: 'network-only', variables: { input: LITE_INPUT }, onCompleted: setCount('community') });
	useQuery(GET_ALL_FAQS_BY_ADMIN, { fetchPolicy: 'network-only', variables: { input: LITE_INPUT }, onCompleted: setCount('faq') });
	useQuery(GET_ALL_NOTICES_BY_ADMIN, { fetchPolicy: 'network-only', variables: { input: LITE_INPUT }, onCompleted: setCount('notice') });
	useQuery(GET_ALL_INQUIRIES_BY_ADMIN, { fetchPolicy: 'network-only', variables: { input: LITE_INPUT }, onCompleted: setCount('inquiry') });

	const rows: StatRow[] = [
		{ label: 'Members', icon: <PeopleOutlineIcon />, url: '/_admin/users', total: counts.members ?? 0, color: '#FF4D8D' },
		{ label: 'Salons', icon: <StorefrontOutlinedIcon />, url: '/_admin/salons', total: counts.salons ?? 0, color: '#9B59B6' },
		{ label: 'Services', icon: <ContentCutOutlinedIcon />, url: '/_admin/services', total: counts.services ?? 0, color: '#2980B9' },
		{ label: 'Bookings', icon: <CalendarMonthOutlinedIcon />, url: '/_admin/bookings', total: counts.bookings ?? 0, color: '#3EA043' },
		{ label: 'Community', icon: <ForumOutlinedIcon />, url: '/_admin/community', total: counts.community ?? 0, color: '#F57C00' },
		{ label: 'FAQ', icon: <QuestionAnswerOutlinedIcon />, url: '/_admin/cs/faq', total: counts.faq ?? 0, color: '#FF4D8D' },
		{ label: 'Notice', icon: <CampaignOutlinedIcon />, url: '/_admin/cs/notice', total: counts.notice ?? 0, color: '#9B59B6' },
		{ label: 'Inquiry', icon: <HeadsetMicOutlinedIcon />, url: '/_admin/cs/inquiry', total: counts.inquiry ?? 0, color: '#2980B9' },
	];

	return (
		<Box component="div" className="admin-content">
			<Typography className="admin-page-title">Dashboard</Typography>
			<Typography className="admin-page-subtitle">Quick overview of all platform data</Typography>

			<Box component="div" className="admin-table-frame">
				<Stack className="admin-member-table">
					<Stack direction="row" alignItems="center" className="admin-table-head">
						<Typography className="th" sx={{ flex: 1 }}>Section</Typography>
						<Typography className="th" sx={{ flex: '0 0 150px' }} align="center">Total Records</Typography>
					</Stack>

					{rows.map((row) => (
						<Stack
							key={row.label}
							direction="row"
							alignItems="center"
							className="admin-table-row"
							sx={{ cursor: 'pointer' }}
							onClick={() => router.push(row.url)}
						>
							<Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1 }}>
								<Box
									component="div"
									sx={{
										width: 36, height: 36, borderRadius: 2, display: 'flex',
										alignItems: 'center', justifyContent: 'center',
										background: `${row.color}15`, color: row.color,
									}}
								>
									{row.icon}
								</Box>
								<Typography className="member-nick">{row.label}</Typography>
							</Stack>
							<Typography className="td" sx={{ flex: '0 0 150px', fontWeight: 700, fontSize: '15px !important' }} align="center">
								{row.total}
							</Typography>
						</Stack>
					))}
				</Stack>
			</Box>
		</Box>
	);
};

export default withAdminLayout(AdminHome);