import React, { useState } from 'react';
import { Stack, Box, Typography, Button, IconButton, Chip } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import { GET_SALONS } from '../../../apollo/user/query';
import { LIKE_TARGET_SALON } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { Salon } from '../../types/salon/salon';
import { REACT_APP_API_URL, topSalonRank } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';
import { userVar } from '../../../apollo/store';
import { isSalonOpen } from '../../utils';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const PopularSalons = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const [salons, setSalons] = useState<Salon[]>([]);

	const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);

	const { refetch } = useQuery(GET_SALONS, {
		fetchPolicy: 'cache-and-network',
		variables: {
			input: { page: 1, limit: 8, sort: 'salonRank', direction: 'DESC', search: {} },
		},
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => setSalons(data?.getSalons?.list ?? []),
	});

	const likeHandler = async (id: string) => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetSalon({ variables: { input: id } });
			await refetch();
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (!salons.length) return null;

	const SalonCard = ({ salon }: { salon: Salon }) => {
		const img = salon.salonImages?.[0] ? `${REACT_APP_API_URL}/${salon.salonImages[0]}` : '/img/banner/default.jpg';
		const isOpen = isSalonOpen(salon.salonWorkHours);
		const isTop = salon.salonRank >= topSalonRank;
		const liked = salon.meLiked?.[0]?.myFavorite;

		return (
			<Stack
				sx={{
					width: device === 'mobile' ? 200 : 240,
					borderRadius: 4,
					overflow: 'hidden',
					background: '#fff',
					boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
					border: '1px solid rgba(255,77,141,0.08)',
					transition: 'all 0.3s ease',
					'&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 48px rgba(255,77,141,0.15)', borderColor: 'rgba(255,77,141,0.2)' },
				}}
			>
				{/* Image */}
				<Box
					component="div"
					onClick={() => router.push(`/salons/${salon._id}`)}
					sx={{ position: 'relative', height: 170, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' }}
				>
					<Chip label={isOpen ? t('Open') : t('Closed')} size="small"
						sx={{ position: 'absolute', top: 8, left: 8, background: isOpen ? '#4CAF50' : '#e53935', color: '#fff', fontWeight: 700, fontSize: 10 }} />
					<IconButton
						onClick={(e: any) => { e.stopPropagation(); likeHandler(salon._id); }}
						sx={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)', width: 28, height: 28, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.1)' } }}
					>
						{liked ? <FavoriteIcon sx={{ fontSize: 14, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 14, color: '#666' }} />}
					</IconButton>
				</Box>

				{/* Info */}
				<Box component="div" sx={{ p: 1.5 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.25 }}>
						<Typography
							onClick={() => router.push(`/salons/${salon._id}`)}
							sx={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, mr: 1, '&:hover': { color: '#FF4D8D' } }}
						>
							{salon.salonTitle}
						</Typography>
						<Stack direction="row" alignItems="center" gap={0.25}>
							<StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
							<Typography sx={{ fontSize: 11, fontWeight: 600 }}>4.9</Typography>
						</Stack>
					</Stack>

					<Typography sx={{ fontSize: 11, color: '#888', mb: 1, display: 'flex', alignItems: 'center', gap: 0.25 }}>
						<LocationOnIcon sx={{ fontSize: 12 }} />
						{salon.salonLocation}
					</Typography>

					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
						<Typography sx={{ fontSize: 12, color: '#FF4D8D', fontWeight: 600 }}>₩30,000~</Typography>
					</Stack>

					<Stack direction="row" alignItems="center" gap={0.5} sx={{ pt: 1, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
						<ShieldOutlinedIcon sx={{ fontSize: 12, color: '#FF85B3' }} />
						<Typography sx={{ fontSize: 10, color: '#999' }}>
							{t('Deposit')}: ₩{salon.depositAmount?.toLocaleString()}
						</Typography>
					</Stack>
				</Box>
			</Stack >
		);
	};

	// Mobile
	if (device === 'mobile') {
		return (
			<Stack sx={{ py: 4, background: '#FAFAFA' }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, mb: 2 }}>
					<Typography sx={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{t('Popular Salons')}</Typography>
					<Link href="/salons">
						<Typography sx={{ fontSize: 12, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer' }}>{t('View all')}</Typography>
					</Link>
				</Stack>
				<Stack direction="row" gap={1.5} sx={{ px: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, pb: 1 }}>
					{salons.map((salon) => <SalonCard key={salon._id} salon={salon} />)}
				</Stack>
			</Stack>
		);
	}

	// Desktop
	return (
		<Stack sx={{ py: 7, px: 4, background: '#FAFAFA' }}>
			<Stack sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
					<Box component="div">
						<Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', mb: 0.25 }}>{t('Popular Salons')}</Typography>
						<Typography sx={{ fontSize: 13, color: '#888' }}>{t('Top rated salons by our community')}</Typography>
					</Box>
					<Stack direction="row" alignItems="center" gap={2}>
						<Link href="/salons">
							<Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
								<Typography sx={{ fontSize: 13, fontWeight: 600, color: '#FF4D8D' }}>{t('View all salons')}</Typography>
								<Typography sx={{ color: '#FF4D8D' }}>→</Typography>
							</Stack>
						</Link>
						<Stack direction="row" gap={0.5}>
							<Box component="div" className="swiper-popular-prev" sx={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,77,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { background: '#FF4D8D', '& svg': { color: '#fff' } } }}>
								<WestIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
							</Box>
							<Box component="div" className="swiper-popular-next" sx={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,77,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { background: '#FF4D8D', '& svg': { color: '#fff' } } }}>
								<EastIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
							</Box>
						</Stack>
					</Stack>
				</Stack>

				<Swiper
					slidesPerView="auto"
					spaceBetween={20}
					modules={[Autoplay, Navigation]}
					navigation={{ nextEl: '.swiper-popular-next', prevEl: '.swiper-popular-prev' }}
					autoplay={{ delay: 5000, disableOnInteraction: false }}
				>
					{salons.map((salon) => (
						<SwiperSlide key={salon._id} style={{ width: 240 }}>
							<SalonCard salon={salon} />
						</SwiperSlide>
					))}
				</Swiper>
			</Stack>
		</Stack>
	);
};

export default PopularSalons;