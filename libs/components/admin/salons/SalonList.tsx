import React from 'react';
import Link from 'next/link';
import { Menu, MenuItem, Chip, IconButton, Stack, Typography, Box } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Salon } from '../../../types/salon/salon';
import { REACT_APP_API_URL } from '../../../config';
import { SalonStatus } from '../../../enums/salon.enum';
import { sweetMixinErrorAlert } from '../../../sweetAlert';

interface SalonListProps {
	salons: Salon[];
	anchorEl: any[];
	menuIconClickHandler: (e: any, index: number) => void;
	menuIconCloseHandler: () => void;
	updateSalonHandler: (data: { _id: string; salonStatus: SalonStatus }) => void;
	removeSalonHandler: (id: string) => void;
}

const TYPE_EMOJI: Record<string, string> = {
	HAIR: '✂️',
	NAIL: '💅',
	SKIN: '🧴',
	CLINIC: '💉',
	MASSAGE: '🪷',
};

const STATUS_COLOR: Record<string, string> = {
	ACTIVE: 'active',
	PAUSE: 'paused',
	INACTIVE: 'inactive',
	DELETE: 'deleted',
};

const imgUrl = (raw?: string): string => {
	if (!raw) return '/img/banner/hero.jpg';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const SalonList = (props: SalonListProps) => {
	const { salons, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateSalonHandler, removeSalonHandler } = props;

	return (
		<Stack className="admin-member-table">
			{/* Sarlavha qatori */}
			<Stack direction="row" alignItems="center" className="admin-table-head">
				<Typography className="th" sx={{ flex: '0 0 280px' }}>Salon</Typography>
				<Typography className="th" sx={{ flex: '0 0 100px' }}>Type</Typography>
				<Typography className="th" sx={{ flex: '0 0 110px' }} align="center">Views</Typography>
				<Typography className="th" sx={{ flex: '0 0 110px' }} align="center">Likes</Typography>
				<Typography className="th" sx={{ flex: '0 0 130px' }} align="center">Owner</Typography>
				<Typography className="th" sx={{ flex: '0 0 140px' }} align="center">Status</Typography>
				<Typography className="th" sx={{ flex: '0 0 60px' }} align="center">-</Typography>
			</Stack>

			{salons.length === 0 && (
				<Stack alignItems="center" className="admin-no-data">
					<Typography>No salons found</Typography>
				</Stack>
			)}

			{salons.map((salon, index) => (
				<Stack key={salon._id} direction="row" alignItems="center" className="admin-table-row">
					{/* Salon */}
					<Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: '0 0 280px' }}>
						<Link href={`/salons/${salon._id}`}>
							<Box
								component="div"
								sx={{
									width: 46, height: 46, borderRadius: 2, cursor: 'pointer',
									backgroundImage: `url(${imgUrl(salon.salonImages?.[0])})`,
									backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0,
								}}
							/>
						</Link>
						<Box component="div" sx={{ minWidth: 0 }}>
							<Link href={`/salons/${salon._id}`}>
								<Typography className="member-nick" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
									{salon.salonTitle}
								</Typography>
							</Link>
							<Stack direction="row" alignItems="center" gap={0.4} sx={{ minWidth: 0 }}>
								<LocationOnIcon sx={{ fontSize: 12, color: '#FF4D8D', flexShrink: 0 }} />
								<Typography className="member-fullname" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
									{salon.salonAddress}
								</Typography>
							</Stack>
						</Box>
					</Stack>

					{/* Type */}
					<Box sx={{ flex: '0 0 100px' }}>
						<Chip label={`${TYPE_EMOJI[salon.salonType]} ${salon.salonType}`} size="small" className="admin-chip type-agent" />
					</Box>

					{/* Views */}
					<Stack direction="row" alignItems="center" justifyContent="center" gap={0.4} sx={{ flex: '0 0 110px' }}>
						<RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
						<Typography className="td">{salon.salonViews ?? 0}</Typography>
					</Stack>

					{/* Likes */}
					<Stack direction="row" alignItems="center" justifyContent="center" gap={0.4} sx={{ flex: '0 0 110px' }}>
						<FavoriteIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
						<Typography className="td">{salon.salonLikes ?? 0}</Typography>
					</Stack>

					{/* Owner */}
					<Typography className="td" sx={{ flex: '0 0 130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} align="center">
						{salon.memberData?.memberNick ?? '-'}
					</Typography>

					{/* Status */}
					<Box sx={{ flex: '0 0 140px', textAlign: 'center' }}>
						<Chip
							label={salon.salonStatus}
							size="small"
							className={`admin-chip status-${STATUS_COLOR[salon.salonStatus]}`}
							onClick={(e) => {
								// ⚠️ TUZATILDI: DELETE holatidagi salonning statusini
								// o'zgartirib bo'lmaydi — buning o'rniga ogohlantirish
								if (salon.salonStatus === SalonStatus.DELETE) {
									sweetMixinErrorAlert('Cannot change status of a deleted salon. Use the delete icon to remove it permanently.');
									return;
								}
								menuIconClickHandler(e, index);
							}}
						/>
						<Menu
							anchorEl={anchorEl[index]}
							open={Boolean(anchorEl[index])}
							onClose={menuIconCloseHandler}
							PaperProps={{ sx: { borderRadius: 2, mt: 0.5 } }}
						>
							{Object.values(SalonStatus)
								.filter((v) => v !== salon.salonStatus)
								.map((status) => (
									<MenuItem key={status} onClick={() => updateSalonHandler({ _id: salon._id, salonStatus: status })}>
										{status}
									</MenuItem>
								))}
						</Menu>
					</Box>

					{/* Delete — faqat DELETE holatidagilar uchun butunlay ochirish */}
					<Box sx={{ flex: '0 0 60px', textAlign: 'center' }}>
						{salon.salonStatus === SalonStatus.DELETE && (
							<IconButton size="small" onClick={() => removeSalonHandler(salon._id)}>
								<DeleteOutlineIcon sx={{ fontSize: 18, color: '#FF4D6A' }} />
							</IconButton>
						)}
					</Box>
				</Stack>
			))}
		</Stack>
	);
};

export default SalonList;