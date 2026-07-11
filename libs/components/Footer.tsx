import React, { useState } from 'react';
import { Stack, Box, Typography, InputBase, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InstagramIcon from '@mui/icons-material/Instagram';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AppleIcon from '@mui/icons-material/Apple';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../hooks/useDeviceDetect';
import Link from 'next/link';

// Google Play uchburchak ikonkasi
const GooglePlayIcon = () => (
	<svg width="26" height="26" viewBox="0 0 24 24">
		<path d="M3.6 1.8L13.7 12 3.6 22.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z" fill="#00D7FE" />
		<path d="M17.2 8.5L13.7 12 3.6 1.8c.2-.1.5-.1.8.1l12.8 6.6z" fill="#00F076" />
		<path d="M17.2 15.5L4.4 22.1c-.3.2-.6.2-.8.1L13.7 12l3.5 3.5z" fill="#F63448" />
		<path d="M21.4 10.9c.8.4.8 1.8 0 2.2l-4.2 2.4-3.5-3.5 3.5-3.5 4.2 2.4z" fill="#FFC900" />
	</svg>
);

const PETALS = [
	{ top: '8%', left: '-6%', size: 34, blur: 3, opacity: 0.55, delay: 0 },
	{ top: '55%', left: '-10%', size: 22, blur: 4, opacity: 0.5, delay: 1.4 },
	{ top: '12%', right: '-8%', size: 42, blur: 4, opacity: 0.6, delay: 0.7 },
	{ top: '70%', right: '-5%', size: 26, blur: 3, opacity: 0.5, delay: 2 },
];

const FEATURES = [
	{ icon: <CalendarMonthOutlinedIcon />, title: 'Easy Booking', desc: 'In just a few taps' },
	{ icon: <RateReviewOutlinedIcon />, title: 'Real Reviews', desc: 'From verified customers' },
	{ icon: <GppGoodOutlinedIcon />, title: 'Secure Payment', desc: 'Safe & trusted' },
];

const Footer = () => {
	const device = useDeviceDetect();
	const { t } = useTranslation('common');
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [lang, setLang] = useState<string>('en');

	// Hydration-safe: localStorage faqat mount dan keyin (clientda) o'qiladi
	React.useEffect(() => {
		const stored = localStorage.getItem('locale');
		if (stored) setLang(stored);
	}, []);

	/** HANDLERS **/
	const langChoice = async (locale: string) => {
		setLang(locale);
		localStorage.setItem('locale', locale);
		await router.push(router.asPath, router.asPath, { locale });
	};

	const subscribeHandler = () => {
		if (!email) return;
		setEmail('');
		// TODO: subscribe mutation
	};

	const companyLinks = [
		{ label: 'About Us', href: '/about' },
		{ label: 'Careers', href: '/cs' },
		{ label: 'Press', href: '/cs' },
		{ label: 'Blog', href: '/community' },
	];
	const customerLinks = [
		{ label: 'How It Works', href: '/about' },
		{ label: 'Safety', href: '/cs' },
		{ label: 'Help Center', href: '/cs' },
		{ label: 'Terms & Conditions', href: '/cs' },
	];
	const partnerLinks = [
		{ label: 'Partner with Us', href: '/cs' },
		{ label: 'Business Login', href: '/account/join' },
		{ label: 'Resources', href: '/cs' },
	];

	/** MOBILE **/
	if (device === 'mobile') {
		return (
			<Stack className="footer-container mobile">
				<Stack className="footer-brand">
					<img src="/img/logo/logo.png" alt="BeautyNear" className="footer-logo" />
					<Typography className="footer-tagline">{t('Your beauty journey starts here.')}</Typography>
					<Stack direction="row" className="footer-socials">
						<Box component="div" className="social-btn"><InstagramIcon /></Box>
						<Box component="div" className="social-btn"><ChatBubbleIcon /></Box>
						<Box component="div" className="social-btn"><MusicNoteIcon /></Box>
					</Stack>
				</Stack>
				<Typography className="footer-copy">© 2025 BeautyNear. All rights reserved.</Typography>
			</Stack>
		);
	}

	/** PC **/
	return (
		<Stack className="footer-wrap">

			{/* ═══ SECTION 1 — APP DOWNLOAD BANNER ═══ */}
			<Stack className="app-banner" direction="row">
				{PETALS.map((p, i) => (
					<Box key={i} component="div" className="ab-petal" sx={{
						top: p.top,
						...(p.left ? { left: p.left } : {}),
						...(p.right ? { right: p.right } : {}),
						width: p.size, height: p.size,
						opacity: p.opacity,
						filter: `blur(${p.blur}px)`,
						animationDelay: `${p.delay}s`,
					}} />
				))}

				{/* LEFT — heading + store buttons */}
				<Stack className="ab-left">
					<Typography className="ab-title">{'Beauty in your pocket'}</Typography>
					<Typography className="ab-desc">
						{'Download the app and book your beauty'}
						<br />
						{'anytime, anywhere.'}
					</Typography>
					<Stack direction="row" className="store-btns">
						<Box component="div" className="store-btn">
							<AppleIcon className="store-icon" />
							<Stack>
								<Typography className="store-sub">Download on the</Typography>
								<Typography className="store-name">App Store</Typography>
							</Stack>
						</Box>
						<Box component="div" className="store-btn">
							<Box component="div" className="store-icon-svg"><GooglePlayIcon /></Box>
							<Stack>
								<Typography className="store-sub">GET IT ON</Typography>
								<Typography className="store-name">Google Play</Typography>
							</Stack>
						</Box>
					</Stack>
				</Stack>

				{/* CENTER — floating phones */}
				<Stack className="ab-phones" direction="row">
					{/* Phone 1 — Home */}
					<Box component="div" className="phone phone-left">
						<Box component="div" className="phone-notch" />
						<Stack className="phone-screen">
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography className="ph-hello">Hello, Jessica 👋</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" gap={0.5} className="ph-search">
								<SearchIcon sx={{ fontSize: 10, color: '#FF4D8D' }} />
								<Typography className="ph-search-text">Search services, salons...</Typography>
							</Stack>
							<Stack direction="row" justifyContent="space-between" className="ph-cats">
								{['💅', '🧖‍♀️', '✂️', '🪷', '💉'].map((e, i) => (
									<Stack key={i} alignItems="center" gap={0.25}>
										<Box component="div" className="ph-cat-icon">{e}</Box>
									</Stack>
								))}
							</Stack>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography className="ph-section">Nearby Salons</Typography>
								<Typography className="ph-viewall">View all</Typography>
							</Stack>
							<Stack direction="row" gap={0.75}>
								<Box component="div" className="ph-card g1" />
								<Box component="div" className="ph-card g2" />
							</Stack>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography className="ph-section">Popular Services</Typography>
								<Typography className="ph-viewall">View all</Typography>
							</Stack>
							<Stack direction="row" gap={0.75}>
								<Box component="div" className="ph-card g3" />
								<Box component="div" className="ph-card g4" />
							</Stack>
						</Stack>
					</Box>

					{/* Phone 2 — Bookings */}
					<Box component="div" className="phone phone-right">
						<Box component="div" className="phone-notch" />
						<Stack className="phone-screen">
							<Typography className="ph-hello">Bookings</Typography>
							<Stack direction="row" gap={1} className="ph-tabs">
								<Typography className="ph-tab active">Upcoming</Typography>
								<Typography className="ph-tab">Completed</Typography>
								<Typography className="ph-tab">Cancelled</Typography>
							</Stack>
							<Stack direction="row" gap={0.75} alignItems="center" className="ph-booking">
								<Box component="div" className="ph-bk-avatar" />
								<Stack flex={1}>
									<Typography className="ph-bk-name">Glow Skin Clinic</Typography>
									<Typography className="ph-bk-date">May 24, 2025 · 2:00 PM</Typography>
								</Stack>
								<Box component="div" className="ph-bk-btn">View</Box>
							</Stack>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography className="ph-section">Recommended for you</Typography>
							</Stack>
							<Stack direction="row" gap={0.75}>
								<Box component="div" className="ph-card g2" />
								<Box component="div" className="ph-card g1" />
							</Stack>
							<Box component="div" className="ph-offer">
								<Typography className="ph-offer-pct">20% OFF</Typography>
								<Typography className="ph-offer-lbl">For New Customers</Typography>
							</Box>
						</Stack>
					</Box>
				</Stack>

				{/* RIGHT — feature cards */}
				<Stack className="ab-features">
					{FEATURES.map((f) => (
						<Stack key={f.title} direction="row" alignItems="center" className="feature-card">
							<Box component="div" className="feat-icon">{f.icon}</Box>
							<Stack>
								<Typography className="feat-title">{t(f.title)}</Typography>
								<Typography className="feat-desc">{t(f.desc)}</Typography>
							</Stack>
						</Stack>
					))}
				</Stack>
			</Stack>

			{/* ═══ SECTION 2 — MAIN FOOTER ═══ */}
			<Stack className="footer-container">
				<Stack className="footer-top" direction="row">
					{/* Brand */}
					<Stack className="footer-brand">
						<img src="/img/logo/logo.png" alt="BeautyNear" className="footer-logo" />
						<Typography className="footer-tagline">
							{t('Your beauty journey starts here.')}
							<br />
							{t('Premium K-Beauty salons & clinics')}
							<br />
							{t('near you.')}
						</Typography>
						<Stack direction="row" className="footer-socials">
							<Box component="div" className="social-btn"><InstagramIcon /></Box>
							<Box component="div" className="social-btn kakao"><ChatBubbleIcon /><span className="kakao-txt">TALK</span></Box>
							<Box component="div" className="social-btn"><MusicNoteIcon /></Box>
						</Stack>
					</Stack>

					{/* Company */}
					<Stack className="footer-col">
						<Typography className="footer-col-title">{t('Company')}</Typography>
						{companyLinks.map((link) => (
							<Link key={link.label} href={link.href}>
								<Typography className="footer-link">{t(link.label)}</Typography>
							</Link>
						))}
					</Stack>

					{/* For Customers */}
					<Stack className="footer-col">
						<Typography className="footer-col-title">{t('For Customers')}</Typography>
						{customerLinks.map((link) => (
							<Link key={link.label} href={link.href}>
								<Typography className="footer-link">{t(link.label)}</Typography>
							</Link>
						))}
					</Stack>

					{/* For Partners */}
					<Stack className="footer-col">
						<Typography className="footer-col-title">{t('For Partners')}</Typography>
						{partnerLinks.map((link) => (
							<Link key={link.label} href={link.href}>
								<Typography className="footer-link">{t(link.label)}</Typography>
							</Link>
						))}
					</Stack>

					{/* Lang + Newsletter */}
					<Stack className="footer-right">
						<Stack direction="row" className="footer-lang-row">
							{[
								{ id: 'kr', label: 'KR' },
								{ id: 'en', label: 'EN' },
								{ id: 'ru', label: 'RU' },
							].map((item) => (
								<Box
									key={item.id}
									component="div"
									className={`footer-lang-btn ${lang === item.id ? 'active' : ''}`}
									onClick={() => langChoice(item.id)}
								>
									{item.label}
								</Box>
							))}
						</Stack>
						<Typography className="footer-newsletter-text">
							{t('Subscribe to our newsletter')}
							<br />
							{t('for beauty tips & offers')}
						</Typography>
						<Stack direction="row" className="footer-subscribe">
							<InputBase
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={t('Enter your email')}
								className="subscribe-input"
							/>
							<IconButton className="subscribe-btn" onClick={subscribeHandler}>
								<SendIcon />
							</IconButton>
						</Stack>
					</Stack>
				</Stack>

				<Typography className="footer-copy">© 2025 BeautyNear. All rights reserved.</Typography>
			</Stack>
		</Stack>
	);
};

export default Footer;