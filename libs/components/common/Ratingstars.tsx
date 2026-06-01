import React, { useState } from 'react';
import { Stack, Box, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';

interface RatingStarsProps {
	rating: number;          // 0-5 qiymat
	count?: number;          // nechta review
	size?: 'small' | 'medium' | 'large';
	interactive?: boolean;   // bosilsa qiymat o'zgaradimi
	onChange?: (value: number) => void;
	showNumber?: boolean;    // raqam ko'rsatilsinmi
}

const SIZES = {
	small: { star: 14, text: 11 },
	medium: { star: 18, text: 13 },
	large: { star: 24, text: 15 },
};

const RatingStars = ({
	rating,
	count,
	size = 'medium',
	interactive = false,
	onChange,
	showNumber = true,
}: RatingStarsProps) => {
	const [hovered, setHovered] = useState<number | null>(null);
	const { star, text } = SIZES[size];
	const display = hovered ?? rating;

	const renderStar = (index: number) => {
		const filled = display >= index + 1;
		const half = !filled && display >= index + 0.5;

		const StarComp = filled ? StarIcon : half ? StarHalfIcon : StarBorderIcon;

		return (
			<Box
				key={index}
				component="div"
				onMouseEnter={() => interactive && setHovered(index + 1)}
				onMouseLeave={() => interactive && setHovered(null)}
				onClick={() => interactive && onChange?.(index + 1)}
				sx={{
					cursor: interactive ? 'pointer' : 'default',
					display: 'flex',
					transition: 'transform 0.15s',
					'&:hover': interactive ? { transform: 'scale(1.2)' } : {},
				}}
			>
				<StarComp
					sx={{
						fontSize: star,
						color: filled || half ? '#FFB800' : '#ddd',
						transition: 'color 0.15s',
					}}
				/>
			</Box>
		);
	};

	return (
		<Stack direction="row" alignItems="center" gap={0.5}>
			<Stack direction="row" alignItems="center">
				{[0, 1, 2, 3, 4].map(renderStar)}
			</Stack>

			{showNumber && rating > 0 && (
				<Typography sx={{ fontSize: text, fontWeight: 600, color: '#333' }}>
					{rating.toFixed(1)}
				</Typography>
			)}

			{count !== undefined && (
				<Typography sx={{ fontSize: text - 1, color: '#aaa' }}>
					({count})
				</Typography>
			)}
		</Stack>
	);
};

export default RatingStars;