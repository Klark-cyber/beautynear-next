import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ComponentType } from 'react';
import {
	Box, Stack, AppBar, Toolbar, Drawer, Avatar, IconButton,
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
			<Box component="main" id="pc-wrap" className="admin" sx={{ display: 'flex', minHeight: '100vh', background: '#F8F9FC' }}>

				{/* Sidebar Drawer */}
				<Drawer
					variant="permanent"
					anchor="left"
					className="aside"
					sx={{
						width: DRAWER_WIDTH,
						flexShrink: 0,
						'& .MuiDrawer-paper': {
							width: DRAWER_WIDTH,
							boxSizing: 'border-box',
							background: 'linear-gradient(160deg, #1a0a12 0%, #2d1020 100%)',
							border: 'none',
							boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
						},
					}}
				>
					{/* Logo */}
					<Box
						component="div"
						sx={{
							px: 3,
							py: 3,
							borderBottom: '1px solid rgba(255,255,255,0.08)',
						}}
					>
						<Box
							component="div"
							sx={{
								transition: 'filter 0.25s',
								'&:hover': { filter: 'drop-shadow(0 0 8px rgba(255,133,179,0.5))' },
							}}
						>
							<img src="/img/logo/logoWhite.svg" alt="BeautyNear" height={30} />
						</Box>
						<Typography
							sx={{
								color: 'rgba(255,255,255,0.4)',
								fontSize: 11,
								mt: 0.5,
								letterSpacing: 1,
								textTransform: 'uppercase',
							}}
						>
							Admin Panel
						</Typography>
					</Box>

					{/* User info */}
					<Box
						component="div"
						sx={{
							px: 3,
							py: 2,
							mx: 2,
							my: 1.5,
							borderRadius: 2,
							background: 'rgba(255,77,141,0.12)',
							border: '1px solid rgba(255,77,141,0.2)',
							display: 'flex',
							alignItems: 'center',
							gap: 1.5,
						}}
					>
						<Avatar
							src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
							sx={{
								width: 36,
								height: 36,
								border: '2px solid #FF4D8D',
								transition: 'transform 0.2s',
								'&:hover': { transform: 'scale(1.1)' },
							}}
						/>
						<Box component="div">
							<Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
								{user?.memberNick}
							</Typography>
							<Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
								Administrator
							</Typography>
						</Box>
					</Box>

					<MenuList />
				</Drawer>

				{/* Main content */}
				<Box component="div" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

					{/* Top AppBar */}
					<AppBar
						position="sticky"
						sx={{
							background: 'rgba(255,255,255,0.95)',
							backdropFilter: 'blur(12px)',
							boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
							borderBottom: '1px solid rgba(255,77,141,0.08)',
							color: '#333',
						}}
					>
						<Toolbar sx={{ justifyContent: 'flex-end', gap: 1.5, minHeight: '60px !important' }}>
							{/* Notification */}
							<IconButton
								sx={{
									color: '#666',
									transition: 'all 0.2s',
									'&:hover': {
										color: '#FF4D8D',
										background: 'rgba(255,77,141,0.08)',
										'& svg': { animation: 'bellShake 0.4s ease' },
									},
									'@keyframes bellShake': {
										'0%,100%': { transform: 'rotate(0deg)' },
										'25%': { transform: 'rotate(-15deg)' },
										'75%': { transform: 'rotate(15deg)' },
									},
								}}
							>
								<Badge badgeContent={2} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>
									<NotificationsOutlined />
								</Badge>
							</IconButton>

							{/* User avatar */}
							<Tooltip title={t('Account settings')}>
								<Box
									component="div"
									onClick={(e: any) => setAnchorUser(e.currentTarget)}
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 1,
										cursor: 'pointer',
										px: 1.5,
										py: 0.75,
										borderRadius: 3,
										border: '1px solid rgba(255,77,141,0.2)',
										transition: 'all 0.25s',
										'&:hover': {
											background: 'rgba(255,77,141,0.06)',
											borderColor: '#FF4D8D',
											boxShadow: '0 2px 12px rgba(255,77,141,0.15)',
										},
									}}
								>
									<Avatar
										src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
										sx={{ width: 28, height: 28, border: '2px solid #FF85B3' }}
									/>
									<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
										{user?.memberNick}
									</Typography>
								</Box>
							</Tooltip>

							<Menu
								anchorEl={anchorUser}
								open={Boolean(anchorUser)}
								onClose={() => setAnchorUser(null)}
								PaperProps={{
									sx: {
										mt: 1,
										borderRadius: 3,
										boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
										minWidth: 200,
										overflow: 'hidden',
									},
								}}
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
					<Box
						component="div"
						id="bunker"
						sx={{
							flex: 1,
							p: 3,
							overflow: 'auto',
						}}
					>
						{/* @ts-ignore */}
						<Component {...props} />
					</Box>
				</Box>
			</Box>
		);
	};
};

export default withAdminLayout;