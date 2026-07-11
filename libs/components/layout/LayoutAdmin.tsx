import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ComponentType } from 'react';
import {
	Box, AppBar, Toolbar, Avatar, IconButton,
	Menu, MenuItem, Divider, Typography, Tooltip, Badge,
} from '@mui/material';
import MenuList from '../admin/AdminMenuList';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { MemberType } from '../../enums/member.enum';
import { Logout, NotificationsOutlined } from '@mui/icons-material';
import { useTranslation } from 'next-i18next';

const DRAWER_WIDTH = 260;

const withAdminLayout = (Component: ComponentType) => {
	return (props: object) => {
		const router = useRouter();
		const { t } = useTranslation('common');
		const user = useReactiveVar(userVar);
		const [anchorUser, setAnchorUser] = useState<null | HTMLElement>(null);
		const [loading, setLoading] = useState(true);

		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
			setLoading(false);
		}, []);

		useEffect(() => {
			if (!loading && user.memberType !== MemberType.ADMIN) {
				router.push('/').then();
			}
		}, [loading, user, router]);

		if (!user || user?.memberType !== MemberType.ADMIN) return null;

		return (
			// ⚠️ SODDA, ISHONCHLI NAQSH: Sidebar "position: fixed" — sahifa
			// kontentidan MUSTAQIL, har doim to'liq 100vh. Kontent esa oddiy
			// "margin-left: 260px" bilan sidebar'dan keyin boshlanadi va
			// sahifa NORMAL holda scroll qiladi (bu murakkab flex-balandlik
			// hisob-kitobidan ko'ra ancha barqaror — sanoatda standart naqsh).
			<Box component="main" id="pc-wrap" className="admin" sx={{ background: '#FFF8FA', minHeight: '100vh' }}>

				{/* Sidebar — fixed, sahifa scroll qilsa ham joyidan qimirlamaydi */}
				<Box
					component="aside"
					className="admin-sidebar"
					sx={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: DRAWER_WIDTH,
						height: '100vh',
						background: '#fff',
						borderRight: '1px solid rgba(255,77,141,0.12)',
						boxShadow: '2px 0 12px rgba(0,0,0,0.03)',
						overflowY: 'auto',
						zIndex: 1200,
					}}
				>
					{/* Logo */}
					<Box component="div" sx={{ px: 3, py: 3, borderBottom: '1px solid rgba(255,77,141,0.1)' }}>
						<img src="/img/logo/logo.png" alt="BeautyNear" height={30} />
						<Typography sx={{ color: '#FF4D8D', fontSize: 11, mt: 0.5, letterSpacing: 1, fontWeight: 700, textTransform: 'uppercase' }}>
							Admin Panel
						</Typography>
					</Box>

					{/* User info */}
					<Box
						component="div"
						sx={{
							px: 2, py: 2, mx: 2, my: 1.5,
							borderRadius: 2.5,
							background: '#FFF0F5',
							border: '1px solid rgba(255,77,141,0.18)',
							display: 'flex', alignItems: 'center', gap: 1.5,
						}}
					>
						<Avatar
							src={!user?.memberImage ? '/img/profile/defaultUser.svg' : user.memberImage.startsWith('http') ? user.memberImage : `${REACT_APP_API_URL}/${user.memberImage}`}
							sx={{ width: 36, height: 36, border: '2px solid #FF4D8D' }}
						/>
						<Box component="div">
							<Typography sx={{ color: '#1a1a1a', fontSize: 13, fontWeight: 700 }}>{user?.memberNick}</Typography>
							<Typography sx={{ color: '#999', fontSize: 11 }}>Administrator</Typography>
						</Box>
					</Box>

					<MenuList />
				</Box>

				{/* Main content — sidebar kengligiga teng margin-left bilan */}
				<Box component="div" sx={{ marginLeft: `${DRAWER_WIDTH}px` }}>

					{/* Top AppBar — kontent ustida sticky, sidebar bilan aloqasi yo'q */}
					<AppBar
						position="sticky"
						sx={{
							background: '#fff',
							boxShadow: 'none',
							borderBottom: '1px solid rgba(255,77,141,0.08)',
							color: '#333',
						}}
					>
						<Toolbar sx={{ justifyContent: 'flex-end', gap: 1.5, minHeight: '80px !important' }}>
							<IconButton
								sx={{ color: '#666', '&:hover': { color: '#FF4D8D', background: 'rgba(255,77,141,0.08)' } }}
							>
								<Badge badgeContent={2} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>
									<NotificationsOutlined />
								</Badge>
							</IconButton>

							<Tooltip title={t('Account settings')}>
								<Box
									component="div"
									onClick={(e: any) => setAnchorUser(e.currentTarget)}
									sx={{
										display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
										px: 1.5, py: 0.75, borderRadius: 3,
										border: '1px solid rgba(255,77,141,0.2)',
										'&:hover': { background: 'rgba(255,77,141,0.06)', borderColor: '#FF4D8D' },
									}}
								>
									<Avatar
										src={!user?.memberImage ? '/img/profile/defaultUser.svg' : user.memberImage.startsWith('http') ? user.memberImage : `${REACT_APP_API_URL}/${user.memberImage}`}
										sx={{ width: 28, height: 28, border: '2px solid #FF85B3' }}
									/>
									<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{user?.memberNick}</Typography>
								</Box>
							</Tooltip>

							<Menu
								anchorEl={anchorUser}
								open={Boolean(anchorUser)}
								onClose={() => setAnchorUser(null)}
								PaperProps={{ sx: { mt: 1, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden' } }}
							>
								<Box component="div" sx={{ px: 2, py: 1.5, background: 'linear-gradient(135deg, #FFF0F5, #FFF)' }}>
									<Typography variant="subtitle2" fontWeight={700}>{user?.memberNick}</Typography>
									<Typography variant="caption" color="text.secondary">{user?.memberPhone}</Typography>
								</Box>
								<Divider />
								<MenuItem
									onClick={() => { logOut(); setAnchorUser(null); }}
									sx={{ gap: 1.5, py: 1.2, fontSize: 14, color: '#e53935', '&:hover': { background: '#FFF5F5' } }}
								>
									<Logout fontSize="small" />
									{t('Logout')}
								</MenuItem>
							</Menu>
						</Toolbar>
					</AppBar>

					{/* Page content */}
					<Box component="div" id="bunker" sx={{ p: 4 }}>
						<Box component="div" sx={{ maxWidth: 1500, mx: 'auto' }}>
							{/* @ts-ignore */}
							<Component {...props} />
						</Box>
					</Box>
				</Box>
			</Box>
		);
	};
};

export default withAdminLayout;