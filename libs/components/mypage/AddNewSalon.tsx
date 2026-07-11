import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, Button, Select, MenuItem, IconButton } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InstagramIcon from '@mui/icons-material/Instagram';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { CREATE_SALON, UPDATE_SALON } from '../../../apollo/user/mutation';
import { GET_SALON } from '../../../apollo/user/query';
import { SalonInput } from '../../types/salon/salon.input';
import { SalonLocation, SalonType } from '../../enums/salon.enum';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const TYPE_EMOJI: Record<string, string> = {
	HAIR: '✂️',
	NAIL: '💅',
	SKIN: '🧴',
	CLINIC: '💉',
	MASSAGE: '🪷',
};

const imgUrl = (raw?: string): string => {
	if (!raw) return '';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const AddNewSalon: NextPage = ({
	initialValues = {
		salonTitle: '',
		salonType: SalonType.HAIR,
		salonLocation: SalonLocation.SEOUL,
		salonAddress: '',
		salonPhone: '',
		salonWorkHours: '',
		salonInstagram: '',
		salonDesc: '',
		salonImages: [],
	},
	...props
}: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const token = getJwtToken();
	const inputRef = useRef<HTMLInputElement>(null);

	const salonId = router.query.salonId as string | undefined;
	const isEditMode = Boolean(salonId);

	const [insertSalonData, setInsertSalonData] = useState<SalonInput>(initialValues);

	/** APOLLO REQUESTS **/
	const [createSalon] = useMutation(CREATE_SALON);
	const [updateSalon] = useMutation(UPDATE_SALON);

	const { data: getSalonData } = useQuery(GET_SALON, {
		fetchPolicy: 'network-only',
		variables: { input: salonId },
		skip: !isEditMode,
		onCompleted: (data) => {
			const salon = data?.getSalon;
			if (!salon) return;
			setInsertSalonData({
				salonTitle: salon.salonTitle ?? '',
				salonType: salon.salonType ?? SalonType.HAIR,
				salonLocation: salon.salonLocation ?? SalonLocation.SEOUL,
				salonAddress: salon.salonAddress ?? '',
				salonPhone: salon.salonPhone ?? '',
				salonWorkHours: salon.salonWorkHours ?? '',
				salonInstagram: salon.salonInstagram ?? '',
				salonDesc: salon.salonDesc ?? '',
				salonImages: salon.salonImages ?? [],
			});
		},
	});

	/** HANDLERS **/
	const uploadImagesHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const files = e.target.files;
			if (!files || files.length === 0) return;
			const existing = insertSalonData.salonImages.length;
			if (existing + files.length > 5) throw new Error('Cannot upload more than 5 images!');

			const formData = new FormData();
			const fileVars: any[] = new Array(files.length).fill(null);
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) {
						imagesUploader(files: $files, target: $target)
					}`,
					variables: { files: fileVars, target: 'salon' },
				}),
			);
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
			setInsertSalonData((prev) => ({ ...prev, salonImages: [...prev.salonImages, ...responseImages] }));
		} catch (err: any) {
			console.log('Error, uploadImagesHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const removeImageHandler = (index: number) => {
		setInsertSalonData((prev) => ({
			...prev,
			salonImages: prev.salonImages.filter((_, i) => i !== index),
		}));
	};

	const doDisabledCheck = () => {
		return (
			insertSalonData.salonTitle === '' ||
			insertSalonData.salonAddress === '' ||
			insertSalonData.salonPhone === '' ||
			insertSalonData.salonWorkHours === '' ||
			insertSalonData.salonImages.length === 0
		);
	};

	const insertSalonHandler = useCallback(async () => {
		try {
			await createSalon({ variables: { input: insertSalonData } });
			await sweetMixinSuccessAlert('This salon has been created successfully.');
			await router.push({ pathname: '/mypage', query: { category: 'mySalons' } });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [insertSalonData]);

	const updateSalonHandler = useCallback(async () => {
		try {
			await updateSalon({ variables: { input: { _id: salonId, ...insertSalonData } } });
			await sweetMixinSuccessAlert('This salon has been updated successfully.');
			await router.push({ pathname: '/mypage', query: { category: 'mySalons' } });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [insertSalonData, salonId]);

	return (
		<Box component="div" className="mypage-content">
			{/* Sarlavha */}
			<Typography className="content-title">{t(isEditMode ? 'Edit Salon' : 'Add New Salon')}</Typography>
			<Typography className="content-subtitle">{t('Fill in the details to list your salon')}</Typography>

			{/* Umumiy forma-karta */}
			<Box component="div" className="salon-form-card">
				{/* ═══ A — Basic Info ═══ */}
				<Stack direction="row" alignItems="center" gap={1.25} className="form-section-title">
					<Box component="div" className="section-badge">A</Box>
					<Typography className="section-title-text">{t('Basic Info')}</Typography>
				</Stack>

				<Stack className="form-group full">
					<Typography className="form-label">{t('Salon Name')}</Typography>
					<input
						type="text"
						className="form-input"
						placeholder={t('e.g. Glow Skin Lab')}
						value={insertSalonData.salonTitle}
						onChange={(e) => setInsertSalonData({ ...insertSalonData, salonTitle: e.target.value })}
					/>
				</Stack>

				<Stack direction="row" gap={2.5} className="form-row">
					<Stack className="form-group">
						<Typography className="form-label">{t('Salon Type')}</Typography>
						<Select
							fullWidth
							className="form-select"
							value={insertSalonData.salonType}
							onChange={(e) => setInsertSalonData({ ...insertSalonData, salonType: e.target.value as SalonType })}
						>
							{Object.values(SalonType).map((type) => (
								<MenuItem key={type} value={type}>
									{TYPE_EMOJI[type]} {t(type)}
								</MenuItem>
							))}
						</Select>
					</Stack>
					<Stack className="form-group">
						<Typography className="form-label">{t('Region')}</Typography>
						<Select
							fullWidth
							className="form-select"
							value={insertSalonData.salonLocation}
							onChange={(e) => setInsertSalonData({ ...insertSalonData, salonLocation: e.target.value as SalonLocation })}
						>
							{Object.values(SalonLocation)
								.filter((loc) => loc !== SalonLocation.ALL)
								.map((loc) => (
									<MenuItem key={loc} value={loc}>
										{t(loc)}
									</MenuItem>
								))}
						</Select>
					</Stack>
				</Stack>

				<Stack className="form-group full">
					<Typography className="form-label">{t('Full Address')}</Typography>
					<input
						type="text"
						className="form-input"
						placeholder={t('e.g. 123 Gangnam-daero, Gangnam-gu, Seoul')}
						value={insertSalonData.salonAddress}
						onChange={(e) => setInsertSalonData({ ...insertSalonData, salonAddress: e.target.value })}
					/>
				</Stack>

				<Box component="div" className="section-divider" />

				{/* ═══ B — Contact & Hours ═══ */}
				<Stack direction="row" alignItems="center" gap={1.25} className="form-section-title">
					<Box component="div" className="section-badge">B</Box>
					<Typography className="section-title-text">{t('Contact & Hours')}</Typography>
				</Stack>

				<Stack direction="row" gap={2.5} className="form-row">
					<Stack className="form-group">
						<Typography className="form-label">{t('Phone Number')}</Typography>
						<Stack direction="row" alignItems="center" className="form-input-icon">
							<PhoneOutlinedIcon sx={{ fontSize: 18, color: '#999' }} />
							<input
								type="text"
								placeholder="010-1234-5678"
								value={insertSalonData.salonPhone}
								onChange={(e) => setInsertSalonData({ ...insertSalonData, salonPhone: e.target.value })}
							/>
						</Stack>
					</Stack>
					<Stack className="form-group">
						<Typography className="form-label">{t('Working Hours')}</Typography>
						<Stack direction="row" alignItems="center" className="form-input-icon">
							<AccessTimeIcon sx={{ fontSize: 18, color: '#999' }} />
							<input
								type="text"
								placeholder="09:00-21:00"
								value={insertSalonData.salonWorkHours}
								onChange={(e) => setInsertSalonData({ ...insertSalonData, salonWorkHours: e.target.value })}
							/>
						</Stack>
					</Stack>
				</Stack>

				<Stack className="form-group full">
					<Typography className="form-label">
						{t('Instagram Handle')} <Box component="span" className="optional-tag">({t('optional')})</Box>
					</Typography>
					<Stack direction="row" alignItems="center" className="form-input-icon">
						<InstagramIcon sx={{ fontSize: 18, color: '#999' }} />
						<input
							type="text"
							placeholder="@yoursalon"
							value={insertSalonData.salonInstagram}
							onChange={(e) => setInsertSalonData({ ...insertSalonData, salonInstagram: e.target.value })}
						/>
					</Stack>
				</Stack>

				<Box component="div" className="section-divider" />

				{/* ═══ C — Description ═══ */}
				<Stack direction="row" alignItems="center" gap={1.25} className="form-section-title">
					<Box component="div" className="section-badge">C</Box>
					<Typography className="section-title-text">{t('Description')}</Typography>
				</Stack>

				<Stack className="form-group full">
					<Typography className="form-label">{t('About This Salon')}</Typography>
					<textarea
						className="form-textarea"
						placeholder={t("Describe your salon's atmosphere, specialties, and what makes it unique...")}
						value={insertSalonData.salonDesc}
						onChange={(e) => setInsertSalonData({ ...insertSalonData, salonDesc: e.target.value })}
					/>
				</Stack>

				<Box component="div" className="section-divider" />

				{/* ═══ D — Photos ═══ */}
				<Stack direction="row" alignItems="center" gap={1.25} className="form-section-title">
					<Box component="div" className="section-badge">D</Box>
					<Typography className="section-title-text">{t('Photos')}</Typography>
				</Stack>
				<Typography className="form-hint">{t('Upload up to 5 photos (JPG, JPEG, PNG)')}</Typography>

				<Box component="div" className="upload-dropzone" onClick={() => inputRef.current?.click()}>
					<CloudUploadOutlinedIcon sx={{ fontSize: 44, color: '#FF4D8D' }} />
					<Typography className="dropzone-title">{t('Drag and drop images here')}</Typography>
					<Button className="browse-files-btn">{t('Browse Files')}</Button>
					<input
						ref={inputRef}
						type="file"
						hidden
						multiple
						accept="image/jpg, image/jpeg, image/png"
						onChange={uploadImagesHandler}
					/>
				</Box>

				{insertSalonData.salonImages.length > 0 && (
					<Stack direction="row" flexWrap="wrap" gap={1.5} className="uploaded-images-row">
						{insertSalonData.salonImages.map((img, idx) => (
							<Box component="div" key={idx} className="uploaded-thumb">
								<img src={imgUrl(img)} alt="" />
								<IconButton className="thumb-remove-btn" onClick={() => removeImageHandler(idx)}>
									<CloseIcon sx={{ fontSize: 14 }} />
								</IconButton>
							</Box>
						))}
					</Stack>
				)}

				{/* Save/Update tugmasi */}
				<Stack direction="row" justifyContent="flex-end" className="form-submit-row">
					{isEditMode ? (
						<Button className="save-salon-btn" disabled={doDisabledCheck()} onClick={updateSalonHandler}>
							{t('Update Salon')}
						</Button>
					) : (
						<Button className="save-salon-btn" disabled={doDisabledCheck()} onClick={insertSalonHandler}>
							{t('Save Salon')}
						</Button>
					)}
				</Stack>
			</Box>
		</Box>
	);
};

export default AddNewSalon;

AddNewSalon.defaultProps = {
	initialValues: {
		salonTitle: '',
		salonType: SalonType.HAIR,
		salonLocation: SalonLocation.SEOUL,
		salonAddress: '',
		salonPhone: '',
		salonWorkHours: '',
		salonInstagram: '',
		salonDesc: '',
		salonImages: [],
	},
};