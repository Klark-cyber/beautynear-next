import React from 'react';
import { Stack, Box, Typography, Button, IconButton, Chip } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StarIcon from '@mui/icons-material/Star';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { Salon } from '../../types/salon/salon';
import { REACT_APP_API_URL, topSalonRank } from '../../config';
import { userVar } from '../../../apollo/store';
import { isSalonOpen } from '../../utils';
import { SalonType } from '../../enums/salon.enum';

// SalonType emoji map
const TYPE_EMOJI: Record<SalonType, string> = {
	[SalonType.HAIR]: '✂️',
	[SalonType.NAIL]: '💅',
	[SalonType.SKIN]: '🧴',
	[SalonType.CLINIC]: '💉',
	[SalonType.MASSAGE]: '🪷',
};

interface SalonCardProps {
	salon: Salon;
	mode?: 'compact' | 'full'; // compact=homepage, full=/salons page
	onLike?: (id: string) => void;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

const SalonCard = ({ salon, mode = 'full', onLike, myFavorites, recentlyVisited }: SalonCardProps) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);

	const img = salon.salonImages?.[0]
		? `${REACT_APP_API_URL}/${salon.salonImages[0]}`
		: '/img/banner/default.jpg';

	const isOpen = isSalonOpen(salon.salonWorkHours);
	const isTop = salon.salonRank >= topSalonRank;
	const liked = myFavorites || salon.meLiked?.[0]?.myFavorite;

	const goDetail = () => router.push(`/salons/${salon._id}`);

	return (
		<Stack className={`salon-card ${mode}`}>
			{/* ── IMAGE ──────────────────────────────────────────── */}
			<Box component="div" className="salon-card-img" onClick={goDetail}
				style={{ backgroundImage: `url(${img})` }}>

				{/* Open/Close badge */}
				<Box component="div" className={`open-badge ${isOpen ? 'open' : 'closed'}`}>
					{isOpen ? t('Open') : t('Closed')}
				</Box>

				{/* TOP badge */}
				{isTop && (
					<Box component="div" className="top-badge">
						⚡ TOP
					</Box>
				)}

				{/* Like button */}
				{!recentlyVisited && (
					<IconButton
						className={`like-btn ${liked ? 'liked' : ''}`}
						onClick={(e) => { e.stopPropagation(); onLike?.(salon._id); }}
					>
						{liked
							? <FavoriteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />
							: <FavoriteBorderIcon sx={{ fontSize: 16, color: '#666' }} />
						}
					</IconButton>
				)}

				{/* Full mode: views overlay */}
				{mode === 'full' && (
					<Stack direction="row" alignItems="center" gap={0.5} className="views-overlay">
						<RemoveRedEyeIcon sx={{ fontSize: 13 }} />
						<Typography sx={{ fontSize: 12 }}>
							{salon.salonViews >= 1000
								? `${(salon.salonViews / 1000).toFixed(1)}K`
								: salon.salonViews}
						</Typography>
					</Stack>
				)}
			</Box>

			{/* ── INFO ───────────────────────────────────────────── */}
			<Box component="div" className="salon-card-info">
				{/* Name + Rating */}
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start" className="name-rating">
					<Typography className="salon-name" onClick={goDetail}>
						{salon.salonTitle}
					</Typography>
					<Stack direction="row" alignItems="center" gap={0.25} className="rating">
						<StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
						<Typography sx={{ fontSize: 12, fontWeight: 600, color: '#333' }}>4.9</Typography>
					</Stack>
				</Stack>

				{/* Address */}
				<Stack direction="row" alignItems="center" gap={0.5} className="address-row">
					<LocationOnOutlinedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
					<Typography className="address-text">{salon.salonAddress}</Typography>
				</Stack>

				{/* Full mode: specialist name */}
				{mode === 'full' && salon.memberData && (
					<Stack direction="row" alignItems="center" gap={0.5} className="specialist-row">
						<PersonOutlineIcon sx={{ fontSize: 13, color: '#888' }} />
						<Typography className="specialist-text">
							{t('By')}: {salon.memberData.memberNick}
						</Typography>
					</Stack>
				)}

				{/* Full mode: type tags */}
				{mode === 'full' && (
					<Stack direction="row" flexWrap="wrap" gap={0.5} className="type-tags">
						<Chip
							label={`${TYPE_EMOJI[salon.salonType]} ${t(salon.salonType)}`}
							size="small"
							className="type-chip"
						/>
					</Stack>
				)}

				{/* Price + stats */}
				<Stack direction="row" alignItems="center" justifyContent="space-between" className="price-stats">
					<Typography className="price">
						₩{(salon as any).minPrice?.toLocaleString() ?? '30,000'}~
					</Typography>

					{/* Full mode: likes + views */}
					{mode === 'full' && !recentlyVisited && (
						<Stack direction="row" alignItems="center" gap={1.5} className="stats">
							<Stack direction="row" alignItems="center" gap={0.25}>
								<FavoriteBorderIcon sx={{ fontSize: 13, color: '#999' }} />
								<Typography sx={{ fontSize: 12, color: '#999' }}>{salon.salonLikes}</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" gap={0.25}>
								<RemoveRedEyeIcon sx={{ fontSize: 13, color: '#999' }} />
								<Typography sx={{ fontSize: 12, color: '#999' }}>
									{salon.salonViews >= 1000
										? `${(salon.salonViews / 1000).toFixed(1)}K`
										: salon.salonViews}
								</Typography>
							</Stack>
						</Stack>
					)}
				</Stack>

				{/* Deposit */}
				<Stack direction="row" alignItems="center" gap={0.5} className="deposit-row">
					<ShieldOutlinedIcon sx={{ fontSize: 12, color: '#FF85B3' }} />
					<Typography className="deposit-text">
						{t('Deposit')}: ₩{salon.depositAmount?.toLocaleString()}
					</Typography>
				</Stack>

				{/* Book Now button */}
				<Button fullWidth className="book-btn" onClick={goDetail}>
					{t('Book Now')}
				</Button>
			</Box>
		</Stack>
	);
};

export default SalonCard;