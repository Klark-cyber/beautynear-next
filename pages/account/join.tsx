import React, { useCallback, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography, Divider, IconButton, InputAdornment } from '@mui/material';
import { useRouter } from 'next/router';
import { logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Join: NextPage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const device = useDeviceDetect();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: 'USER' });
	const [loginView, setLoginView] = useState<boolean>(true);
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [loading, setLoading] = useState(false);

	/** HANDLERS **/
	const handleInput = useCallback((name: string, value: string) => {
		setInput((prev) => ({ ...prev, [name]: value }));
	}, []);

	const doLogin = useCallback(async () => {
		try {
			setLoading(true);
			await logIn(input.nick, input.password);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		} finally {
			setLoading(false);
		}
	}, [input]);

	const doSignUp = useCallback(async () => {
		try {
			setLoading(true);
			await signUp(input.nick, input.password, input.phone, input.type);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		} finally {
			setLoading(false);
		}
	}, [input]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') loginView ? doLogin() : doSignUp();
	};

	const isLoginDisabled = !input.nick || !input.password || loading;
	const isSignupDisabled = !input.nick || !input.password || !input.phone || loading;

	// ── INPUT FIELD COMPONENT ──────────────────────────────────────────────────
	const InputField = ({
		icon, label, name, type = 'text', placeholder, endAdornment
	}: {
		icon: React.ReactNode;
		label: string;
		name: string;
		type?: string;
		placeholder: string;
		endAdornment?: React.ReactNode;
	}) => (
		<Box component="div" sx={{ mb: 2 }}>
			<Typography sx={{ fontSize: 12, fontWeight: 600, color: '#555', mb: 0.75 }}>
				{label}
			</Typography>
			<Stack
				direction="row"
				alignItems="center"
				sx={{
					border: '1.5px solid rgba(255,77,141,0.2)',
					borderRadius: 2.5,
					px: 1.5,
					py: 1,
					background: '#fff',
					transition: 'all 0.2s',
					'&:focus-within': {
						borderColor: '#FF4D8D',
						boxShadow: '0 0 0 3px rgba(255,77,141,0.08)',
					},
				}}
			>
				<Box component="div" sx={{ color: '#FF4D8D', display: 'flex', mr: 1, flexShrink: 0 }}>
					{icon}
				</Box>
				<input
					type={type}
					placeholder={placeholder}
					value={(input as any)[name]}
					onChange={(e) => handleInput(name, e.target.value)}
					onKeyDown={handleKeyDown}
					style={{
						flex: 1,
						border: 'none',
						outline: 'none',
						fontSize: 14,
						fontFamily: 'Poppins, sans-serif',
						color: '#333',
						background: 'transparent',
					}}
				/>
				{endAdornment}
			</Stack>
		</Box>
	);

	// ── MOBILE ─────────────────────────────────────────────────────────────────
	if (device === 'mobile') {
		return (
			<Stack sx={{ minHeight: '100vh', background: 'linear-gradient(160deg, #fff0f5, #fff)', px: 2.5, py: 4 }}>
				{/* Logo */}
				<Stack alignItems="center" sx={{ mb: 4 }}>
					<img src="/img/logo/logo.svg" alt="BeautyNear" height={40} />
					<Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', mt: 1.5 }}>
						{loginView ? t('Welcome Back') : t('Join BeautyNear')}
					</Typography>
					<Typography sx={{ fontSize: 13, color: '#888', mt: 0.5 }}>
						{loginView ? t('Login to your account') : t('Create your free account')}
					</Typography>
				</Stack>

				{/* Form */}
				<Box component="div" sx={{ background: '#fff', borderRadius: 4, p: 3, boxShadow: '0 4px 24px rgba(255,77,141,0.08)' }}>
					<InputField
						icon={<PersonOutlineIcon sx={{ fontSize: 18 }} />}
						label={t('Nickname')}
						name="nick"
						placeholder={t('Enter nickname')}
					/>
					<InputField
						icon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
						label={t('Password')}
						name="password"
						type={showPassword ? 'text' : 'password'}
						placeholder={t('Enter password')}
						endAdornment={
							<Box component="div" onClick={() => setShowPassword(!showPassword)} sx={{ cursor: 'pointer', color: '#bbb', display: 'flex' }}>
								{showPassword ? <VisibilityOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
							</Box>
						}
					/>
					{!loginView && (
						<InputField
							icon={<PhoneOutlinedIcon sx={{ fontSize: 18 }} />}
							label={t('Phone')}
							name="phone"
							placeholder={t('Enter phone number')}
						/>
					)}

					<Button
						fullWidth
						onClick={loginView ? doLogin : doSignUp}
						disabled={loginView ? isLoginDisabled : isSignupDisabled}
						sx={{
							mt: 1,
							py: 1.5,
							background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
							color: '#fff',
							fontWeight: 700,
							fontSize: 15,
							borderRadius: 2.5,
							boxShadow: '0 4px 16px rgba(255,77,141,0.35)',
							transition: 'all 0.25s',
							'&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(255,77,141,0.45)' },
							'&:disabled': { background: '#ddd', color: '#fff', boxShadow: 'none' },
						}}
					>
						{loading ? '...' : loginView ? t('Login') : t('Sign Up')}
					</Button>

					<Stack direction="row" justifyContent="center" sx={{ mt: 2.5 }}>
						<Typography sx={{ fontSize: 13, color: '#888' }}>
							{loginView ? t("Don't have an account?") : t('Already have an account?')}
						</Typography>
						<Typography
							onClick={() => setLoginView(!loginView)}
							sx={{ fontSize: 13, fontWeight: 700, color: '#FF4D8D', ml: 0.75, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
						>
							{loginView ? t('Sign Up') : t('Login')}
						</Typography>
					</Stack>
				</Box>
			</Stack>
		);
	}

	// ── DESKTOP ────────────────────────────────────────────────────────────────
	return (
		<Stack className="join-page">
			<Stack className="container">
				<Stack className="main">
					{/* LEFT — Form */}
					<Stack className="left">
						{/* Logo */}
						<Box component="div" className="logo">
							<img src="/img/logo/logo.svg" alt="BeautyNear" />
							<Typography sx={{ fontSize: 13, color: '#FF4D8D', fontWeight: 600, mt: 0.5 }}>BeautyNear</Typography>
						</Box>

						{/* Title */}
						<Box component="div" className="info">
							<Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a1a', mb: 0.5 }}>
								{loginView ? t('Welcome Back! 👋') : t('Join BeautyNear 💄')}
							</Typography>
							<Typography sx={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
								{loginView
									? t('Login to book your perfect beauty experience')
									: t('Create your account and discover K-Beauty near you')}
							</Typography>
						</Box>

						{/* Inputs */}
						<Box component="div" className="input-wrap">
							<InputField
								icon={<PersonOutlineIcon sx={{ fontSize: 18 }} />}
								label={t('Nickname')}
								name="nick"
								placeholder={t('Enter your nickname')}
							/>
							<InputField
								icon={<LockOutlinedIcon sx={{ fontSize: 18 }} />}
								label={t('Password')}
								name="password"
								type={showPassword ? 'text' : 'password'}
								placeholder={t('Enter your password')}
								endAdornment={
									<Box component="div" onClick={() => setShowPassword(!showPassword)} sx={{ cursor: 'pointer', color: '#bbb', display: 'flex' }}>
										{showPassword ? <VisibilityOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
									</Box>
								}
							/>
							{!loginView && (
								<InputField
									icon={<PhoneOutlinedIcon sx={{ fontSize: 18 }} />}
									label={t('Phone number')}
									name="phone"
									placeholder={t('Enter your phone number')}
								/>
							)}
						</Box>

						{/* Bottom options */}
						<Box component="div" className="register">
							{loginView && (
								<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
									<FormControlLabel
										control={
											<Checkbox
												size="small"
												checked={rememberMe}
												onChange={(e) => setRememberMe(e.target.checked)}
												sx={{ color: '#FF4D8D', '&.Mui-checked': { color: '#FF4D8D' } }}
											/>
										}
										label={<Typography sx={{ fontSize: 13, color: '#555' }}>{t('Remember me')}</Typography>}
									/>
									<Typography sx={{ fontSize: 13, color: '#FF4D8D', cursor: 'pointer', fontWeight: 500, '&:hover': { opacity: 0.8 } }}>
										{t('Forgot password?')}
									</Typography>
								</Stack>
							)}

							<Button
								fullWidth
								onClick={loginView ? doLogin : doSignUp}
								disabled={loginView ? isLoginDisabled : isSignupDisabled}
								sx={{
									py: 1.5,
									background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
									color: '#fff',
									fontWeight: 700,
									fontSize: 15,
									borderRadius: 2.5,
									boxShadow: '0 4px 16px rgba(255,77,141,0.35)',
									transition: 'all 0.25s',
									'&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(255,77,141,0.45)', background: 'linear-gradient(135deg, #e53578, #FF4D8D)' },
									'&:active': { transform: 'translateY(0)' },
									'&:disabled': { background: '#eee', color: '#bbb', boxShadow: 'none', transform: 'none' },
								}}
							>
								{loading ? '...' : loginView ? t('Login') : t('Create Account')}
							</Button>

							{/* Divider */}
							<Stack direction="row" alignItems="center" gap={1.5} sx={{ my: 2.5 }}>
								<Divider sx={{ flex: 1, borderColor: 'rgba(255,77,141,0.15)' }} />
								<Typography sx={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>{t('or')}</Typography>
								<Divider sx={{ flex: 1, borderColor: 'rgba(255,77,141,0.15)' }} />
							</Stack>

							{/* Kakao / Naver social buttons */}
							<Stack direction="row" gap={1.5}>
								<Button
									fullWidth
									sx={{
										py: 1.25,
										background: '#FEE500',
										color: '#3C1E1E',
										fontWeight: 600,
										fontSize: 13,
										borderRadius: 2.5,
										transition: 'all 0.2s',
										'&:hover': { background: '#f0d800', transform: 'translateY(-1px)' },
									}}
								>
									💬 {t('Kakao')}
								</Button>
								<Button
									fullWidth
									sx={{
										py: 1.25,
										background: '#03C75A',
										color: '#fff',
										fontWeight: 600,
										fontSize: 13,
										borderRadius: 2.5,
										transition: 'all 0.2s',
										'&:hover': { background: '#02b050', transform: 'translateY(-1px)' },
									}}
								>
									N {t('Naver')}
								</Button>
							</Stack>
						</Box>

						{/* Switch login/signup */}
						<Box component="div" className="ask-info">
							<Stack direction="row" justifyContent="center" alignItems="center" gap={0.75}>
								<Typography sx={{ fontSize: 14, color: '#888' }}>
									{loginView ? t("Don't have an account?") : t('Already have an account?')}
								</Typography>
								<Typography
									onClick={() => setLoginView(!loginView)}
									sx={{ fontSize: 14, fontWeight: 700, color: '#FF4D8D', cursor: 'pointer', transition: 'opacity 0.2s', '&:hover': { opacity: 0.8 } }}
								>
									{loginView ? t('Sign Up') : t('Login')}
								</Typography>
							</Stack>
						</Box>
					</Stack>

					{/* RIGHT — Decorative */}
					<Stack className="right">
						<Box
							component="div"
							sx={{
								width: '100%',
								height: '100%',
								background: 'linear-gradient(135deg, #FF4D8D 0%, #FF85B3 50%, #ffb3d0 100%)',
								borderRadius: '0 24px 24px 0',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 3,
								p: 4,
								position: 'relative',
								overflow: 'hidden',
							}}
						>
							{/* Decorative circles */}
							{[
								{ size: 300, top: -100, right: -100, op: 0.1 },
								{ size: 200, bottom: -60, left: -60, op: 0.08 },
							].map((c, i) => (
								<Box key={i} component="div" sx={{
									position: 'absolute',
									width: c.size, height: c.size,
									top: (c as any).top, right: (c as any).right,
									bottom: (c as any).bottom, left: (c as any).left,
									borderRadius: '50%',
									background: `rgba(255,255,255,${c.op})`,
									pointerEvents: 'none',
								}} />
							))}

							<Typography sx={{ fontSize: 28, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.3, position: 'relative', zIndex: 1 }}>
								{loginView ? t('Your Beauty Journey Starts Here') : t('Discover K-Beauty Near You')}
							</Typography>

							<Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.7, maxWidth: 300, position: 'relative', zIndex: 1 }}>
								{loginView
									? t('Access thousands of K-Beauty salons and clinics near you')
									: t('Join 10K+ customers enjoying premium Korean beauty services')}
							</Typography>

							{/* Stats */}
							<Stack direction="row" gap={3} sx={{ position: 'relative', zIndex: 1 }}>
								{[
									{ value: '10K+', label: t('Happy Customers') },
									{ value: '500+', label: t('Verified Salons') },
									{ value: '4.9', label: t('Average Rating') },
								].map((s) => (
									<Stack key={s.value} alignItems="center">
										<Typography sx={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{s.value}</Typography>
										<Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{s.label}</Typography>
									</Stack>
								))}
							</Stack>

							<Box component="div" sx={{ fontSize: 80, position: 'relative', zIndex: 1 }}>💄</Box>
						</Box>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Join);