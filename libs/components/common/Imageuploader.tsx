import React, { useRef, useState } from 'react';
import { Stack, Box, Typography, IconButton, CircularProgress } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'next-i18next';
import { useMutation } from '@apollo/client';
import { IMAGE_UPLOADER, IMAGES_UPLOADER } from '../../../apollo/user/mutation';
import { REACT_APP_API_URL } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';

interface ImageUploaderProps {
	value?: string;             // single image: hozirgi URL
	values?: string[];          // multiple images: hozirgi URLlar
	multiple?: boolean;
	target: string;             // 'member' | 'salon' | 'service'
	onChange?: (url: string) => void;
	onChangeMultiple?: (urls: string[]) => void;
	maxImages?: number;
}

const ImageUploader = ({
	value,
	values = [],
	multiple = false,
	target,
	onChange,
	onChangeMultiple,
	maxImages = 5,
}: ImageUploaderProps) => {
	const { t } = useTranslation('common');
	const inputRef = useRef<HTMLInputElement>(null);
	const [loading, setLoading] = useState(false);
	const [dragOver, setDragOver] = useState(false);

	const [imageUploader] = useMutation(IMAGE_UPLOADER);
	const [imagesUploader] = useMutation(IMAGES_UPLOADER);

	const uploadSingle = async (file: File) => {
		try {
			setLoading(true);
			const { data } = await imageUploader({
				variables: { file, target },
			});
			onChange?.(data.imageUploader);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message);
		} finally {
			setLoading(false);
		}
	};

	const uploadMultiple = async (files: FileList) => {
		try {
			setLoading(true);
			const { data } = await imagesUploader({
				variables: { files: Array.from(files), target },
			});
			const newUrls = [...values, ...data.imagesUploader].slice(0, maxImages);
			onChangeMultiple?.(newUrls);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;
		if (multiple) {
			uploadMultiple(files);
		} else {
			uploadSingle(files[0]);
		}
		e.target.value = '';
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		const files = e.dataTransfer.files;
		if (!files) return;
		if (multiple) uploadMultiple(files);
		else uploadSingle(files[0]);
	};

	const removeImage = (index: number) => {
		const newUrls = values.filter((_, i) => i !== index);
		onChangeMultiple?.(newUrls);
	};

	// ── SINGLE ─────────────────────────────────────────────────────────────────
	if (!multiple) {
		return (
			<Box
				component="div"
				onClick={() => !loading && inputRef.current?.click()}
				onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
				onDragLeave={() => setDragOver(false)}
				onDrop={handleDrop}
				sx={{
					width: 120,
					height: 120,
					borderRadius: 3,
					border: '2px dashed',
					borderColor: dragOver ? '#FF4D8D' : 'rgba(255,77,141,0.3)',
					background: dragOver ? 'rgba(255,77,141,0.06)' : value ? 'transparent' : '#fff8fb',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					cursor: 'pointer',
					overflow: 'hidden',
					position: 'relative',
					transition: 'all 0.2s',
					'&:hover': { borderColor: '#FF4D8D', background: 'rgba(255,77,141,0.04)' },
				}}
			>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					style={{ display: 'none' }}
					onChange={handleFileChange}
				/>

				{loading ? (
					<CircularProgress size={24} sx={{ color: '#FF4D8D' }} />
				) : value ? (
					<img
						src={`${REACT_APP_API_URL}/${value}`}
						alt=""
						style={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
				) : (
					<Stack alignItems="center" gap={0.5}>
						<AddPhotoAlternateOutlinedIcon sx={{ fontSize: 28, color: '#FF85B3' }} />
						<Typography sx={{ fontSize: 10, color: '#bbb', textAlign: 'center' }}>
							{t('Upload')}
						</Typography>
					</Stack>
				)}
			</Box>
		);
	}

	// ── MULTIPLE ───────────────────────────────────────────────────────────────
	return (
		<Stack direction="row" flexWrap="wrap" gap={1.5}>
			{/* Existing images */}
			{values.map((url, i) => (
				<Box
					key={i}
					component="div"
					sx={{
						width: 100,
						height: 100,
						borderRadius: 2.5,
						overflow: 'hidden',
						position: 'relative',
						border: '1px solid rgba(255,77,141,0.15)',
						'&:hover .remove-btn': { opacity: 1 },
					}}
				>
					<img
						src={`${REACT_APP_API_URL}/${url}`}
						alt=""
						style={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
					<IconButton
						className="remove-btn"
						onClick={() => removeImage(i)}
						sx={{
							position: 'absolute',
							top: 2,
							right: 2,
							width: 22,
							height: 22,
							background: 'rgba(229,57,53,0.9)',
							opacity: 0,
							transition: 'opacity 0.2s',
							'&:hover': { background: '#e53935' },
						}}
					>
						<CloseIcon sx={{ fontSize: 12, color: '#fff' }} />
					</IconButton>
				</Box>
			))}

			{/* Upload button */}
			{values.length < maxImages && (
				<Box
					component="div"
					onClick={() => !loading && inputRef.current?.click()}
					onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
					sx={{
						width: 100,
						height: 100,
						borderRadius: 2.5,
						border: '2px dashed',
						borderColor: dragOver ? '#FF4D8D' : 'rgba(255,77,141,0.3)',
						background: dragOver ? 'rgba(255,77,141,0.06)' : '#fff8fb',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						gap: 0.5,
						transition: 'all 0.2s',
						'&:hover': { borderColor: '#FF4D8D', background: 'rgba(255,77,141,0.04)' },
					}}
				>
					<input
						ref={inputRef}
						type="file"
						accept="image/*"
						multiple
						style={{ display: 'none' }}
						onChange={handleFileChange}
					/>

					{loading ? (
						<CircularProgress size={20} sx={{ color: '#FF4D8D' }} />
					) : (
						<>
							<AddPhotoAlternateOutlinedIcon sx={{ fontSize: 24, color: '#FF85B3' }} />
							<Typography sx={{ fontSize: 10, color: '#bbb' }}>
								{values.length}/{maxImages}
							</Typography>
						</>
					)}
				</Box>
			)}
		</Stack>
	);
};

export default ImageUploader;