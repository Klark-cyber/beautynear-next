import React, { useState } from 'react';
import { Stack, Box, Typography, IconButton, Divider, TextField, Button } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../hooks/useDeviceDetect';
import Link from 'next/link';
import moment from 'moment';

const Footer = () => {
	const device = useDeviceDetect();
	const { t } = useTranslation('common');
	const [email, setEmail] = useState('');

	const socialLinks = [
		{ icon: <InstagramIcon />, href: 'https://instagram.com', label: 'Instagram' },
		{ icon: <TwitterIcon />, href: 'https://twitter.com', label: 'Twitter' },
		{ icon: <YouTubeIcon />, href: 'https://youtube.com', label: 'YouTube' },
	];

	const footerLinks = {
		company: [
			{ label: 'About Us', href: '/about' },
			{ label: 'Careers', href: '/careers' },
			{ label: 'Blog', href: '/blog' },
			{ label: 'Press', href: '/press' },
		],
		forCustomers: [
			{ label: 'How It Works', href: '/how-it-works' },
			{ label: 'Gallery', href: '/gallery' },
			{ label: 'Help Center', href: '/cs' },
			{ label: 'Terms & Conditions', href: '/terms' },
		],
		forPartners: [
			{ label: 'Partner with Us', href: '/partner' },
			{ label: 'Business Login', href: '/account/join' },
			{ label: 'Resources', href: '/resources' },
		],
	};

	const LinkItem = ({ label, href }: { label: string; href: string }) => (
		<Link href={href}>
			<Typography
				component="span"
				sx={{
					display: 'block',
					fontSize: 13,
					color: 'rgba(255,255,255,0.65)',
					cursor: 'pointer',
					mb: 0.75,
					transition: 'all 0.2s',
					'&:hover': {
						color: '#FF85B3',
						transform: 'translateX(4px)',
					},
				}}
			>
				{t(label)}
			</Typography>
		</Link>
	);

	// ── MOBILE ──────────────────────────────────────────────────────────────────
	if (device === 'mobile') {
		return (
			<Stack
				sx={{
					background: 'linear-gradient(160deg, #1a0a12 0%, #2d1020 100%)',
					pt: 4,
					pb: 2,
					px: 3,
				}}
			>
				{/* Logo & desc */}
				<Box component="div" sx={{ mb: 3 }}>
					<img src="/img/logo/logoWhite.svg" alt="BeautyNear" height={32} />
					<Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, mt: 1, lineHeight: 1.6 }}>
						{t('Your beauty journey starts here.')}
					</Typography>
				</Box>

				{/* Social */}
				<Stack direction="row" gap={1} sx={{ mb: 3 }}>
					{socialLinks.map((s) => (
						<IconButton
							key={s.label}
							component="a"
							href={s.href}
							target="_blank"
							sx={{
								color: 'rgba(255,255,255,0.6)',
								border: '1px solid rgba(255,255,255,0.15)',
								borderRadius: 2,
								width: 36,
								height: 36,
								transition: 'all 0.25s',
								'&:hover': {
									color: '#FF4D8D',
									borderColor: '#FF4D8D',
									background: 'rgba(255,77,141,0.1)',
									transform: 'translateY(-3px)',
								},
							}}
						>
							{s.icon}
						</IconButton>
					))}
				</Stack>

				<Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

				<Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center' }}>
					© {moment().year()} BeautyNear. {t('All rights reserved.')}
				</Typography>
			</Stack>
		);
	}

	// ── DESKTOP ─────────────────────────────────────────────────────────────────
	return (
		<Stack
			sx={{
				background: 'linear-gradient(160deg, #1a0a12 0%, #2d1020 100%)',
				pt: 6,
				pb: 3,
			}}
		>
			<Stack
				sx={{
					maxWidth: 1280,
					mx: 'auto',
					width: '100%',
					px: 4,
				}}
			>
				{/* Top row */}
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={4} sx={{ mb: 5 }}>
					{/* Brand */}
					<Box component="div" sx={{ maxWidth: 260 }}>
						<Box
							component="div"
							sx={{
								mb: 2,
								transition: 'filter 0.25s',
								'&:hover': { filter: 'drop-shadow(0 0 8px rgba(255,133,179,0.5))' },
							}}
						>
							<img src="/img/logo/logoWhite.svg" alt="BeautyNear" height={36} />
						</Box>
						<Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.7, mb: 2.5 }}>
							{t('Your beauty journey starts here. Premium K-Beauty salons & clinics.')}
						</Typography>

						{/* Social icons */}
						<Stack direction="row" gap={1}>
							{socialLinks.map((s) => (
								<IconButton
									key={s.label}
									component="a"
									href={s.href}
									target="_blank"
									aria-label={s.label}
									sx={{
										color: 'rgba(255,255,255,0.6)',
										border: '1px solid rgba(255,255,255,0.15)',
										borderRadius: 2,
										width: 38,
										height: 38,
										transition: 'all 0.25s',
										'&:hover': {
											color: '#FF4D8D',
											borderColor: '#FF4D8D',
											background: 'rgba(255,77,141,0.1)',
											transform: 'translateY(-4px)',
											boxShadow: '0 8px 16px rgba(255,77,141,0.2)',
										},
									}}
								>
									{s.icon}
								</IconButton>
							))}
						</Stack>
					</Box>

					{/* Links */}
					<Stack direction="row" gap={6}>
						<Box component="div">
							<Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, mb: 2, letterSpacing: 0.5 }}>
								{t('Company')}
							</Typography>
							{footerLinks.company.map((l) => <LinkItem key={l.label} {...l} />)}
						</Box>
						<Box component="div">
							<Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, mb: 2, letterSpacing: 0.5 }}>
								{t('For Customers')}
							</Typography>
							{footerLinks.forCustomers.map((l) => <LinkItem key={l.label} {...l} />)}
						</Box>
						<Box component="div">
							<Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, mb: 2, letterSpacing: 0.5 }}>
								{t('For Partners')}
							</Typography>
							{footerLinks.forPartners.map((l) => <LinkItem key={l.label} {...l} />)}
						</Box>
					</Stack>

					{/* Newsletter */}
					<Box component="div" sx={{ maxWidth: 260 }}>
						<Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 13, mb: 1, letterSpacing: 0.5 }}>
							{t('Stay Updated')}
						</Typography>
						<Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, mb: 2 }}>
							{t('Subscribe to beauty tips & offers')}
						</Typography>
						<Stack direction="row" gap={1}>
							<TextField
								size="small"
								placeholder={t('Enter your email')}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								sx={{
									flex: 1,
									'& .MuiOutlinedInput-root': {
										borderRadius: 2,
										background: 'rgba(255,255,255,0.08)',
										color: '#fff',
										fontSize: 12,
										'& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
										'&:hover fieldset': { borderColor: 'rgba(255,133,179,0.5)' },
										'&.Mui-focused fieldset': { borderColor: '#FF4D8D' },
									},
									'& input::placeholder': { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
								}}
							/>
							<Button
								variant="contained"
								sx={{
									borderRadius: 2,
									background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
									fontSize: 12,
									px: 2,
									minWidth: 'auto',
									boxShadow: '0 4px 12px rgba(255,77,141,0.35)',
									transition: 'all 0.25s',
									'&:hover': {
										transform: 'translateY(-2px)',
										boxShadow: '0 8px 20px rgba(255,77,141,0.45)',
									},
								}}
							>
								→
							</Button>
						</Stack>

						{/* Lang flags */}
						<Stack direction="row" gap={1} sx={{ mt: 3 }}>
							{[
								{ code: 'kr', flag: 'langkr.png' },
								{ code: 'en', flag: 'langen.png' },
								{ code: 'ru', flag: 'langru.png' },
							].map((l) => (
								<Box
									key={l.code}
									component="div"
									sx={{
										cursor: 'pointer',
										opacity: 0.6,
										transition: 'all 0.2s',
										'&:hover': { opacity: 1, transform: 'scale(1.15)' },
									}}
								>
									<img src={`/img/flag/${l.flag}`} alt={l.code} width={24} height={16} style={{ borderRadius: 3 }} />
								</Box>
							))}
						</Stack>
					</Box>
				</Stack>

				<Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2.5 }} />

				{/* Bottom */}
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
						© {moment().year()} BeautyNear. {t('All rights reserved.')}
					</Typography>
					<Stack direction="row" gap={3}>
						{['Privacy', 'Terms', 'Sitemap'].map((item) => (
							<Link key={item} href={`/${item.toLowerCase()}`}>
								<Typography
									component="span"
									sx={{
										color: 'rgba(255,255,255,0.35)',
										fontSize: 12,
										cursor: 'pointer',
										transition: 'color 0.2s',
										'&:hover': { color: '#FF85B3' },
									}}
								>
									{t(item)}
								</Typography>
							</Link>
						))}
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Footer;