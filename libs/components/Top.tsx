import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { getJwtToken, logOut, updateUserInfo } from '../auth';
import { Stack, Box, Badge, IconButton, Avatar, Menu, MenuItem, Divider, Typography } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import { MenuProps } from '@mui/material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Logout } from '@mui/icons-material';
import { CaretDown } from 'phosphor-react';
import useDeviceDetect from '../hooks/useDeviceDetect';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { REACT_APP_API_URL } from '../config';
import { MemberType } from '../enums/member.enum';

const StyledMenu = styled((props: MenuProps) => (
	<Menu elevation={0}
		anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
		transformOrigin={{ vertical: 'top', horizontal: 'right' }}
		{...props} />
))(({ theme }) => ({
	'& .MuiPaper-root': {
		borderRadius: 12, marginTop: theme.spacing(1), minWidth: 160,
		boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
		'& .MuiMenu-list': { padding: '6px' },
		'& .MuiMenuItem-root': {
			borderRadius: 8, gap: 8, fontSize: 14, fontFamily: 'Inter, sans-serif',
			'&:hover': { background: alpha('#FF5D92', 0.08) },
		},
	},
}));

const Top = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const router = useRouter();
	const [lang, setLang] = useState('en');
	const [anchorUser, setAnchorUser] = useState<null | HTMLElement>(null);

	useEffect(() => {
		const stored = localStorage.getItem('locale') ?? 'en';
		setLang(stored);
	}, [router]);

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	const langChoice = useCallback(async (locale: string) => {
		setLang(locale);
		localStorage.setItem('locale', locale);
		await router.push(router.asPath, router.asPath, { locale });
	}, [router]);

	const isHomepage = router.pathname === '/';

	const isActive = (href: string) => {
		if (href === '/') return router.pathname === '/';
		return router.pathname.startsWith(href.split('?')[0]);
	};

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/salons', label: 'Salons' },
		{ href: '/salons?salonType=CLINIC', label: 'Clinics' },
		{ href: '/salons?offers=true', label: 'Offers' },
	];

	// ── MOBILE ──────────────────────────────────────────────────────────────────
	if (device === 'mobile') {
		return (
			<Stack direction="row" alignItems="center" justifyContent="space-between"
				sx={{
					px: 2, height: 56,
					background: 'rgba(255,255,255,0.97)',
					backdropFilter: 'blur(12px)',
					borderBottom: '1px solid rgba(255,93,146,0.1)',
					position: 'sticky', top: 0, zIndex: 100,
				}}>
				<Link href="/">
					<Box component="div" sx={{ cursor: 'pointer' }}>
						<img src="/img/logo/logo.png" alt="BeautyNear" height={28} />
					</Box>
				</Link>
				<Stack direction="row" alignItems="center" gap={1}>
					{user?._id ? (
						<Avatar
							src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
							sx={{ width: 30, height: 30, cursor: 'pointer', border: '2px solid rgba(255,93,146,0.3)' }}
							onClick={() => router.push('/mypage')}
						/>
					) : (
						<Link href="/account/join">
							<Box component="div" sx={{
								px: 2, py: 0.75, background: '#FF5D92', color: '#fff',
								borderRadius: '20px', fontSize: 12, fontWeight: 700,
								fontFamily: 'Inter, sans-serif', cursor: 'pointer',
							}}>
								{t('Login')}
							</Box>
						</Link>
					)}
				</Stack>
			</Stack>
		);
	}

	// ── DESKTOP ──────────────────────────────────────────────────────────────────
	return (
		<Box component="div" sx={{
			position: isHomepage ? 'absolute' : 'sticky',
			top: 0, left: 0, right: 0, zIndex: 100,
			display: 'flex', alignItems: 'center', justifyContent: 'space-between',
			px: '48px',
			pt: isHomepage ? '20px' : 0,
			height: isHomepage ? 'auto' : 64,
			background: isHomepage ? 'transparent' : '#fff',
			borderBottom: isHomepage ? 'none' : '1px solid rgba(255,93,146,0.08)',
			boxShadow: isHomepage ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
		}}>

			{/* Logo */}
			<Link href="/">
				<Box component="div" sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
					<img src="/img/logo/logo.png" alt="BeautyNear" height={36} style={{ objectFit: 'contain' }} />
				</Box>
			</Link>

			{/* Floating glass nav — center */}
			<Stack direction="row" alignItems="center" gap={0.5} sx={{
				height: 52, px: '24px',
				background: 'rgba(255,255,255,0.82)',
				backdropFilter: 'blur(28px)',
				border: '1px solid rgba(255,255,255,0.65)',
				borderRadius: '999px',
				boxShadow: '0 20px 50px rgba(255,140,180,0.14)',
			}}>
				{navLinks.map((link) => (
					<Link key={link.href} href={link.href}>
						<Box component="div" sx={{
							px: '18px', py: '8px',
							fontSize: 14, fontWeight: 500,
							fontFamily: 'Inter, sans-serif',
							color: isActive(link.href) ? '#FF5D92' : '#555',
							borderRadius: '999px',
							cursor: 'pointer', transition: 'all 0.2s',
							'&:hover': { color: '#FF5D92', background: 'rgba(255,93,146,0.07)' },
						}}>
							{t(link.label)}
						</Box>
					</Link>
				))}
			</Stack>

			{/* Right */}
			<Stack direction="row" alignItems="center" gap={1.5}>
				{/* Lang */}
				<Stack direction="row" gap={0.5}>
					{[{ id: 'kr', label: 'KR' }, { id: 'en', label: 'EN' }, { id: 'ru', label: 'UZ' }].map((item) => (
						<Box key={item.id} component="div" onClick={() => langChoice(item.id)} sx={{
							px: 1, py: 0.4, fontSize: 11, fontWeight: 600,
							fontFamily: 'Inter, sans-serif',
							color: lang === item.id ? '#FF5D92' : '#999',
							border: `1px solid ${lang === item.id ? 'rgba(255,93,146,0.45)' : '#e0e0e0'}`,
							borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s',
							background: lang === item.id ? 'rgba(255,93,146,0.06)' : 'rgba(255,255,255,0.7)',
							'&:hover': { color: '#FF5D92', borderColor: 'rgba(255,93,146,0.4)' },
						}}>
							{item.label}
						</Box>
					))}
				</Stack>

				{/* Notification */}
				<IconButton sx={{
					color: '#777', p: 0.75,
					'&:hover': { color: '#FF5D92', background: 'rgba(255,93,146,0.08)' },
				}}>
					<Badge badgeContent={user?._id ? 2 : 0} color="error"
						sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 14, height: 14 } }}>
						<NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
					</Badge>
				</IconButton>

				{/* User avatar — ChatGPT style: avatar + nick + caret */}
				{user?._id ? (
					<>
						<Box component="div" onClick={(e: any) => setAnchorUser(e.currentTarget)} sx={{
							display: 'flex', alignItems: 'center', gap: 0.75,
							cursor: 'pointer', px: 1.25, py: 0.5,
							borderRadius: '999px',
							border: '1px solid rgba(255,93,146,0.2)',
							background: 'rgba(255,255,255,0.75)',
							backdropFilter: 'blur(10px)',
							transition: 'all 0.2s',
							'&:hover': { borderColor: '#FF5D92', background: 'rgba(255,93,146,0.06)' },
						}}>
							<Avatar
								src={user?.memberImage
									? `${REACT_APP_API_URL}/${user?.memberImage}`
									: '/img/profile/defaultUser.svg'}
								sx={{
									width: 28, height: 28,
									border: '2px solid #FFA4C1',
								}}
							/>
							<Typography sx={{
								fontSize: 13, fontWeight: 600, color: '#333',
								fontFamily: 'Inter, sans-serif',
								maxWidth: 80, overflow: 'hidden',
								textOverflow: 'ellipsis', whiteSpace: 'nowrap',
							}}>
								{user?.memberNick}
							</Typography>
							<CaretDown size={11} weight="fill" color="#aaa" />
						</Box>

						<Menu anchorEl={anchorUser} open={Boolean(anchorUser)}
							onClose={() => setAnchorUser(null)}
							PaperProps={{ sx: { mt: 1, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 200 } }}>
							<Box component="div" sx={{ px: 2, py: 1.5, background: 'linear-gradient(135deg,#FFF0F5,#fff)' }}>
								<Typography variant="subtitle2" fontWeight={700} fontFamily="Inter">
									{user?.memberNick}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{user?.memberPhone}
								</Typography>
							</Box>
							<Divider />
							{user?.memberType === MemberType.AGENT && (
								<MenuItem onClick={() => { router.push('/mypage?category=myAgentInfo'); setAnchorUser(null); }}>
									💼 {t('Agent Dashboard')}
								</MenuItem>
							)}
							<MenuItem onClick={() => { router.push('/mypage'); setAnchorUser(null); }}>
								👤 {t('My Page')}
							</MenuItem>
							<Divider />
							<MenuItem onClick={() => { logOut(); setAnchorUser(null); }}
								sx={{ color: '#e53935', '&:hover': { background: '#FFF5F5' } }}>
								<Logout fontSize="small" /> {t('Logout')}
							</MenuItem>
						</Menu>
					</>
				) : (
					<Link href="/account/join">
						<Box component="div" sx={{
							px: '22px', py: '9px',
							background: 'linear-gradient(135deg, #FF6B9D, #FF4F86)',
							color: '#fff', borderRadius: '999px',
							fontSize: 14, fontWeight: 700,
							fontFamily: 'Inter, sans-serif',
							cursor: 'pointer', letterSpacing: 0.2,
							boxShadow: '0 8px 24px rgba(255,93,146,0.35)',
							transition: 'all 0.25s',
							'&:hover': {
								transform: 'translateY(-2px)',
								boxShadow: '0 12px 32px rgba(255,93,146,0.45)',
							},
						}}>
							{t('Login')}
						</Box>
					</Link>
				)}
			</Stack>
		</Box>
	);
};

export default withRouter(Top);