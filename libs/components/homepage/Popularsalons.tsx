import React, { useState } from 'react';
import { Stack, Box, Typography, IconButton, Chip } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation } from 'swiper';

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

// ⚠️ TUZATILDI: v8'da modullar ROOT paketdan import qilinadi va
// SwiperCore.use() orqali ROYXATDAN OTKAZILISHI SHART (v7dan oldingi API)
SwiperCore.use([Autoplay, Navigation]);

// ⚠️ .toLocaleString() ISHLATMAYMIZ — server va brauzer turli locale bilan
// formatlab, hydration mismatch xatosiga olib keladi.
const formatPrice = (n?: number): string => {
	if (n === undefined || n === null) return '0';
	return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

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
			input: { page: 1, limit: 6, sort: 'salonRank', direction: 'DESC', search: {} },
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
		const raw = salon.salonImages?.[0];
		const img = raw ? (raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`) : '/img/banner/hero.jpg';
		const isOpen = isSalonOpen(salon.salonWorkHours);
		const liked = salon.meLiked?.[0]?.myFavorite;

		return (
			<Stack className="popular-card">
				{/* Image */}
				<Box component="div" className="pc-img" style={{ backgroundImage: `url(${img})` }}
					onClick={() => router.push(`/salons/${salon._id}`)}>
					<Chip
						label={isOpen ? t('Open') : t('Closed')}
						size="small"
						className={`pc-status ${isOpen ? 'open' : 'closed'}`}
					/>
					<IconButton className="pc-like" onClick={(e: any) => { e.stopPropagation(); likeHandler(salon._id); }}>
						{liked
							? <FavoriteIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
							: <FavoriteBorderIcon sx={{ fontSize: 15, color: '#666' }} />}
					</IconButton>
				</Box>

				{/* Info */}
				<Box component="div" className="pc-info">
					<Stack direction="row" justifyContent="space-between" alignItems="center" className="pc-name-row">
						<Typography className="pc-name" onClick={() => router.push(`/salons/${salon._id}`)}>
							{salon.salonTitle}
						</Typography>
						<Stack direction="row" alignItems="center" gap={0.25} className="pc-rating">
							<StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
							<Typography className="pcr-num">4.9</Typography>
						</Stack>
					</Stack>

					<Stack direction="row" alignItems="center" gap={0.25} className="pc-location">
						<LocationOnIcon sx={{ fontSize: 13 }} />
						<Typography className="pcl-text">{salon.salonLocation}</Typography>
					</Stack>

					<Typography className="pc-price">₩30,000~</Typography>

					<Stack direction="row" alignItems="center" gap={0.5} className="pc-deposit">
						<ShieldOutlinedIcon sx={{ fontSize: 13, color: '#FF85B3' }} />
						<Typography className="pcd-text">
							{t('Deposit')}: ₩{formatPrice(salon.depositAmount)}
						</Typography>
					</Stack>
				</Box>
			</Stack>
		);
	};

	/** MOBILE **/
	if (device === 'mobile') {
		return (
			<Stack className="popular-salons-section mobile">
				<Stack direction="row" justifyContent="space-between" alignItems="center" className="ps-header">
					<Typography className="ps-title">{t('Popular Salons')}</Typography>
					<Link href="/salons">
						<Typography className="ps-viewall">{t('View all')}</Typography>
					</Link>
				</Stack>
				<Stack direction="row" gap={1.5} className="ps-scroll">
					{salons.map((salon) => <SalonCard key={salon._id} salon={salon} />)}
				</Stack>
			</Stack>
		);
	}

	/** PC **/
	return (
		<Stack className="popular-salons-section">
			<Stack className="ps-container">
				{/* Header */}
				<Stack direction="row" justifyContent="space-between" alignItems="center" className="ps-header">
					<Stack>
						<Typography className="ps-title">{t('Popular Salons')}</Typography>
						<Typography className="ps-subtitle">{t('Top rated salons by our community')}</Typography>
					</Stack>
					<Stack direction="row" alignItems="center" gap={2}>
						<Link href="/salons">
							<Stack direction="row" alignItems="center" gap={0.5} className="ps-viewall">
								<Typography className="psv-text">{t('View all salons')}</Typography>
								<EastIcon sx={{ fontSize: 16 }} />
							</Stack>
						</Link>
						<Stack direction="row" gap={0.75}>
							<Box component="div" className="ps-arrow swiper-popular-prev"><WestIcon /></Box>
							<Box component="div" className="ps-arrow swiper-popular-next"><EastIcon /></Box>
						</Stack>
					</Stack>
				</Stack>

				{/* Slider */}
				<Swiper
					slidesPerView={5}
					spaceBetween={20}
					modules={[Autoplay, Navigation]}
					navigation={{ nextEl: '.swiper-popular-next', prevEl: '.swiper-popular-prev' }}
					autoplay={{ delay: 5000, disableOnInteraction: false }}
					loop={salons.length > 4}
				>
					{salons.map((salon) => (
						<SwiperSlide key={salon._id} className="ps-slide">
							<SalonCard salon={salon} />
						</SwiperSlide>
					))}
				</Swiper>
			</Stack>
		</Stack>
	);
};

export default PopularSalons;