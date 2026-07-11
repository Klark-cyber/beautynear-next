import React, { useCallback, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography, Divider } from '@mui/material';
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

	// Nestar pattern — USER/AGENT roli tanlash
	const checkUserTypeHandler = (e: any) => {
		const checked = e.target.checked;
		if (checked) {
			handleInput('type', e.target.name);
		} else {
			handleInput('type', 'USER');
		}
	};

	const doLogin = useCallback(async () => {
		try {
			setLoading(true);
			await logIn(input.nick, input.password);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
			// ⚠️ TUZATILDI: login ma'lumotlari xato bo'lsa (masalan
			// hisob mavjud emas), foydalanuvchini avtomatik Sign Up
			// rejimiga o'tkazamiz — parol/nomer allaqachon kiritilgan
			// holda qoladi, faqat qo'shimcha maydonlarni to'ldirish kifoya.
			setLoginView(false);
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

	/** MOBILE **/
	if (device === 'mobile') {
		return (
			<Stack className="join-page mobile">
				<Stack alignItems="center" className="join-logo-m">
					<img src="/img/logo/logo.png" alt="BeautyNear" height={40} />
					<Typography className="jl-title">{loginView ? t('Welcome Back') : t('Join BeautyNear')}</Typography>
					<Typography className="jl-sub">{loginView ? t('Login to your account') : t('Create your free account')}</Typography>
				</Stack>

				<Box component="div" className="join-form-m">
					{/* Nickname */}
					<Box component="div" className="field-block">
						<Typography className="field-label">{t('Nickname')}</Typography>
						<Stack direction="row" alignItems="center" className="field-input">
							<Box component="div" className="fi-icon"><PersonOutlineIcon sx={{ fontSize: 18 }} /></Box>
							<input
								type="text"
								placeholder={t('Enter nickname')}
								value={input.nick}
								onChange={(e) => handleInput('nick', e.target.value)}
								onKeyDown={handleKeyDown}
								className="fi-field"
							/>
						</Stack>
					</Box>

					{/* Password */}
					<Box component="div" className="field-block">
						<Typography className="field-label">{t('Password')}</Typography>
						<Stack direction="row" alignItems="center" className="field-input">
							<Box component="div" className="fi-icon"><LockOutlinedIcon sx={{ fontSize: 18 }} /></Box>
							<input
								type={showPassword ? 'text' : 'password'}
								placeholder={t('Enter password')}
								value={input.password}
								onChange={(e) => handleInput('password', e.target.value)}
								onKeyDown={handleKeyDown}
								className="fi-field"
							/>
							<Box component="div" onClick={() => setShowPassword(!showPassword)} className="fi-toggle">
								{showPassword ? <VisibilityOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
							</Box>
						</Stack>
					</Box>

					{/* Phone (signup only) */}
					{!loginView && (
						<Box component="div" className="field-block">
							<Typography className="field-label">{t('Phone')}</Typography>
							<Stack direction="row" alignItems="center" className="field-input">
								<Box component="div" className="fi-icon"><PhoneOutlinedIcon sx={{ fontSize: 18 }} /></Box>
								<input
									type="text"
									placeholder={t('Enter phone number')}
									value={input.phone}
									onChange={(e) => handleInput('phone', e.target.value)}
									onKeyDown={handleKeyDown}
									className="fi-field"
								/>
							</Stack>
						</Box>
					)}

					{/* USER/AGENT type — signup only */}
					{!loginView && (
						<Box component="div" className="join-type">
							<Typography className="jt-label">{t('I want to register as')}:</Typography>
							<Stack direction="row" gap={1.5} className="jt-options">
								<Box component="div" className={`jt-card ${input.type === 'USER' ? 'active' : ''}`} onClick={() => handleInput('type', 'USER')}>
									<Typography className="jtc-title">{t('Customer')}</Typography>
								</Box>
								<Box component="div" className={`jt-card ${input.type === 'AGENT' ? 'active' : ''}`} onClick={() => handleInput('type', 'AGENT')}>
									<Typography className="jtc-title">{t('Salon Owner')}</Typography>
								</Box>
							</Stack>
						</Box>
					)}

					<Button
						fullWidth
						onClick={loginView ? doLogin : doSignUp}
						disabled={loginView ? isLoginDisabled : isSignupDisabled}
						className="join-submit"
					>
						{loading ? '...' : loginView ? t('Login') : t('Sign Up')}
					</Button>

					<Stack direction="row" justifyContent="center" className="join-switch">
						<Typography className="js-text">{loginView ? t("Don't have an account?") : t('Already have an account?')}</Typography>
						<Typography onClick={() => setLoginView(!loginView)} className="js-link">
							{loginView ? t('Sign Up') : t('Login')}
						</Typography>
					</Stack>
				</Box>
			</Stack>
		);
	}

	/** DESKTOP **/
	return (
		<Stack className="join-page">
			<Stack className="join-container">
				<Stack className="join-main">
					{/* LEFT — Form */}
					<Stack className="join-left">
						<Box component="div" className="join-logo">
							<img src="/img/logo/logo.png" alt="BeautyNear" />
						</Box>

						<Box component="div" className="join-info">
							<Typography className="ji-title">{loginView ? t('Welcome Back! 👋') : t('Join BeautyNear 💄')}</Typography>
							<Typography className="ji-sub">
								{loginView
									? t('Login to book your perfect beauty experience')
									: t('Create your account and discover K-Beauty near you')}
							</Typography>
						</Box>

						{/* Inputs */}
						<Box component="div" className="join-inputs">
							{/* Nickname */}
							<Box component="div" className="field-block">
								<Typography className="field-label">{t('Nickname')}</Typography>
								<Stack direction="row" alignItems="center" className="field-input">
									<Box component="div" className="fi-icon"><PersonOutlineIcon sx={{ fontSize: 18 }} /></Box>
									<input
										type="text"
										placeholder={t('Enter your nickname')}
										value={input.nick}
										onChange={(e) => handleInput('nick', e.target.value)}
										onKeyDown={handleKeyDown}
										className="fi-field"
									/>
								</Stack>
							</Box>

							{/* Password */}
							<Box component="div" className="field-block">
								<Typography className="field-label">{t('Password')}</Typography>
								<Stack direction="row" alignItems="center" className="field-input">
									<Box component="div" className="fi-icon"><LockOutlinedIcon sx={{ fontSize: 18 }} /></Box>
									<input
										type={showPassword ? 'text' : 'password'}
										placeholder={t('Enter your password')}
										value={input.password}
										onChange={(e) => handleInput('password', e.target.value)}
										onKeyDown={handleKeyDown}
										className="fi-field"
									/>
									<Box component="div" onClick={() => setShowPassword(!showPassword)} className="fi-toggle">
										{showPassword ? <VisibilityOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
									</Box>
								</Stack>
							</Box>

							{/* Phone (signup only) */}
							{!loginView && (
								<Box component="div" className="field-block">
									<Typography className="field-label">{t('Phone number')}</Typography>
									<Stack direction="row" alignItems="center" className="field-input">
										<Box component="div" className="fi-icon"><PhoneOutlinedIcon sx={{ fontSize: 18 }} /></Box>
										<input
											type="text"
											placeholder={t('Enter your phone number')}
											value={input.phone}
											onChange={(e) => handleInput('phone', e.target.value)}
											onKeyDown={handleKeyDown}
											className="fi-field"
										/>
									</Stack>
								</Box>
							)}
						</Box>

						{/* Bottom options */}
						<Box component="div" className="join-register">
							{/* USER/AGENT type — signup only */}
							{!loginView && (
								<Box component="div" className="join-type">
									<Typography className="jt-label">{t('I want to register as')}:</Typography>
									<Stack direction="row" gap={1.5} className="jt-options">
										<Box
											component="div"
											className={`jt-card ${input.type === 'USER' ? 'active' : ''}`}
											onClick={() => handleInput('type', 'USER')}
										>
											<Typography className="jtc-title">{t('Customer')}</Typography>
											<Typography className="jtc-desc">{t('Book beauty services')}</Typography>
										</Box>
										<Box
											component="div"
											className={`jt-card ${input.type === 'AGENT' ? 'active' : ''}`}
											onClick={() => handleInput('type', 'AGENT')}
										>
											<Typography className="jtc-title">{t('Salon Owner')}</Typography>
											<Typography className="jtc-desc">{t('List your salon')}</Typography>
										</Box>
									</Stack>
								</Box>
							)}

							{loginView && (
								<Stack direction="row" justifyContent="space-between" alignItems="center" className="join-remember">
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
									<Typography className="forgot-pw">{t('Forgot password?')}</Typography>
								</Stack>
							)}

							<Button
								fullWidth
								onClick={loginView ? doLogin : doSignUp}
								disabled={loginView ? isLoginDisabled : isSignupDisabled}
								className="join-submit"
							>
								{loading ? '...' : loginView ? t('Login') : t('Create Account')}
							</Button>

							<Stack direction="row" alignItems="center" gap={1.5} className="join-divider">
								<Divider sx={{ flex: 1, borderColor: 'rgba(255,77,141,0.15)' }} />
								<Typography className="jd-text">{t('or')}</Typography>
								<Divider sx={{ flex: 1, borderColor: 'rgba(255,77,141,0.15)' }} />
							</Stack>

							<Stack direction="row" gap={1.5}>
								<Button fullWidth className="social-btn kakao">💬 {t('Kakao')}</Button>
								<Button fullWidth className="social-btn naver">N {t('Naver')}</Button>
							</Stack>
						</Box>

						<Box component="div" className="join-ask">
							<Stack direction="row" justifyContent="center" alignItems="center" gap={0.75}>
								<Typography className="ja-text">{loginView ? t("Don't have an account?") : t('Already have an account?')}</Typography>
								<Typography onClick={() => setLoginView(!loginView)} className="ja-link">
									{loginView ? t('Sign Up') : t('Login')}
								</Typography>
							</Stack>
						</Box>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Join);