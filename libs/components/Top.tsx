import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { getJwtToken, logOut, updateUserInfo } from '../auth';
import { Stack, Box, Badge, IconButton, Avatar, Menu, MenuItem, Divider, Typography } from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { Logout } from '@mui/icons-material';
import { CaretDown } from 'phosphor-react';
import useDeviceDetect from '../hooks/useDeviceDetect';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { REACT_APP_API_URL } from '../config';
import { MemberType } from '../enums/member.enum';

const Top = () => {
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const router = useRouter();
	const [lang, setLang] = useState('en');
	const [anchorUser, setAnchorUser] = useState<null | HTMLElement>(null);

	/** LIFECYCLES **/
	useEffect(() => {
		// ⚠️ TUZATILDI: avval localStorage'dan o'qilar edi — bu Next.js'ning
		// haqiqiy router.locale'i bilan sinxronlanmay qolishi mumkin edi
		// (masalan eski qiymat saqlanib qolib, tugma noto'g'ri tilni
		// "faol" deb ko'rsatishi). Endi yagona haqiqiy manba — router.locale.
		if (router.locale) {
			setLang(router.locale);
			localStorage.setItem('locale', router.locale);
		}
	}, [router.locale]);

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	/** HANDLERS **/
	const langChoice = useCallback(
		async (locale: string) => {
			setLang(locale);
			localStorage.setItem('locale', locale);
			await router.push(router.asPath, router.asPath, { locale });
		},
		[router],
	);

	// ⚠️ TUZATILDI: avval faqat pathname solishtirilar edi, query
	// parametrlar (masalan ?offers=true) e'tiborsiz qoldirilar edi —
	// natijada "Salons" va "Offers" bir vaqtda "faol" bo'lib qizarardi.
	// ⚠️ TUZATILDI: "Salons" (query'siz) doim /salons?input=... (filtr/
	// sahifalash) bilan ishlaydi — avvalgi tekshiruv "hech qanday query
	// bo'lmasligi kerak" deb talab qilib, reset/filtrlashdan keyin "Salons"
	// hech qachon faol ko'rinmay qolishiga sabab bo'lgan edi.
	const isActive = (href: string) => {
		const [hrefPath, hrefQuery] = href.split('?');
		if (hrefPath === '/') return router.pathname === '/' && !router.asPath.includes('?');
		if (router.pathname.split('?')[0] !== hrefPath) return false;
		if (hrefQuery) return router.asPath.includes(hrefQuery);
		// Query'siz link — faqat BOSHQA (query'li) opa-uka linklardan biriga
		// mos kelmasa faol hisoblanadi (masalan "Offers"ga mos kelmasa)
		const siblingQueries = navLinks
			.filter((l) => l.href.split('?')[0] === hrefPath && l.href.includes('?'))
			.map((l) => l.href.split('?')[1]);
		return !siblingQueries.some((q) => router.asPath.includes(q));
	};

	// ⚠️ "Clinics" o'chirildi — u baribir /salons?salonType=CLINIC ga
	// borar edi, alohida bandga hojat yo'q (sizning so'rovingiz bo'yicha)
	// ⚠️ TUZATILDI: "Offers" hech qanday vazifa bajarmas edi (backend'da
	// mos filtr yo'q, query parametri hech qayerda o'qilmas edi) —
	// so'rovingiz bo'yicha olib tashlandi.
	// ⚠️ TUZATILDI: "Mypage" endi faqat login qilgan foydalanuvchilarga
	// ko'rinadi.
	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/salons', label: 'Salons' },
		{ href: '/service', label: 'Services' },
		{ href: '/specialist', label: 'Specialists' },
		{ href: '/community', label: 'Community' },
		...(user?._id ? [{ href: '/mypage', label: 'Mypage' }] : []),
	];

	/** MOBILE **/
	if (device === 'mobile') {
		return (
			<Stack className="navbar-mobile">
				<Link href="/">
					<Box component="div" className="logo-box">
						<img src="/img/logo/logo.png" alt="BeautyNear" />
					</Box>
				</Link>
				<Stack direction="row" alignItems="center" gap={1}>
					{user?._id ? (
						<Avatar
							className="user-avatar"
							src={user?.memberImage ? (user.memberImage.startsWith('http') ? user.memberImage : `${REACT_APP_API_URL}/${user.memberImage}`) : '/img/profile/defaultUser.svg'}
							onClick={() => router.push('/mypage')}
						/>
					) : (
						<Link href="/account/join">
							<Box component="div" className="login-btn-mobile">{t('Login')}</Box>
						</Link>
					)}
				</Stack>
			</Stack>
		);
	}

	/** PC — barcha sahifada bir xil: fixed, shaffof oq **/
	return (
		<Stack className="navbar">
			<Stack className="navbar-inner" direction="row" alignItems="center" justifyContent="space-between">
				{/* Logo */}
				<Link href="/">
					<Box component="div" className="navbar-logo">
						<img src="/img/logo/logo.png" alt="BeautyNear" />
					</Box>
				</Link>

				{/* Floating glass nav */}
				<Stack className="navbar-glass" direction="row" alignItems="center">
					{navLinks.map((link) => (
						<Link key={link.href} href={link.href}>
							<Box component="div" className={`nav-link ${isActive(link.href) ? 'active' : ''}`}>
								{t(link.label)}
							</Box>
						</Link>
					))}
				</Stack>

				{/* Right actions */}
				<Stack className="navbar-right" direction="row" alignItems="center">
					{/* Lang */}
					<Stack direction="row" className="lang-row">
						{[
							{ id: 'kr', label: 'KR' },
							{ id: 'en', label: 'EN' },
							{ id: 'ru', label: 'RU' },
						].map((item) => (
							<Box
								key={item.id}
								component="div"
								className={`lang-btn ${lang === item.id ? 'active' : ''}`}
								onClick={() => langChoice(item.id)}
							>
								{item.label}
							</Box>
						))}
					</Stack>

					{/* Notification */}
					<IconButton className="bell-btn">
						<Badge badgeContent={user?._id ? 2 : 0} color="error">
							<NotificationsOutlinedIcon />
						</Badge>
					</IconButton>

					{/* User / Login */}
					{user?._id ? (
						<>
							<Box component="div" className="user-pill" onClick={(e: any) => setAnchorUser(e.currentTarget)}>
								<Avatar
									className="user-avatar"
									src={user?.memberImage ? (user.memberImage.startsWith('http') ? user.memberImage : `${REACT_APP_API_URL}/${user.memberImage}`) : '/img/profile/defaultUser.svg'}
								/>
								<Typography className="user-nick">{user?.memberNick}</Typography>
								<CaretDown size={11} weight="fill" color="#aaa" />
							</Box>

							<Menu
								anchorEl={anchorUser}
								open={Boolean(anchorUser)}
								onClose={() => setAnchorUser(null)}
								PaperProps={{ sx: { mt: 1, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 200 } }}
							>
								<Box component="div" sx={{ px: 2, py: 1.5, background: 'linear-gradient(135deg,#FFF0F5,#fff)' }}>
									<Typography variant="subtitle2" fontWeight={700}>{user?.memberNick}</Typography>
									<Typography variant="caption" color="text.secondary">{user?.memberPhone}</Typography>
								</Box>
								<Divider />
								<MenuItem onClick={() => { router.push('/mypage'); setAnchorUser(null); }}>
									👤 {t('My Page')}
								</MenuItem>
								<Divider />
								<MenuItem
									onClick={() => { logOut(); setAnchorUser(null); }}
									sx={{ color: '#e53935' }}
								>
									<Logout fontSize="small" /> {t('Logout')}
								</MenuItem>
							</Menu>
						</>
					) : (
						<Link href="/account/join">
							<Box component="div" className="login-btn">{t('Login')}</Box>
						</Link>
					)}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withRouter(Top);