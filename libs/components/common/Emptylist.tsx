import React from 'react';
import { Stack, Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

interface EmptyListProps {
	title?: string;
	desc?: string;
	buttonText?: string;
	buttonHref?: string;
	onButtonClick?: () => void; // ⚠️ YANGI — oddiy navigatsiya emas, maxsus handler (masalan to'liq reset) uchun
	emoji?: string;
}

const EmptyList = ({
	title,
	desc,
	buttonText,
	buttonHref,
	onButtonClick,
	emoji = '🔍',
}: EmptyListProps) => {
	const { t } = useTranslation('common');
	const router = useRouter();

	return (
		<Stack
			alignItems="center"
			justifyContent="center"
			sx={{
				py: 8,
				px: 4,
				width: '100%',
				animation: 'fadeIn 0.3s ease',
				'@keyframes fadeIn': {
					'0%': { opacity: 0, transform: 'translateY(8px)' },
					'100%': { opacity: 1, transform: 'translateY(0)' },
				},
			}}
		>
			{/* Emoji */}
			<Box
				component="div"
				sx={{
					width: 80,
					height: 80,
					borderRadius: '50%',
					background: 'rgba(255,77,141,0.08)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 36,
					mb: 2.5,
					animation: 'float 3s ease-in-out infinite',
					'@keyframes float': {
						'0%,100%': { transform: 'translateY(0)' },
						'50%': { transform: 'translateY(-8px)' },
					},
				}}
			>
				{emoji}
			</Box>

			<Typography
				sx={{
					fontSize: 18,
					fontWeight: 700,
					color: '#1a1a1a',
					mb: 0.75,
					textAlign: 'center',
				}}
			>
				{title ?? t('No results found')}
			</Typography>

			<Typography
				sx={{
					fontSize: 14,
					color: '#888',
					textAlign: 'center',
					maxWidth: 320,
					lineHeight: 1.6,
					mb: buttonText ? 3 : 0,
				}}
			>
				{desc ?? t('Try adjusting your search or filters')}
			</Typography>

			{buttonText && (buttonHref || onButtonClick) && (
				<Button
					onClick={() => (onButtonClick ? onButtonClick() : router.push(buttonHref!))}
					sx={{
						px: 3,
						py: 1.25,
						background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
						color: '#fff',
						borderRadius: 2.5,
						fontWeight: 700,
						fontSize: 14,
						boxShadow: '0 4px 16px rgba(255,77,141,0.3)',
						transition: 'all 0.25s',
						'&:hover': {
							transform: 'translateY(-2px)',
							boxShadow: '0 8px 24px rgba(255,77,141,0.4)',
						},
					}}
				>
					{t(buttonText)}
				</Button>
			)}
		</Stack>
	);
};

export default EmptyList;