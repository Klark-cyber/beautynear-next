import React, { useEffect } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Head from 'next/head';
import Top from '../Top';
import Footer from '../Footer';
import { Stack, Box, Typography } from '@mui/material';
import HeaderFilter from '../homepage/Headerfilter';
import HeaderLocationFinder from '../homepage/Herolocationfinder';
import StarIcon from '@mui/icons-material/Star';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { userVar } from '../../../apollo/store';
import { useReactiveVar } from '@apollo/client';
import { getJwtToken, updateUserInfo } from '../../auth';
import Chat from '../Chat';
import { useTranslation } from 'next-i18next';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const PETALS = [
	{ top: '10%', left: '12%', size: 16, opacity: 0.6, delay: 0 },
	{ top: '25%', left: '38%', size: 11, opacity: 0.45, delay: 1.2 },
	{ top: '60%', left: '28%', size: 20, opacity: 0.35, delay: 0.7 },
	{ top: '8%', left: '58%', size: 13, opacity: 0.5, delay: 2 },
	{ top: '40%', left: '68%', size: 18, opacity: 0.3, delay: 0.4 },
	{ top: '70%', left: '52%', size: 10, opacity: 0.45, delay: 1.8 },
	{ top: '18%', left: '78%', size: 14, opacity: 0.4, delay: 0.9 },
];

const AVATARS = [
	'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
	'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
	'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
	'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&q=80',
];

const withLayoutMain = (Component: any) => {
	return (props: any) => {
		const device = useDeviceDetect();
		const user = useReactiveVar(userVar);
		const { t } = useTranslation('common');

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		/** MOBILE **/
		if (device === 'mobile') {
			return (
				<>
					<Head>
						<title>BeautyNear</title>
						<meta name="title" content="BeautyNear" />
					</Head>
					<Stack id="mobile-wrap">
						<Stack id="top">
							<Top />
						</Stack>

						<Stack className="header-main">
							<Box component="div" className="hero-bg-mobile" />
							<Box component="div" className="hero-overlay-mobile" />
							<Stack className="hero-mobile-content">
								<Typography className="hero-h1-mobile">
									{'Find Your'}<br />
									<span className="pink">{'Perfect Beauty'}</span><br />
									{'Near You'}
								</Typography>
								<Typography className="hero-sub-mobile">
									{t('Discover premium Korean salons & clinics near your location.')}
								</Typography>
								<HeaderFilter />
							</Stack>
						</Stack>

						<Stack id="main">
							<Component {...props} />
						</Stack>

						<Stack id="footer">
							<Footer />
						</Stack>
					</Stack>
				</>
			);
		}

		/** PC **/
		return (
			<>
				<Head>
					<title>BeautyNear</title>
					<meta name="title" content="BeautyNear" />
				</Head>
				<Stack id="pc-wrap">
					<Stack id="top">
						<Top />
					</Stack>

					{/* HERO — layout darajasida, Nestar header-main pattern */}
					<Stack className="header-main">
						{/* Background image */}
						<Box component="div" className="hero-bg" />
						{/* Left white gradient overlay */}
						<Box component="div" className="hero-left-overlay" />
						{/* Right soft fade */}
						<Box component="div" className="hero-right-overlay" />


						{/* Petals */}
						{PETALS.map((p, i) => (
							<Box
								key={i}
								component="div"
								className="petal"
								sx={{
									top: p.top,
									left: p.left,
									width: p.size,
									height: p.size,
									opacity: p.opacity,
									animationDelay: `${p.delay}s`,
								}}
							/>
						))}

						{/* Bottom wave */}
						<Box component="div" className="hero-wave">
							<svg viewBox="0 0 1440 72" preserveAspectRatio="none">
								<path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="#ffffff" />
							</svg>
						</Box>

						<Stack className="container">
							<Stack className="hero-content">
								{/* Heading */}
								<Typography className="hero-h1">
									{'Find Your'}
									<br />
									{'Perfect Beauty Spot \u2014'}
									<br />
									<span className="pink">{'Right Around You'}</span>
								</Typography>

								<Typography className="hero-sub">
									{'Discover premium Korean salons, skincare clinics,'}
									<br />
									{'and aesthetic studios near your location.'}
								</Typography>

								{/* Search panel — alohida component */}
								<HeaderFilter />

								{/* Stats row */}
								<Stack direction="row" alignItems="center" className="hero-stats">
									<Stack direction="row" alignItems="center" gap={1.5} className="stat-block">
										<Stack direction="row" className="avatar-row">
											{AVATARS.map((src, i) => (
												<Box key={i} component="div" className={`stat-av av${i}`}>
													<img src={src} alt={`customer-${i}`} />
												</Box>
											))}
										</Stack>
										<Stack>
											<Typography className="stat-num">10K+</Typography>
											<Typography className="stat-lbl">{t('Happy Customers')}</Typography>
										</Stack>
									</Stack>

									<Box component="div" className="stat-sep" />

									<Stack direction="row" alignItems="center" gap={1.5} className="stat-block">
										<StarIcon className="star-icon" />
										<Stack>
											<Typography className="stat-num">4.9</Typography>
											<Typography className="stat-lbl">{t('Average Rating')}</Typography>
										</Stack>
									</Stack>

									<Box component="div" className="stat-sep" />

									<Stack direction="row" alignItems="center" gap={1.25} className="stat-block">
										<VerifiedOutlinedIcon className="verified-icon" />
										<Stack>
											<Typography className="stat-lbl-dark">{t('Verified Salons')}</Typography>
											<Typography className="stat-lbl-dark">{t('& Clinics')}</Typography>
										</Stack>
									</Stack>
								</Stack>

								{/* Geo permission — alohida component */}
								<HeaderLocationFinder />
							</Stack>

							{/* FLOATING CARD 1 — Booking Confirmed */}
							<Stack className="float-card booking-card">
								<Stack direction="row" alignItems="center" gap={0.75} className="fc-head">
									<CheckCircleOutlinedIcon className="fc-check" />
									<Typography className="fc-title">{t('Booking Confirmed')}</Typography>
								</Stack>
								<Stack direction="row" gap={1.5} alignItems="center" className="fc-body">
									<Box component="div" className="booking-thumb">
										<img src="/img/banner/hero.jpg" alt="clinic" />
									</Box>
									<Stack>
										<Typography className="fc-name">Glow Skin Clinic</Typography>
										<Typography className="fc-date">May 24, 2025 · 2:00 PM</Typography>
									</Stack>
								</Stack>
								<Box component="div" className="fc-footer">
									<Typography className="fc-link">{t('View Details')}</Typography>
								</Box>
							</Stack>

							{/* FLOATING CARD 2 — Special Offer */}
							<Stack className="float-card offer-card">
								<CardGiftcardOutlinedIcon className="offer-gift" />
								<Typography className="fc-title">{t('Special Offer')}</Typography>
								<Typography className="offer-pct">20% OFF</Typography>
								<Typography className="offer-lbl">{t('For New Customers')}</Typography>
								<Stack direction="row" alignItems="center" gap={0.5} className="offer-claim">
									<Typography className="claim-text">{t('Claim Now')}</Typography>
									<ArrowForwardIcon className="claim-arrow" />
								</Stack>
							</Stack>
						</Stack>
					</Stack>

					<Stack id="main">
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

export default withLayoutMain;