import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';

interface MenuEntry {
	title: string;
	icon: React.ReactNode;
	url: string;
}

// ⚠️ TUZATILDI: avval "Cs" (FAQ/Notice/Inquiry) ataylab kiritilmagan edi
// ("backend'da bu domen uchun hech qanday admin query/mutation yo'q" degan
// izoh bilan) — bu endi ESKIRGAN, chunki FAQ/Notice/Inquiry uchun toliq
// CRUD allaqachon qurilgan va ishlaydi. Admin ularga faqat Dashboard
// jadvali orqali BILVOSITA kira olar edi, doimiy sidebar orqali emas.
const menu_set: MenuEntry[] = [
	{ title: 'Dashboard', icon: <DashboardOutlinedIcon />, url: '/_admin' },
	{ title: 'Members', icon: <PeopleOutlineIcon />, url: '/_admin/users' },
	{ title: 'Agent Requests', icon: <PersonAddAltIcon />, url: '/_admin/agent-requests' },
	{ title: 'Salons', icon: <StorefrontOutlinedIcon />, url: '/_admin/salons' },
	{ title: 'Services', icon: <ContentCutOutlinedIcon />, url: '/_admin/services' },
	{ title: 'Bookings', icon: <CalendarMonthOutlinedIcon />, url: '/_admin/bookings' },
	{ title: 'Community', icon: <ForumOutlinedIcon />, url: '/_admin/community' },
	{ title: 'FAQ', icon: <QuestionAnswerOutlinedIcon />, url: '/_admin/cs/faq' },
	{ title: 'Notice', icon: <CampaignOutlinedIcon />, url: '/_admin/cs/notice' },
	{ title: 'Inquiry', icon: <HeadsetMicOutlinedIcon />, url: '/_admin/cs/inquiry' },
];

const AdminMenuList = () => {
	const router = useRouter();

	const isActive = (url: string) => (url === '/_admin' ? router.pathname === '/_admin' : router.pathname.startsWith(url));

	return (
		<List className="menu_wrap" disablePadding sx={{ px: 1.5, py: 1 }}>
			{menu_set.map((item) => (
				<Link href={item.url} key={item.url} style={{ textDecoration: 'none' }}>
					<ListItemButton
						className={isActive(item.url) ? 'menu on' : 'menu'}
						sx={{
							borderRadius: 2,
							mb: 0.5,
							px: 2,
							py: 1.25,
							color: isActive(item.url) ? '#fff' : '#666',
							background: isActive(item.url) ? 'linear-gradient(135deg, #FF4D8D, #FF6B9D)' : 'transparent',
							boxShadow: isActive(item.url) ? '0 4px 14px rgba(255,77,141,0.3)' : 'none',
							transition: 'all 0.2s',
							'&:hover': {
								background: isActive(item.url)
									? 'linear-gradient(135deg, #FF4D8D, #FF6B9D)'
									: 'rgba(255,77,141,0.06)',
								color: isActive(item.url) ? '#fff' : '#FF4D8D',
							},
						}}
					>
						<ListItemIcon
							sx={{
								minWidth: 36,
								color: isActive(item.url) ? '#fff' : '#999',
							}}
						>
							{item.icon}
						</ListItemIcon>
						<ListItemText
							primaryTypographyProps={{
								fontSize: 14,
								fontWeight: isActive(item.url) ? 700 : 500,
							}}
						>
							{item.title}
						</ListItemText>
					</ListItemButton>
				</Link>
			))}
		</List>
	);
};

export default AdminMenuList;