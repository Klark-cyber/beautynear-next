import React from 'react';
import { Stack, Box, Typography, Button, Modal } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useTranslation } from 'next-i18next';

interface ConfirmModalProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title?: string;
	desc?: string;
	confirmText?: string;
	cancelText?: string;
	type?: 'danger' | 'warning' | 'info';
	loading?: boolean;
}

const TYPE_CONFIG = {
	danger: {
		color: '#e53935',
		bg: 'rgba(229,57,53,0.08)',
		gradient: 'linear-gradient(135deg, #e53935, #ef5350)',
	},
	warning: {
		color: '#FF8F00',
		bg: 'rgba(255,143,0,0.08)',
		gradient: 'linear-gradient(135deg, #FF8F00, #FFB300)',
	},
	info: {
		color: '#FF4D8D',
		bg: 'rgba(255,77,141,0.08)',
		gradient: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
	},
};

const ConfirmModal = ({
	open,
	onClose,
	onConfirm,
	title,
	desc,
	confirmText,
	cancelText,
	type = 'danger',
	loading = false,
}: ConfirmModalProps) => {
	const { t } = useTranslation('common');
	const config = TYPE_CONFIG[type];

	return (
		<Modal
			open={open}
			onClose={onClose}
			sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
		>
			<Box
				component="div"
				sx={{
					width: 380,
					background: '#fff',
					borderRadius: 4,
					p: 3.5,
					boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
					outline: 'none',
					animation: 'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
					'@keyframes popIn': {
						'0%': { transform: 'scale(0.85)', opacity: 0 },
						'100%': { transform: 'scale(1)', opacity: 1 },
					},
				}}
			>
				{/* Icon */}
				<Stack alignItems="center" sx={{ mb: 2.5 }}>
					<Box
						component="div"
						sx={{
							width: 56,
							height: 56,
							borderRadius: '50%',
							background: config.bg,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							mb: 2,
						}}
					>
						<WarningAmberRoundedIcon sx={{ fontSize: 28, color: config.color }} />
					</Box>

					<Typography sx={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', mb: 0.75, textAlign: 'center' }}>
						{title ?? t('Are you sure?')}
					</Typography>

					<Typography sx={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
						{desc ?? t('This action cannot be undone.')}
					</Typography>
				</Stack>

				{/* Buttons */}
				<Stack direction="row" gap={1.5}>
					<Button
						fullWidth
						onClick={onClose}
						disabled={loading}
						sx={{
							py: 1.25,
							borderRadius: 2.5,
							border: '1.5px solid rgba(0,0,0,0.12)',
							color: '#555',
							fontWeight: 600,
							fontSize: 14,
							transition: 'all 0.2s',
							'&:hover': { background: '#f5f5f5', borderColor: '#999' },
						}}
					>
						{cancelText ?? t('Cancel')}
					</Button>

					<Button
						fullWidth
						onClick={onConfirm}
						disabled={loading}
						sx={{
							py: 1.25,
							borderRadius: 2.5,
							background: config.gradient,
							color: '#fff',
							fontWeight: 700,
							fontSize: 14,
							boxShadow: `0 4px 16px ${config.color}40`,
							transition: 'all 0.25s',
							'&:hover': {
								transform: 'translateY(-2px)',
								boxShadow: `0 8px 24px ${config.color}60`,
							},
							'&:disabled': { background: '#eee', color: '#bbb', boxShadow: 'none' },
						}}
					>
						{loading ? '...' : (confirmText ?? t('Confirm'))}
					</Button>
				</Stack>
			</Box>
		</Modal>
	);
};

export default ConfirmModal;