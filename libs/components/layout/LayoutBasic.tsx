import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack, Box, Typography } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import Chat from '../Chat';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useTranslation } from 'next-i18next';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Pages with banner header (salons, services, mypage, community...)
const withLayoutBasic = (Component: any) => {
	return (props: any) => {
		const router = useRouter();
		const { t } = useTranslation('common');
		const device = useDeviceDetect();
		const user = useReactiveVar(userVar);

		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		const pageConfig = useMemo(() => {
			const configs: Record<string, { title: string; desc: string; bgImage: string }> = {
				'/salons': {
					title: 'Find Your Perfect Salon',
					desc: 'Discover premium K-Beauty salons near you',
					bgImage: '/img/banner/salons.jpg',
				},
				'/services': {
					title: 'Explore Services',
					desc: 'Browse trending beauty treatments',
					bgImage: '/img/banner/services.jpg',
				},
				'/specialists': {
					title: 'Meet Our Specialists',
					desc: 'Expert beauty professionals near you',
					bgImage: '/img/banner/specialists.jpg',
				},
				'/mypage': {
					title: 'My Page',
					desc: 'Manage your bookings & profile',
					bgImage: '/img/banner/mypage.jpg',
				},
				'/community': {
					title: 'Community',
					desc: 'Share your beauty journey',
					bgImage: '/img/banner/community.jpg',
				},
				'/community/detail': {
					title: 'Community',
					desc: 'Share your beauty journey',
					bgImage: '/img/banner/community.jpg',
				},
				'/cs': {
					title: 'Help Center',
					desc: 'We are here to help you',
					bgImage: '/img/banner/cs.jpg',
				},
				'/account/join': {
					title: 'Welcome Back',
					desc: 'Login or create your account',
					bgImage: '/img/banner/auth.jpg',
				},
				'/member': {
					title: 'Specialist Profile',
					desc: 'Explore their work & services',
					bgImage: '/img/banner/specialists.jpg',
				},
			};
			return configs[router.pathname] ?? { title: 'BeautyNear', desc: '', bgImage: '/img/banner/default.jpg' };
		}, [router.pathname]);

		if (device === 'mobile') {
			return (
				<>
					<Head>
						<title>BeautyNear — {t(pageConfig.title)}</title>
						<meta name="viewport" content="width=device-width, initial-scale=1" />
					</Head>
					<Stack id="mobile-wrap" sx={{ minHeight: '100vh', background: '#FAFAFA' }}>
						<Stack id="top">
							<Top />
						</Stack>

						{/* Mobile mini banner */}
						<Box
							component="div"
							sx={{
								px: 2,
								py: 2.5,
								background: 'linear-gradient(135deg, #FFF0F5 0%, #FFE4EF 100%)',
								borderBottom: '1px solid rgba(255,77,141,0.1)',
							}}
						>
							<Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', mb: 0.25 }}>
								{t(pageConfig.title)}
							</Typography>
							{pageConfig.desc && (
								<Typography sx={{ fontSize: 12, color: '#888' }}>{t(pageConfig.desc)}</Typography>
							)}
						</Box>

						<Stack id="main" sx={{ flex: 1 }}>
							<Component {...props} />
						</Stack>
						<Stack id="footer">
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		}

		return (
			<>
				<Head>
					<title>BeautyNear — {t(pageConfig.title)}</title>
				</Head>
				<Stack id="pc-wrap" sx={{ minHeight: '100vh', background: '#FAFAFA' }}>
					<Stack id="top">
						<Top />
					</Stack>

					{/* Page banner header */}
					<Box
						component="div"
						className="header-basic"
						sx={{
							position: 'relative',
							height: 220,
							backgroundImage: `url(${pageConfig.bgImage})`,
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							overflow: 'hidden',
							'&::before': {
								content: '""',
								position: 'absolute',
								inset: 0,
								background: 'linear-gradient(135deg, rgba(26,10,18,0.85) 0%, rgba(255,77,141,0.3) 100%)',
							},
						}}
					>
						<Stack
							sx={{
								position: 'relative',
								zIndex: 1,
								height: '100%',
								maxWidth: 1280,
								mx: 'auto',
								px: 4,
								justifyContent: 'center',
							}}
						>
							<Typography
								sx={{
									fontSize: 36,
									fontWeight: 800,
									color: '#fff',
									mb: 0.75,
									letterSpacing: -0.5,
									textShadow: '0 2px 12px rgba(0,0,0,0.3)',
								}}
							>
								{t(pageConfig.title)}
							</Typography>
							{pageConfig.desc && (
								<Typography
									sx={{
										fontSize: 15,
										color: 'rgba(255,255,255,0.75)',
										fontWeight: 400,
									}}
								>
									{t(pageConfig.desc)}
								</Typography>
							)}

							{/* Decorative dots */}
							<Box
								component="div"
								sx={{
									position: 'absolute',
									right: 80,
									top: '50%',
									transform: 'translateY(-50%)',
									display: 'flex',
									gap: 1,
									opacity: 0.3,
								}}
							>
								{[40, 60, 80, 50, 30].map((size, i) => (
									<Box
										key={i}
										component="div"
										sx={{
											width: size,
											height: size,
											borderRadius: '50%',
											border: '2px solid #FF85B3',
										}}
									/>
								))}
							</Box>
						</Stack>
					</Box>

					<Stack id="main" sx={{ flex: 1 }}>
						<Component {...props} />
					</Stack>

					{user?._id && <Chat />}

					<Stack id="footer">
						<Footer />
					</Stack>
				</Stack>
			</>
		);
	};
};

export default withLayoutBasic;