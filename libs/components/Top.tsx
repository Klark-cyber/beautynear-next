import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { getJwtToken, logOut, updateUserInfo } from '../auth';
import { Stack, Box, Badge, IconButton, Avatar, Menu, MenuItem, Divider, Typography, Button } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import { MenuProps } from '@mui/material/Menu';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { Logout } from '@mui/icons-material';
import { CaretDown } from 'phosphor-react';
import useDeviceDetect from '../hooks/useDeviceDetect';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { REACT_APP_API_URL } from '../config';
import { MemberType } from '../enums/member.enum';

// ── Styled lang dropdown ──────────────────────────────────────────────────────
const StyledMenu = styled((props: MenuProps) => (
	<Menu
		elevation={0}
		anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
		transformOrigin={{ vertical: 'top', horizontal: 'right' }}
		{...props}
	/>
))(({ theme }) => ({
	'& .MuiPaper-root': {
		borderRadius: 12,
		marginTop: theme.spacing(1),
		minWidth: 140,
		boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
		'& .MuiMenu-list': { padding: '6px' },
		'& .MuiMenuItem-root': {
			borderRadius: 8,
			gap: 8,
			fontSize: 14,
			transition: 'background 0.2s',
			'&:hover': { background: alpha('#FF4D8D', 0.08) },
		},
	},
}));

