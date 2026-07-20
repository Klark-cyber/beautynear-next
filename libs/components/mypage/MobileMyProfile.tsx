import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, OutlinedInput, IconButton, Chip } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { UPDATE_MEMBER, REQUEST_AGENT_ROLE } from '../../../apollo/user/mutation';
import { GET_MEMBER } from '../../../apollo/user/query';
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

// ⚠️ MUHIM: bu komponent Desktop MyProfile.tsx'ning ANIQ o'zi bilan bir xil
// query/handler mantiqidan foydalanadi (updateProfileHandler, changePasswordHandler,
// requestAgentHandler, image upload naqshi) — faqat mobil UI bilan.
// Change Password ALOHIDA sahifa emas — shu yerning o'zida joylashgan.

const MobileMyProfile = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const token = getJwtToken();

	// ⚠️ YANGI — avval bu sahifa FAQAT login paytidagi eski keshdan
	// (userVar) foydalanardi. Agar admin boshqa joyda Agent sifatida
	// tasdiqlagan bo'lsa, lekin foydalanuvchi hali qayta kirmagan/real-time
	// bildirishnomani olmagan bo'lsa, "Become an Agent" bo'limi ESKI
	// holatda qolib ketardi. Endi sahifa ochilganda serverdan HAQIQIY
	// holat so'raladi va userVar shunga moslab yangilanadi.
	useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { memberId: user?._id },
		skip: !user?._id,
		onCompleted: (data: any) => {
			const fresh = data?.getMember;
			if (fresh && user && (fresh.memberType !== user.memberType || fresh.agentRequestStatus !== user.agentRequestStatus)) {
				userVar({ ...user, memberType: fresh.memberType, agentRequestStatus: fresh.agentRequestStatus });
			}
		},
	});

	const photoInputRef = useRef<HTMLInputElement>(null);
	const portfolioInputRef = useRef<HTMLInputElement>(null);

	const isAgent = user?.memberType === MemberType.AGENT;

	const [agentSectionOpen, setAgentSectionOpen] = useState(true);
	const [pwSectionOpen, setPwSectionOpen] = useState(false);
	const [showCurrentPw, setShowCurrentPw] = useState(false);
	const [showNewPw, setShowNewPw] = useState(false);
	const [showConfirmPw, setShowConfirmPw] = useState(false);

	const [profileData, setProfileData] = useState<any>({
		_id: '', memberFullName: '', memberNick: '', memberPhone: '',
		memberAddress: '', memberDesc: '', memberImage: '',
		memberExperience: 0, memberSpecialty: [], memberPortfolio: [],
	});

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const [updateMember] = useMutation(UPDATE_MEMBER);
	const [requestAgentRole] = useMutation(REQUEST_AGENT_ROLE);

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

	/** HANDLERS — Desktop MyProfile.tsx bilan bir xil mantiq **/

	const uploadPhotoHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const image = e.target.files?.[0];
			if (!image) return;

			const formData = new FormData();
			formData.append('operations', JSON.stringify({
				query: `mutation ImageUploader($file: Upload!, $target: String!) {
					imageUploader(file: $file, target: $target)
				}`,
				variables: { file: null, target: 'member' },
			}));
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
			setProfileData((prev: any) => ({ ...prev, memberImage: responseImage }));
		} catch (err) {
			console.log('Error, uploadPhotoHandler:', err);
			sweetMixinErrorAlert('Image upload failed').then();
		}
	};

	const uploadPortfolioHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const files = e.target.files;
			if (!files || files.length === 0) return;
			if (files.length > 5) throw new Error('Cannot upload more than 5 images!');

			const formData = new FormData();
			const fileVars: any[] = new Array(files.length).fill(null);
			formData.append('operations', JSON.stringify({
				query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
					imagesUploader(files: $files, target: $target)
				}`,
				variables: { files: fileVars, target: 'member' },
			}));
			const map: Record<string, string[]> = {};
			for (let i = 0; i < files.length; i++) map[i] = [`variables.files.${i}`];
			formData.append('map', JSON.stringify(map));
			for (let i = 0; i < files.length; i++) formData.append(`${i}`, files[i]);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImages: string[] = response.data.data.imagesUploader;
			setProfileData((prev: any) => ({
				...prev,
				memberPortfolio: [...(prev.memberPortfolio ?? []), ...responseImages],
			}));
		} catch (err: any) {
			console.log('Error, uploadPortfolioHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const removePortfolioImage = (index: number) => {
		setProfileData((prev: any) => ({
			...prev,
			memberPortfolio: (prev.memberPortfolio ?? []).filter((_: any, i: number) => i !== index),
		}));
	};

	const toggleSpecialty = (value: string) => {
		setProfileData((prev: any) => {
			const current = prev.memberSpecialty ?? [];
			const exists = current.includes(value);
			return { ...prev, memberSpecialty: exists ? current.filter((v: string) => v !== value) : [...current, value] };
		});
	};

	const updateProfileHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);

			const updateInput: any = {
				_id: user._id,
				memberFullName: profileData.memberFullName,
				memberPhone: profileData.memberPhone, // ⚠️ endi tahrirlanadi
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

			const result = await updateMember({ variables: { input: updateInput } });

			if (result.data.updateMember.accessToken) {
				setJwtToken(result.data.updateMember.accessToken);
			}
			userVar({ ...user, ...result.data.updateMember });
			await sweetMixinSuccessAlert(t('Profile updated successfully!'));
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const changePasswordHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!currentPassword || !newPassword || !confirmPassword) {
				throw new Error(Messages.error1);
			}
			if (newPassword !== confirmPassword) {
				throw new Error('New passwords do not match!');
			}

			const result = await updateMember({ variables: { input: { _id: user._id, memberPassword: newPassword } } });
			if (result.data?.updateMember?.accessToken) {
				setJwtToken(result.data.updateMember.accessToken);
			}
			setCurrentPassword('');
			setNewPassword('');
			setConfirmPassword('');
			setPwSectionOpen(false);
			await sweetMixinSuccessAlert(t('Password updated successfully!'));
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const requestAgentHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			const result = await requestAgentRole();
			// ⚠️ TUZATILDI: avval mutatsiya natijasi e'tiborga olinmasdi,
			// shuning uchun userVar (va demak, bu tugma ko'rinishi)
			// sahifa yangilanmaguncha ESKI holatda qolib ketardi
			if (result?.data?.requestAgentRole) {
				userVar({ ...user, agentRequestStatus: result.data.requestAgentRole.agentRequestStatus });
			}
			await sweetMixinSuccessAlert(t('Your request has been sent! Our team will review it soon.'));
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component="div" id="mobile-myprofile">
			{/* ═══ AVATAR ═══ */}
			<Stack alignItems="center" className="mpr-avatar-section">
				<Box component="div" className="mpr-avatar-wrap">
					<Box component="div" className="mpr-avatar" style={{ backgroundImage: `url(${imgUrl(profileData.memberImage)})` }} />
					<Box component="div" className="mpr-camera-btn" onClick={() => photoInputRef.current?.click()}>
						<CameraAltIcon sx={{ fontSize: 15 }} />
					</Box>
					<input ref={photoInputRef} type="file" hidden accept="image/jpg, image/jpeg, image/png" onChange={uploadPhotoHandler} />
				</Box>
				<Typography className="mpr-change-photo" onClick={() => photoInputRef.current?.click()}>{t('Change Photo')}</Typography>
			</Stack>

			{/* ═══ NAME / NICKNAME ═══ */}
			<Typography className="mpr-label">{t('Full Name')}</Typography>
			<OutlinedInput fullWidth className="mpr-input" value={profileData.memberFullName} onChange={(e) => setProfileData({ ...profileData, memberFullName: e.target.value })} />

			<Typography className="mpr-label">{t('Nickname')}</Typography>
			<OutlinedInput fullWidth className="mpr-input" value={profileData.memberNick} onChange={(e) => setProfileData({ ...profileData, memberNick: e.target.value })} />

			{/* ═══ PHONE — endi tahrirlanadi ═══ */}
			<Typography className="mpr-label">{t('Phone Number')}</Typography>
			<OutlinedInput fullWidth className="mpr-input" value={profileData.memberPhone} onChange={(e) => setProfileData({ ...profileData, memberPhone: e.target.value })} />

			<Typography className="mpr-label">{t('Address')}</Typography>
			<OutlinedInput fullWidth className="mpr-input" value={profileData.memberAddress} onChange={(e) => setProfileData({ ...profileData, memberAddress: e.target.value })} />

			<Typography className="mpr-label">{t('About Me / Bio')}</Typography>
			<textarea
				className="mpr-textarea"
				value={profileData.memberDesc}
				maxLength={200}
				onChange={(e) => setProfileData({ ...profileData, memberDesc: e.target.value })}
				rows={3}
				placeholder={t('Tell others about yourself...')}
			/>
			<Typography className="mpr-char-count">{(profileData.memberDesc ?? '').length}/200</Typography>

			{/* ═══ AGENT — Specialist Information ═══ */}
			{isAgent && (
				<Box component="div" className="mpr-agent-section">
					<Stack direction="row" alignItems="center" justifyContent="space-between" className="mpr-agent-header" onClick={() => setAgentSectionOpen(!agentSectionOpen)}>
						<Stack direction="row" alignItems="center" gap={1}>
							<Chip label={t('Agent')} size="small" className="mpr-agent-badge" />
							<Typography className="mpr-agent-title">{t('Specialist Information')}</Typography>
						</Stack>
						{agentSectionOpen ? <ExpandLessIcon sx={{ color: '#FF4D8D' }} /> : <ExpandMoreIcon sx={{ color: '#FF4D8D' }} />}
					</Stack>

					{agentSectionOpen && (
						<>
							<Typography className="mpr-label">{t('Years of Experience')}</Typography>
							<OutlinedInput
								fullWidth
								type="number"
								className="mpr-input"
								value={profileData.memberExperience === 0 ? '' : profileData.memberExperience}
								onFocus={(e: any) => e.target.select()}
								onChange={(e) => {
									const val = e.target.value;
									setProfileData({ ...profileData, memberExperience: val === '' ? 0 : parseInt(val) || 0 });
								}}
							/>

							<Typography className="mpr-label">{t('Specialty Tags')}</Typography>
							<Stack direction="row" flexWrap="wrap" gap={1} className="mpr-chip-row">
								{SPECIALTY_OPTIONS.map((opt) => (
									<Box
										key={opt}
										component="div"
										className={`mpr-chip ${(profileData.memberSpecialty ?? []).includes(opt) ? 'active' : ''}`}
										onClick={() => toggleSpecialty(opt)}
									>
										{t(SPECIALTY_LABEL[opt] ?? opt)}
									</Box>
								))}
							</Stack>

							<Typography className="mpr-label">{t('Portfolio Images')}</Typography>
							<Stack direction="row" flexWrap="wrap" gap={1.25} className="mpr-portfolio-row">
								{(profileData.memberPortfolio ?? []).map((img: string, idx: number) => (
									<Box component="div" key={idx} className="mpr-portfolio-thumb">
										<img src={imgUrl(img)} alt="" />
										<IconButton className="mpr-portfolio-remove" onClick={() => removePortfolioImage(idx)}>×</IconButton>
									</Box>
								))}
								<Box component="div" className="mpr-portfolio-add" onClick={() => portfolioInputRef.current?.click()}>
									<AddIcon sx={{ fontSize: 20, color: '#FF4D8D' }} />
								</Box>
								<input ref={portfolioInputRef} type="file" hidden multiple accept="image/jpg, image/jpeg, image/png" onChange={uploadPortfolioHandler} />
							</Stack>
						</>
					)}
				</Box>
			)}

			{/* ═══ Oddiy foydalanuvchi — Agent bo'lish so'rovi ═══ */}
			{!isAgent && user?.memberType !== MemberType.ADMIN && (
				<Box component="div" className="mpr-agent-request">
					{user?.agentRequestStatus === 'PENDING' ? (
						<Typography className="mpr-agent-pending">⏳ {t('Your agent application is under review.')}</Typography>
					) : user?.agentRequestStatus === 'REJECTED' ? (
						<Typography className="mpr-agent-rejected">{t('Your previous agent application was not approved.')}</Typography>
					) : (
						<Stack alignItems="center" gap={1}>
							<Typography className="mpr-agent-cta-title">{t('Want to list your salon?')}</Typography>
							<Typography className="mpr-agent-cta-desc">{t('Apply to become an agent and start managing your own salons.')}</Typography>
							<Box component="div" className="mpr-agent-cta-btn" onClick={requestAgentHandler}>{t('Become an Agent')}</Box>
						</Stack>
					)}
				</Box>
			)}

			<Box component="div" className="mpr-save-btn" onClick={updateProfileHandler}>
				{t('Save Changes')}
			</Box>

			{/* ═══ CHANGE PASSWORD — shu sahifaning o'zida ═══ */}
			<Stack direction="row" alignItems="center" justifyContent="space-between" className="mpr-pw-header" onClick={() => setPwSectionOpen(!pwSectionOpen)}>
				<Typography className="mpr-pw-title">{t('Change Password')}</Typography>
				{pwSectionOpen ? <ExpandLessIcon sx={{ color: '#FF4D8D' }} /> : <ExpandMoreIcon sx={{ color: '#FF4D8D' }} />}
			</Stack>

			{pwSectionOpen && (
				<>
					<Typography className="mpr-label">{t('Current Password')}</Typography>
					<OutlinedInput
						fullWidth
						className="mpr-input"
						type={showCurrentPw ? 'text' : 'password'}
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						endAdornment={
							<IconButton size="small" onClick={() => setShowCurrentPw(!showCurrentPw)}>
								{showCurrentPw ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
							</IconButton>
						}
					/>

					<Typography className="mpr-label">{t('New Password')}</Typography>
					<OutlinedInput
						fullWidth
						className="mpr-input"
						type={showNewPw ? 'text' : 'password'}
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						endAdornment={
							<IconButton size="small" onClick={() => setShowNewPw(!showNewPw)}>
								{showNewPw ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
							</IconButton>
						}
					/>

					<Typography className="mpr-label">{t('Confirm New Password')}</Typography>
					<OutlinedInput
						fullWidth
						className="mpr-input"
						type={showConfirmPw ? 'text' : 'password'}
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						endAdornment={
							<IconButton size="small" onClick={() => setShowConfirmPw(!showConfirmPw)}>
								{showConfirmPw ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
							</IconButton>
						}
					/>

					<Box component="div" className="mpr-save-btn secondary" onClick={changePasswordHandler}>
						{t('Update Password')}
					</Box>
				</>
			)}
		</Box>
	);
};

export default MobileMyProfile;