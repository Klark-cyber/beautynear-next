import React from 'react';
import { Stack, Box, Typography } from '@mui/material';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import { useTranslation } from 'next-i18next';

interface PaginationProps {
	page: number;
	limit: number;
	total: number;
	onChange: (page: number) => void;
}

const Pagination = ({ page, limit, total, onChange }: PaginationProps) => {
	const { t } = useTranslation('common');
	const totalPages = Math.ceil(total / limit);

	if (totalPages <= 1) return null;

	// Ko'rsatiladigan sahifa raqamlari
	const getPages = () => {
		const pages: (number | '...')[] = [];

		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (page > 3) pages.push('...');
			for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
				pages.push(i);
			}
			if (page < totalPages - 2) pages.push('...');
			pages.push(totalPages);
		}

		return pages;
	};

	const btnSx = (active: boolean, disabled?: boolean) => ({
		width: 36,
		height: 36,
		borderRadius: 2,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: disabled ? 'not-allowed' : 'pointer',
		fontFamily: 'Poppins, sans-serif',
		fontSize: 13,
		fontWeight: active ? 700 : 500,
		border: '1.5px solid',
		borderColor: active ? '#FF4D8D' : 'rgba(255,77,141,0.2)',
		background: active ? 'linear-gradient(135deg, #FF4D8D, #FF85B3)' : '#fff',
		color: active ? '#fff' : disabled ? '#ccc' : '#555',
		transition: 'all 0.2s',
		'&:hover': disabled || active ? {} : {
			borderColor: '#FF4D8D',
			color: '#FF4D8D',
			transform: 'translateY(-2px)',
			boxShadow: '0 4px 12px rgba(255,77,141,0.15)',
		},
	});

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="center"
			gap={0.75}
			sx={{ mt: 4, mb: 2 }}
		>
			{/* Prev */}
			<Box
				component="div"
				onClick={() => page > 1 && onChange(page - 1)}
				sx={btnSx(false, page === 1)}
			>
				<WestIcon sx={{ fontSize: 14 }} />
			</Box>

			{/* Pages */}
			{getPages().map((p, i) =>
				p === '...' ? (
					<Typography key={`dot-${i}`} sx={{ fontSize: 14, color: '#bbb', px: 0.5 }}>
						···
					</Typography>
				) : (
					<Box
						key={p}
						component="div"
						onClick={() => onChange(p as number)}
						sx={btnSx(p === page)}
					>
						{p}
					</Box>
				)
			)}

			{/* Next */}
			<Box
				component="div"
				onClick={() => page < totalPages && onChange(page + 1)}
				sx={btnSx(false, page === totalPages)}
			>
				<EastIcon sx={{ fontSize: 14 }} />
			</Box>
		</Stack>
	);
};

export default Pagination;