const Top = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	const [lang, setLang] = useState<string>('en');
	const [anchorLang, setAnchorLang] = useState<null | HTMLElement>(null);
	const [anchorUser, setAnchorUser] = useState<null | HTMLElement>(null);
	const [scrolled, setScrolled] = useState(false);

	/** LIFECYCLES **/
	useEffect(() => {
		const stored = localStorage.getItem('locale') ?? 'en';
		setLang(stored);
	}, [router]);

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 50);
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	/** HANDLERS **/
	const langChoice = useCallback(
		async (e: React.MouseEvent<HTMLElement>) => {
			const chosen = (e.currentTarget as HTMLElement).id;
			setLang(chosen);
			localStorage.setItem('locale', chosen);
			setAnchorLang(null);
			await router.push(router.asPath, router.asPath, { locale: chosen });
		},
		[router],
	);

	const isActive = (path: string) => router.pathname === path || router.pathname.startsWith(path + '/');

	// ── MOBILE ──────────────────────────────────────────────────────────────────
	if (device === 'mobile') {
		return (
			<Stack
				className="mobile-top"
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{
					px: 2,
					py: 1.5,
					background: 'rgba(255,255,255,0.95)',
					backdropFilter: 'blur(12px)',
					borderBottom: '1px solid rgba(255,77,141,0.1)',
					position: 'sticky',
					top: 0,
					zIndex: 100,
				}}
			>
				{/* Logo */}
				<Link href="/">
					<Box
						component="div"
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 1,
							cursor: 'pointer',
							'&:hover img': { transform: 'scale(1.05)' },
							'& img': { transition: 'transform 0.2s' },
						}}
					>
						<img src="/img/logo/logo.svg" alt="BeautyNear" height={32} />
					</Box>
				</Link>

				{/* Right actions */}
				<Stack direction="row" alignItems="center" gap={1}>
					{user?._id && (
						<IconButton
							size="small"
							sx={{
								color: '#666',
								transition: 'all 0.2s',
								'&:hover': {
									color: '#FF4D8D',
									'& svg': { animation: 'bellShake 0.4s ease' },
								},
								'@keyframes bellShake': {
									'0%,100%': { transform: 'rotate(0deg)' },
									'25%': { transform: 'rotate(-15deg)' },
									'75%': { transform: 'rotate(15deg)' },
								},
							}}
						>
							<Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}>
								<NotificationsOutlinedIcon fontSize="small" />
							</Badge>
						</IconButton>
					)}

					{user?._id ? (
						<Avatar
							src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
							sx={{
								width: 32,
								height: 32,
								cursor: 'pointer',
								border: '2px solid transparent',
								transition: 'all 0.25s',
								'&:hover': {
									border: '2px solid #FF4D8D',
									transform: 'scale(1.1)',
									boxShadow: '0 0 0 3px rgba(255,77,141,0.2)',
								},
							}}
							onClick={() => router.push('/mypage')}
						/>
					) : (
						<Link href="/account/join">
							<Box
								component="div"
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 0.5,
									color: '#FF4D8D',
									fontSize: 13,
									fontWeight: 600,
									cursor: 'pointer',
									transition: 'all 0.2s',
									'&:hover': { opacity: 0.8 },
								}}
							>
								<AccountCircleOutlinedIcon sx={{ fontSize: 20 }} />
								{t('Login')}
							</Box>
						</Link>
					)}
				</Stack>
			</Stack>
		);
	}

	// ── DESKTOP ─────────────────────────────────────────────────────────────────
	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/salons', label: 'Salons' },
		{ href: '/services', label: 'Services' },
		{ href: '/specialists', label: 'Specialists' },
		{ href: '/community?articleCategory=FREE', label: 'Community' },
		...(user?._id ? [{ href: '/mypage', label: 'My Page' }] : []),
	];

	return (
		<Stack
			className={`navbar ${scrolled ? 'scrolled' : ''}`}
			sx={{
				position: 'sticky',
				top: 0,
				zIndex: 100,
				background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.98)',
				backdropFilter: 'blur(12px)',
				borderBottom: '1px solid rgba(255,77,141,0.1)',
				boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
				transition: 'all 0.3s ease',
			}}
		>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{ maxWidth: 1280, mx: 'auto', width: '100%', px: 4, py: 1.5 }}
			>
				{/* Logo */}
				<Link href="/">
					<Box
						component="div"
						sx={{
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: 1,
							transition: 'all 0.25s',
							'&:hover': {
								filter: 'drop-shadow(0 0 8px rgba(255,77,141,0.4))',
								transform: 'scale(1.03)',
							},
						}}
					>
						<img src="/img/logo/logo.svg" alt="BeautyNear" height={36} />
					</Box>
				</Link>

				{/* Nav links */}
				<Stack direction="row" alignItems="center" gap={0.5}>
					{navLinks.map((link) => (
						<Link key={link.href} href={link.href}>
							<Box
								component="div"
								sx={{
									position: 'relative',
									px: 1.5,
									py: 1,
									cursor: 'pointer',
									fontSize: 14,
									fontWeight: isActive(link.href === '/' ? '/' : link.href.split('?')[0]) ? 600 : 500,
									color: isActive(link.href === '/' ? '/' : link.href.split('?')[0]) ? '#FF4D8D' : '#333',
									transition: 'color 0.2s',
									'&::after': {
										content: '""',
										position: 'absolute',
										bottom: 2,
										left: '50%',
										transform: isActive(link.href.split('?')[0]) ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
										width: '70%',
										height: 2,
										background: 'linear-gradient(90deg, #FF4D8D, #FF85B3)',
										borderRadius: 1,
										transition: 'transform 0.25s ease',
									},
									'&:hover': {
										color: '#FF4D8D',
										'&::after': { transform: 'translateX(-50%) scaleX(1)' },
									},
								}}
							>
								{t(link.label)}
							</Box>
						</Link>
					))}
				</Stack>

				{/* Right actions */}
				<Stack direction="row" alignItems="center" gap={1.5}>
					{/* Notification */}
					{user?._id && (
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
							<Badge badgeContent={3} color="error">
								<NotificationsOutlinedIcon />
							</Badge>
						</IconButton>
					)}

					{/* Lang switcher */}
					<Button
						disableRipple
						onClick={(e: any) => setAnchorLang(e.currentTarget)}
						endIcon={
							<CaretDown
								size={12}
								weight="fill"
								style={{
									transition: 'transform 0.2s',
									transform: anchorLang ? 'rotate(180deg)' : 'rotate(0deg)',
								}}
							/>
						}
						sx={{
							minWidth: 0,
							px: 1,
							py: 0.5,
							color: '#555',
							fontSize: 13,
							fontWeight: 500,
							borderRadius: 2,
							transition: 'all 0.2s',
							'&:hover': { background: 'rgba(255,77,141,0.08)', color: '#FF4D8D' },
						}}
					>
						<Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
							<img src={`/img/flag/lang${lang}.png`} alt={lang} width={18} height={12} style={{ borderRadius: 2 }} />
							<span style={{ textTransform: 'uppercase' }}>{lang}</span>
						</Box>
					</Button>

					<StyledMenu anchorEl={anchorLang} open={Boolean(anchorLang)} onClose={() => setAnchorLang(null)}>
						{[
							{ id: 'kr', label: t('Korean'), flag: 'langkr.png' },
							{ id: 'en', label: t('English'), flag: 'langen.png' },
							{ id: 'ru', label: t('Russian'), flag: 'langru.png' },
						].map((item) => (
							<MenuItem key={item.id} id={item.id} onClick={langChoice} selected={lang === item.id}>
								<img src={`/img/flag/${item.flag}`} alt={item.id} width={18} height={12} style={{ borderRadius: 2 }} />
								{item.label}
							</MenuItem>
						))}
					</StyledMenu>

					{/* User */}
					{user?._id ? (
						<>
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
									sx={{
										width: 28,
										height: 28,
										border: '2px solid #FF85B3',
										transition: 'transform 0.2s',
										'&:hover': { transform: 'scale(1.1)' },
									}}
								/>
								<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#333', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
									{user?.memberNick}
								</Typography>
								<CaretDown size={12} weight="fill" color="#999" />
							</Box>

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
								{user?.memberType === MemberType.AGENT && (
									<MenuItem onClick={() => { router.push('/mypage?category=myAgentInfo'); setAnchorUser(null); }}
										sx={{ gap: 1.5, py: 1.2, fontSize: 14, '&:hover': { color: '#FF4D8D' } }}>
										💼 {t('Agent Dashboard')}
									</MenuItem>
								)}
								<MenuItem onClick={() => { router.push('/mypage'); setAnchorUser(null); }}
									sx={{ gap: 1.5, py: 1.2, fontSize: 14, '&:hover': { color: '#FF4D8D' } }}>
									👤 {t('My Page')}
								</MenuItem>
								<Divider />
								<MenuItem onClick={() => { logOut(); setAnchorUser(null); }}
									sx={{ gap: 1.5, py: 1.2, fontSize: 14, color: '#e53935', '&:hover': { background: '#FFF5F5' } }}>
									<Logout fontSize="small" />
									{t('Logout')}
								</MenuItem>
							</Menu>
						</>
					) : (
						<Link href="/account/join">
							<Box
								component="div"
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 0.75,
									px: 2,
									py: 1,
									borderRadius: 3,
									background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
									color: '#fff',
									fontSize: 13,
									fontWeight: 600,
									cursor: 'pointer',
									transition: 'all 0.25s',
									boxShadow: '0 2px 12px rgba(255,77,141,0.3)',
									'&:hover': {
										transform: 'translateY(-2px)',
										boxShadow: '0 6px 20px rgba(255,77,141,0.4)',
									},
									'&:active': { transform: 'translateY(0)' },
								}}
							>
								<AccountCircleOutlinedIcon sx={{ fontSize: 18 }} />
								{t('Login')}
							</Box>
						</Link>
					)}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withRouter(Top);