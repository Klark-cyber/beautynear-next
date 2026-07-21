import React, { useEffect } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack, Box, Typography } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PeopleIcon from '@mui/icons-material/People';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PersonIcon from '@mui/icons-material/Person';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// ── Mobile bottom nav (shared) ────────────────────────────────────────────────
const MobileBottomNav = () => {
	const router = useRouter();
	const { t } = useTranslation('common');

	const tabs = [
		{
			label: 'Home',
			href: '/',
			activeIcon: <HomeIcon sx={{ fontSize: 22 }} />,
			inactiveIcon: <HomeOutlinedIcon sx={{ fontSize: 22 }} />,
		},
		{
			label: 'Search',
			href: '/salons',
			activeIcon: <SearchIcon sx={{ fontSize: 22 }} />,
			inactiveIcon: <SearchIcon sx={{ fontSize: 22 }} />,
		},
		{
			label: 'Bookings',
			href: '/mypage?category=myBookings',
			activeIcon: <CalendarMonthIcon sx={{ fontSize: 22 }} />,
			inactiveIcon: <CalendarMonthOutlinedIcon sx={{ fontSize: 22 }} />,
		},
		{
			label: 'Community',
			href: '/community?articleCategory=FREE',
			activeIcon: <PeopleIcon sx={{ fontSize: 22 }} />,
			inactiveIcon: <PeopleOutlineIcon sx={{ fontSize: 22 }} />,
		},
		{
			label: 'Profile',
			href: '/mypage',
			activeIcon: <PersonIcon sx={{ fontSize: 22 }} />,
			inactiveIcon: <PersonOutlineIcon sx={{ fontSize: 22 }} />,
		},
	];

	return (
		<Stack
			direction="row"
			justifyContent="space-around"
			alignItems="center"
			sx={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				height: 64,
				background: 'rgba(255,255,255,0.97)',
				backdropFilter: 'blur(12px)',
				borderTop: '1px solid rgba(255,77,141,0.1)',
				boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
				zIndex: 200,
				pb: 'env(safe-area-inset-bottom)',
			}}
		>
			{tabs.map((tab) => {
				const isActive =
					router.pathname === tab.href ||
					router.asPath === tab.href ||
					(tab.href !== '/' && router.pathname.startsWith(tab.href.split('?')[0]));

				return (
					<Box
						key={tab.label}
						component="div"
						onClick={() => router.push(tab.href)}
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 0.25,
							px: 1.5,
							py: 0.5,
							cursor: 'pointer',
							color: isActive ? '#FF4D8D' : '#999',
							transition: 'all 0.2s',
							'&:active': { transform: 'scale(0.9)' },
							...(isActive && {
								'& svg': { animation: 'tabBounce 0.3s ease' },
							}),
							'@keyframes tabBounce': {
								'0%': { transform: 'scale(1)' },
								'50%': { transform: 'scale(1.3)' },
								'100%': { transform: 'scale(1)' },
							},
						}}
					>
						{isActive ? tab.activeIcon : tab.inactiveIcon}
						<Typography
							sx={{
								fontSize: 10,
								fontWeight: isActive ? 700 : 400,
								color: 'inherit',
								transition: 'all 0.2s',
							}}
						>
							{t(tab.label)}
						</Typography>
						{isActive && (
							<Box
								component="div"
								sx={{
									position: 'absolute',
									bottom: 0,
									width: 4,
									height: 4,
									borderRadius: '50%',
									background: '#FF4D8D',
								}}
							/>
						)}
					</Box>
				);
			})}
		</Stack>
	);
};

// ── Layout ────────────────────────────────────────────────────────────────────
const withLayoutFull = (Component: any) => {
	return (props: any) => {
		const device = useDeviceDetect();
		const { t } = useTranslation('common');

		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		if (device === 'mobile') {
			return (
				<>
					<Head>
						<title>BeautyNear</title>
						<meta name="title" content="BeautyNear — K-Beauty Near You" />
					</Head>
					<Stack
						id="mobile-wrap"
						sx={{
							minHeight: '100vh',
							background: '#FAFAFA',
							pb: '64px', // bottom nav height
						}}
					>
						<Stack id="top">
							<Top />
						</Stack>
						<Stack id="main" sx={{ flex: 1 }}>
							<Component {...props} />
						</Stack>
						<Stack id="footer">
							<Footer />
						</Stack>
						<MobileBottomNav />
						{/* ⚠️ TUZATILDI: <Chat/> endi _app.tsx darajasida BIR MARTA render qilinadi */}
					</Stack>
				</>
			);
		}

		return (
			<>
				<Head>
					<title>BeautyNear</title>
					<meta name="title" content="BeautyNear — K-Beauty Near You" />
				</Head>
				<Stack
					id="pc-wrap"
					sx={{
						minHeight: '100vh',
						background: '#FAFAFA',
					}}
				>
					<Stack id="top">
						<Top />
					</Stack>
					<Stack id="main" sx={{ flex: 1 }}>
						<Component {...props} />
					</Stack>
					<Stack id="footer">
						<Footer />
					</Stack>
				</Stack>
			</>
		);
	};
};

export default withLayoutFull;