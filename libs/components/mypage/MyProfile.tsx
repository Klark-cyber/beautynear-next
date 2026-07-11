import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import {
	Box,
	Stack,
	Typography,
	TextField,
	Button,
	IconButton,
	Chip,
	Select,
	MenuItem,
	Avatar,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { REQUEST_AGENT_ROLE } from '../../../apollo/user/mutation';
import { MemberUpdate } from '../../types/member/member.update';
import { MemberType } from '../../enums/member.enum';
import { SalonType } from '../../enums/salon.enum';
import { getJwtToken, setJwtToken } from '../../auth';
import { REACT_APP_API_URL, Messages } from '../../config';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string): string => {
	if (!raw) return '/img/profile/defaultUser.svg';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const SPECIALTY_LABEL: Record<string, string> = {
	HAIR: 'Hair',
	NAIL: 'Nail',
	SKIN: 'Skin Care',
	CLINIC: 'Clinic',
	MASSAGE: 'Massage',
};

const SPECIALTY_OPTIONS = Object.values(SalonType);

/* ─── Component ───────────────────────────────────────────────────────────── */

const MyProfile: NextPage = ({
	initialValues = {
		_id: '',
		memberFullName: '',
		memberNick: '',
		memberPhone: '',
		memberAddress: '',
		memberDesc: '',
		memberImage: '',
		memberExperience: 0,
		memberSpecialty: [],
		memberPortfolio: [],
	},
	...props
}: any) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const token = getJwtToken();

	const photoInputRef = useRef<HTMLInputElement>(null);
	const portfolioInputRef = useRef<HTMLInputElement>(null);

	const [agentSectionOpen, setAgentSectionOpen] = useState<boolean>(true);
	const [showCurrentPw, setShowCurrentPw] = useState<boolean>(false);
	const [showNewPw, setShowNewPw] = useState<boolean>(false);
	const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);

	const isAgent = user?.memberType === MemberType.AGENT;

	const [profileData, setProfileData] = useState<MemberUpdate>(initialValues);

	const [currentPassword, setCurrentPassword] = useState<string>('');
	const [newPassword, setNewPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [updateMember] = useMutation(UPDATE_MEMBER);
	const [requestAgentRole] = useMutation(REQUEST_AGENT_ROLE);

	/** LIFECYCLES **/
	useEffect(() => {
		if (!user?._id) return;
		setProfileData({
			_id: user._id,
			memberFullName: user.memberFullName ?? '',
			memberNick: user.memberNick ?? '',
			memberPhone: user.memberPhone ?? '',
			memberAddress: user.memberAddress ?? '',
			memberDesc: user.memberDesc ?? '',
			memberImage: user.memberImage ?? '',
			memberExperience: user.memberExperience ?? 0,
			memberSpecialty: user.memberSpecialty ?? [],
			memberPortfolio: user.memberPortfolio ?? [],
		});
	}, [user?._id]);

	/** HANDLERS **/

	// Profil rasmi — bitta rasm (Nestar'dagi single-image multipart naqshi, target: 'member')
	const uploadPhotoHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const image = e.target.files?.[0];
			if (!image) return;

			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target)
					}`,
					variables: { file: null, target: 'member' },
				}),
			);
			formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
			formData.append('0', image);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			setProfileData((prev) => ({ ...prev, memberImage: responseImage }));
		} catch (err) {
			console.log('Error, uploadPhotoHandler:', err);
			sweetMixinErrorAlert('Image upload failed').then();
		}
	};

	// Portfolio rasmlari — bir nechta rasm (AddNewProperty'dagi imagesUploader naqshi, target: 'member')
	const uploadPortfolioHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const files = e.target.files;
			if (!files || files.length === 0) return;
			if (files.length > 5) throw new Error('Cannot upload more than 5 images!');

			const formData = new FormData();
			const fileVars: any[] = new Array(files.length).fill(null);
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
						imagesUploader(files: $files, target: $target)
					}`,
					variables: { files: fileVars, target: 'member' },
				}),
			);
			const map: Record<string, string[]> = {};
			for (let i = 0; i < files.length; i++) {
				map[i] = [`variables.files.${i}`];
			}
			formData.append('map', JSON.stringify(map));
			for (let i = 0; i < files.length; i++) {
				formData.append(`${i}`, files[i]);
			}

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImages: string[] = response.data.data.imagesUploader;
			setProfileData((prev) => ({
				...prev,
				memberPortfolio: [...(prev.memberPortfolio ?? []), ...responseImages],
			}));
		} catch (err: any) {
			console.log('Error, uploadPortfolioHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const removePortfolioImage = (index: number) => {
		setProfileData((prev) => ({
			...prev,
			memberPortfolio: (prev.memberPortfolio ?? []).filter((_, i) => i !== index),
		}));
	};

	const toggleSpecialty = (value: string) => {
		setProfileData((prev) => {
			const current = prev.memberSpecialty ?? [];
			const exists = current.includes(value);
			return {
				...prev,
				memberSpecialty: exists ? current.filter((v) => v !== value) : [...current, value],
			};
		});
	};

	const updateProfileHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);

			// ⚠️ TUZATILDI: avval memberNick har doim (hatto bo'sh yoki
			// noto'g'ri uzunlikda bo'lsa ham) yuborilar edi — backend'dagi
			// @Length(3,12) validatsiyasini buzib, "Bad Request" xatosiga
			// sabab bo'lardi. Endi faqat 3-12 belgi oralig'ida bo'lsagina yuboriladi.
			const updateInput: any = {
				_id: user._id,
				memberFullName: profileData.memberFullName,
				memberPhone: profileData.memberPhone,
				memberAddress: profileData.memberAddress,
				memberDesc: profileData.memberDesc,
				memberImage: profileData.memberImage,
			};

			if (profileData.memberNick && profileData.memberNick.length >= 3 && profileData.memberNick.length <= 12) {
				updateInput.memberNick = profileData.memberNick;
			}

			if (isAgent) {
				updateInput.memberExperience = profileData.memberExperience;
				updateInput.memberSpecialty = profileData.memberSpecialty;
				updateInput.memberPortfolio = profileData.memberPortfolio;
			}

			const result = await updateMember({
				variables: { input: updateInput },
			});

			// ⚠️ TUZATILDI: backend `updateMember`da yangi JWT yaratib
			// qaytarar ekan (`result.accessToken = createToken(result)`),
			// biz esa buni so'ramagan va localStorage'ga saqlamagan edik —
			// shuning uchun eski JWT qayta o'qilganda (masalan boshqa
			// sahifaga o'tganda) yangilangan maydonlar (masalan rasm)
			// "yo'qolib qolar" edi. Endi yangi JWT'ni ham saqlaymiz.
			if (result.data.updateMember.accessToken) {
				setJwtToken(result.data.updateMember.accessToken);
			}
			userVar({ ...user, ...result.data.updateMember });
			await sweetMixinSuccessAlert('Profile updated successfully!');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	// ⚠️ MemberUpdate turida "eski parolni tekshirish" maydoni yo'q — backend
	// updateMember faqat yangi memberPassword'ni qabul qiladi. "Current Password"
	// maydoni shu sababli faqat frontend-side tekshiruv (bo'sh emasligi) uchun,
	// backendga yuborilmaydi.
	const changePasswordHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!currentPassword || !newPassword || !confirmPassword) {
				throw new Error(Messages.error1);
			}
			if (newPassword !== confirmPassword) {
				throw new Error('New passwords do not match!');
			}

			const result = await updateMember({
				variables: { input: { _id: user._id, memberPassword: newPassword } },
			});
			// Parol o'zgargach ham backend yangi JWT qaytaradi — uni saqlaymiz
			if (result.data?.updateMember?.accessToken) {
				setJwtToken(result.data.updateMember.accessToken);
			}
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			await sweetMixinSuccessAlert('Password updated successfully!');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	// ⚠️ YANGI — oddiy foydalanuvchi Agent bo'lishni so'rashi uchun
	const requestAgentHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			await requestAgentRole();
			await sweetMixinSuccessAlert('Your request has been sent! Our team will review it soon.');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component="div" className="mypage-content">
			{/* Sarlavha */}
			<Typography className="content-title">{t('Edit Profile')}</Typography>
			<Typography className="content-subtitle">{t('Manage your personal information')}</Typography>

			{/* ═══ CARD 1 — Profile Information ═══ */}
			<Box component="div" className="profile-card">
				<Typography className="pc-card-title">{t('Profile Information')}</Typography>

				{/* Rasm */}
				<Stack direction="row" alignItems="center" gap={3} className="pc-photo-row">
					<Box component="div" className="pc-avatar-wrap">
						<Avatar src={imgUrl(profileData.memberImage)} className="pc-avatar" />
						<IconButton className="pc-avatar-cam" onClick={() => photoInputRef.current?.click()}>
							<PhotoCameraIcon sx={{ fontSize: 15 }} />
						</IconButton>
						<input ref={photoInputRef} type="file" hidden accept="image/jpg, image/jpeg, image/png" onChange={uploadPhotoHandler} />
					</Box>
					<Stack>
						<Button
							className="pc-upload-btn"
							startIcon={<FileUploadOutlinedIcon />}
							onClick={() => photoInputRef.current?.click()}
						>
							{t('Upload Photo')}
						</Button>
						<Typography className="pc-upload-hint">{t('JPG, JPEG or PNG, max 5MB')}</Typography>
					</Stack>
				</Stack>

				{/* Full Name / Nickname */}
				<Stack direction="row" gap={2.5} className="pc-input-row">
					<Stack className="pc-input-group">
						<Typography className="pc-label">{t('Full Name')}</Typography>
						<TextField
							fullWidth
							value={profileData.memberFullName}
							onChange={(e) => setProfileData({ ...profileData, memberFullName: e.target.value })}
						/>
					</Stack>
					<Stack className="pc-input-group">
						<Typography className="pc-label">{t('Nickname')}</Typography>
						<TextField
							fullWidth
							value={profileData.memberNick}
							onChange={(e) => setProfileData({ ...profileData, memberNick: e.target.value })}
						/>
					</Stack>
				</Stack>

				{/* Phone / Address */}
				<Stack direction="row" gap={2.5} className="pc-input-row">
					<Stack className="pc-input-group">
						<Typography className="pc-label">{t('Phone Number')}</Typography>
						<TextField
							fullWidth
							value={profileData.memberPhone}
							onChange={(e) => setProfileData({ ...profileData, memberPhone: e.target.value })}
						/>
					</Stack>
					<Stack className="pc-input-group">
						<Typography className="pc-label">{t('Address')}</Typography>
						<TextField
							fullWidth
							value={profileData.memberAddress}
							onChange={(e) => setProfileData({ ...profileData, memberAddress: e.target.value })}
						/>
					</Stack>
				</Stack>

				{/* About Me */}
				<Stack className="pc-input-group full">
					<Typography className="pc-label">{t('About Me / Bio')}</Typography>
					<TextField
						fullWidth
						multiline
						rows={3}
						placeholder={t('Tell others about yourself...')}
						value={profileData.memberDesc}
						onChange={(e) => setProfileData({ ...profileData, memberDesc: e.target.value })}
					/>
				</Stack>

				{/* AGENT ONLY — Specialist Information */}
				{isAgent && (
					<Box component="div" className="pc-agent-section">
						<Stack
							direction="row"
							alignItems="center"
							justifyContent="space-between"
							className="pc-agent-header"
							onClick={() => setAgentSectionOpen(!agentSectionOpen)}
						>
							<Stack direction="row" alignItems="center" gap={1.5}>
								<Chip label={t('Agent')} size="small" className="pc-agent-badge" />
								<Typography className="pc-agent-title">{t('Specialist Information')}</Typography>
							</Stack>
							{agentSectionOpen ? <ExpandLessIcon sx={{ color: '#FF4D8D' }} /> : <ExpandMoreIcon sx={{ color: '#FF4D8D' }} />}
						</Stack>

						{agentSectionOpen && (
							<>
								<Stack direction="row" gap={2.5} className="pc-input-row">
									<Stack className="pc-input-group">
										<Typography className="pc-label">{t('Years of Experience')}</Typography>
										<TextField
											fullWidth
											type="number"
											value={profileData.memberExperience === 0 ? '' : profileData.memberExperience}
											onFocus={(e) => e.target.select()}
											onChange={(e) => {
												const val = e.target.value;
												setProfileData({
													...profileData,
													memberExperience: val === '' ? 0 : parseInt(val) || 0,
												});
											}}
										/>
									</Stack>
									<Stack className="pc-input-group">
										<Typography className="pc-label">{t('Specialty Tags')}</Typography>
										<Select
											fullWidth
											multiple
											displayEmpty
											value={profileData.memberSpecialty ?? []}
											renderValue={(selected) => (
												<Stack direction="row" gap={0.75} flexWrap="wrap">
													{(selected as string[]).map((val) => (
														<Chip
															key={val}
															label={SPECIALTY_LABEL[val] ?? val}
															size="small"
															className="pc-specialty-chip"
															onMouseDown={(e) => e.stopPropagation()}
															onDelete={() => toggleSpecialty(val)}
														/>
													))}
												</Stack>
											)}
										>
											{SPECIALTY_OPTIONS.map((opt) => (
												<MenuItem key={opt} value={opt} onClick={() => toggleSpecialty(opt)}>
													{SPECIALTY_LABEL[opt] ?? opt}
												</MenuItem>
											))}
										</Select>
									</Stack>
								</Stack>

								<Stack className="pc-input-group full">
									<Typography className="pc-label">{t('Portfolio Images')}</Typography>
									<Stack direction="row" gap={1.5} flexWrap="wrap" className="pc-portfolio-row">
										{(profileData.memberPortfolio ?? []).map((img, idx) => (
											<Box component="div" key={idx} className="pc-portfolio-thumb">
												<img src={imgUrl(img)} alt="" />
												<IconButton className="pc-portfolio-remove" onClick={() => removePortfolioImage(idx)}>
													×
												</IconButton>
											</Box>
										))}
										<Box component="div" className="pc-portfolio-add" onClick={() => portfolioInputRef.current?.click()}>
											<AddIcon sx={{ fontSize: 22, color: '#FF4D8D' }} />
											<Typography className="pc-portfolio-add-text">{t('Add More')}</Typography>
										</Box>
										<input
											ref={portfolioInputRef}
											type="file"
											hidden
											multiple
											accept="image/jpg, image/jpeg, image/png"
											onChange={uploadPortfolioHandler}
										/>
									</Stack>
								</Stack>
							</>
						)}
					</Box>
				)}

				{/* ⚠️ YANGI — oddiy foydalanuvchilar uchun "Agent bo'lish" so'rovi */}
				{!isAgent && user?.memberType !== MemberType.ADMIN && (
					<Box
						component="div"
						sx={{
							mt: 3, p: 2.5, borderRadius: 3,
							background: 'rgba(255,77,141,0.05)',
							border: '1px dashed rgba(255,77,141,0.3)',
						}}
					>
						{user?.agentRequestStatus === 'PENDING' ? (
							<Typography sx={{ fontSize: 13, color: '#FF4D8D', fontWeight: 700 }}>
								⏳ {t('Your agent application is under review.')}
							</Typography>
						) : user?.agentRequestStatus === 'REJECTED' ? (
							<Typography sx={{ fontSize: 13, color: '#999' }}>
								{t('Your previous agent application was not approved.')}
							</Typography>
						) : (
							<Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
								<Box component="div">
									<Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
										{t('Want to list your salon?')}
									</Typography>
									<Typography sx={{ fontSize: 12, color: '#888' }}>
										{t('Apply to become an agent and start managing your own salons.')}
									</Typography>
								</Box>
								<Button
									onClick={requestAgentHandler}
									sx={{
										px: 2.5, py: 1, borderRadius: 2.5, flexShrink: 0,
										background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
										color: '#fff', fontSize: 12.5, fontWeight: 700, textTransform: 'none',
									}}
								>
									{t('Become an Agent')}
								</Button>
							</Stack>
						)}
					</Box>
				)}

				<Stack direction="row" justifyContent="flex-end">
					<Button className="pc-save-btn" onClick={updateProfileHandler}>
						{t('Save Changes')}
					</Button>
				</Stack>
			</Box>

			{/* ═══ CARD 2 — Change Password ═══ */}
			<Box component="div" className="profile-card">
				<Typography className="pc-card-title">{t('Change Password')}</Typography>

				<Stack className="pc-input-group full">
					<Typography className="pc-label">{t('Current Password')}</Typography>
					<TextField
						fullWidth
						type={showCurrentPw ? 'text' : 'password'}
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						InputProps={{
							endAdornment: (
								<IconButton onClick={() => setShowCurrentPw(!showCurrentPw)}>
									{showCurrentPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
								</IconButton>
							),
						}}
					/>
				</Stack>

				<Stack direction="row" gap={2.5} className="pc-input-row">
					<Stack className="pc-input-group">
						<Typography className="pc-label">{t('New Password')}</Typography>
						<TextField
							fullWidth
							type={showNewPw ? 'text' : 'password'}
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							InputProps={{
								endAdornment: (
									<IconButton onClick={() => setShowNewPw(!showNewPw)}>
										{showNewPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
									</IconButton>
								),
							}}
						/>
					</Stack>
					<Stack className="pc-input-group">
						<Typography className="pc-label">{t('Confirm New Password')}</Typography>
						<TextField
							fullWidth
							type={showConfirmPw ? 'text' : 'password'}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							InputProps={{
								endAdornment: (
									<IconButton onClick={() => setShowConfirmPw(!showConfirmPw)}>
										{showConfirmPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
									</IconButton>
								),
							}}
						/>
					</Stack>
				</Stack>

				<Stack direction="row" justifyContent="flex-end">
					<Button className="pc-password-btn" onClick={changePasswordHandler}>
						{t('Update Password')}
					</Button>
				</Stack>
			</Box>
		</Box>
	);
};

export default MyProfile;

MyProfile.defaultProps = {
	initialValues: {
		_id: '',
		memberFullName: '',
		memberNick: '',
		memberPhone: '',
		memberAddress: '',
		memberDesc: '',
		memberImage: '',
		memberExperience: 0,
		memberSpecialty: [],
		memberPortfolio: [],
	},
};