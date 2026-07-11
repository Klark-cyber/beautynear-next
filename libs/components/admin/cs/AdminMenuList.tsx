import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { List, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface MenuEntry {
	title: string;
	icon: React.ReactNode;
	url: string;
}

const menu_set: MenuEntry[] = [
	{ title: 'Members', icon: <PeopleOutlineIcon />, url: '/_admin/users' },
	{ title: 'Salons', icon: <StorefrontOutlinedIcon />, url: '/_admin/salons' },
	{ title: 'Services', icon: <ContentCutOutlinedIcon />, url: '/_admin/services' },
	{ title: 'Bookings', icon: <CalendarMonthOutlinedIcon />, url: '/_admin/bookings' },
	{ title: 'Community', icon: <ForumOutlinedIcon />, url: '/_admin/community' },
];

// CS (Customer Service) — kengaytiriluvchi guruh
const cs_sub_menu: MenuEntry[] = [
	{ title: 'FAQ', icon: null, url: '/_admin/cs/faq' },
	{ title: 'Notice', icon: null, url: '/_admin/cs/notice' },
	{ title: 'Inquiry', icon: null, url: '/_admin/cs/inquiry' },
];

const AdminMenuList = () => {
	const router = useRouter();

	const isActive = (url: string) => router.pathname.startsWith(url);
	const isCsActive = cs_sub_menu.some((sub) => isActive(sub.url));
	const [csOpen, setCsOpen] = useState(isCsActive);

	const itemStyle = (active: boolean) => ({
		borderRadius: 2,
		mb: 0.5,
		px: 2,
		py: 1.25,
		color: active ? '#fff' : '#666',
		background: active ? 'linear-gradient(135deg, #FF4D8D, #FF6B9D)' : 'transparent',
		boxShadow: active ? '0 4px 14px rgba(255,77,141,0.3)' : 'none',
		transition: 'all 0.2s',
		'&:hover': {
			background: active ? 'linear-gradient(135deg, #FF4D8D, #FF6B9D)' : 'rgba(255,77,141,0.06)',
			color: active ? '#fff' : '#FF4D8D',
		},
	});

	return (
		<List className="menu_wrap" disablePadding sx={{ px: 1.5, py: 1 }}>
			{menu_set.map((item) => (
				<Link href={item.url} key={item.url} style={{ textDecoration: 'none' }}>
					<ListItemButton className={isActive(item.url) ? 'menu on' : 'menu'} sx={itemStyle(isActive(item.url))}>
						<ListItemIcon sx={{ minWidth: 36, color: isActive(item.url) ? '#fff' : '#999' }}>
							{item.icon}
						</ListItemIcon>
						<ListItemText
							primaryTypographyProps={{ fontSize: 14, fontWeight: isActive(item.url) ? 700 : 500 }}
						>
							{item.title}
						</ListItemText>
					</ListItemButton>
				</Link>
			))}

			{/* CS (Customer Service) — kengaytiriluvchi guruh */}
			<ListItemButton onClick={() => setCsOpen(!csOpen)} className={isCsActive ? 'menu on' : 'menu'} sx={itemStyle(isCsActive)}>
				<ListItemIcon sx={{ minWidth: 36, color: isCsActive ? '#fff' : '#999' }}>
					<HeadsetMicOutlinedIcon />
				</ListItemIcon>
				<ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: isCsActive ? 700 : 500 }}>
					CS (Customer Service)
				</ListItemText>
				{csOpen ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
			</ListItemButton>
			<Collapse in={csOpen} timeout="auto" unmountOnExit>
				<List disablePadding sx={{ pl: 2 }}>
					{cs_sub_menu.map((sub) => (
						<Link href={sub.url} key={sub.url} style={{ textDecoration: 'none' }}>
							<ListItemButton
								className={isActive(sub.url) ? 'menu-sub on' : 'menu-sub'}
								sx={{
									borderRadius: 2,
									mb: 0.5,
									pl: 3,
									pr: 2,
									py: 1,
									color: isActive(sub.url) ? '#FF4D8D' : '#888',
									background: isActive(sub.url) ? 'rgba(255,77,141,0.08)' : 'transparent',
									'&:hover': { background: 'rgba(255,77,141,0.06)', color: '#FF4D8D' },
								}}
							>
								<FiberManualRecordIcon sx={{ fontSize: 6, mr: 1.5, color: isActive(sub.url) ? '#FF4D8D' : '#ccc' }} />
								<ListItemText
									primaryTypographyProps={{ fontSize: 13.5, fontWeight: isActive(sub.url) ? 700 : 500 }}
								>
									{sub.title}
								</ListItemText>
							</ListItemButton>
						</Link>
					))}
				</List>
			</Collapse>
		</List>
	);
};

export default AdminMenuList;
