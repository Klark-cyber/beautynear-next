import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, Button, Pagination as MuiPagination } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import StarIcon from '@mui/icons-material/Star';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { useMutation, useQuery } from '@apollo/client';
import { GET_FAVORITE_SALONS, GET_FAVORITE_SERVICES } from '../../../apollo/user/query';
import { LIKE_TARGET_SALON, LIKE_TARGET_SERVICE } from '../../../apollo/user/mutation';
import SalonCard from '../salon/Saloncard';
import EmptyList from '../common/Emptylist';
import { Salon } from '../../types/salon/salon';
import { Service } from '../../types/service/service';
import { T } from '../../types/common';
import { REACT_APP_API_URL } from '../../config';
import { likeTargetSalonHandler, likeTargetServiceHandler } from '../../utils';

/* ─── Helpers (hydration-safe) ───────────────────────────────────────────── */

const formatPrice = (n?: number): string => {
	if (n === undefined || n === null) return '0';
	return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatRating = (n?: number): string => {
	if (n === undefined || n === null) return '4.9';
	return n.toFixed(1);
};

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
	if (!raw) return fallback;
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const TYPE_EMOJI: Record<string, string> = {
	HAIR: '✂️',
	NAIL: '💅',
	SKIN: '🧴',
	CLINIC: '💉',
	MASSAGE: '🪷',
};

/**
 * Backend getFavoriteSalons/getVisitedSalons hozircha salonWorkHours va depositAmount'ni
 * aggregation $project bosqichida qaytarmaydi (Salon ObjectType'da bu maydonlar NON-NULLABLE
 * bo'lgani uchun query'da so'rasak GraphQL xato beradi). Portfolio doirasida backendni
 * tuzatishga vaqt yo'qligi sababli — shu ikki maydon uchun frontend fallback bilan cheklanamiz
 * (xuddi pages/service/[id].tsx'dagi `salon?.depositAmount ?? 10000` naqshi kabi).
 */
const DEFAULT_WORK_HOURS = '09:00-21:00';
const DEFAULT_DEPOSIT = 10000;

const withSalonFallback = (salon: Salon): Salon => ({
	...salon,
	salonWorkHours: salon.salonWorkHours || DEFAULT_WORK_HOURS,
	depositAmount: salon.depositAmount || DEFAULT_DEPOSIT,
});

type FavTab = 'SALON' | 'SERVICE';

const limit = 6;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MyFavorites: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');

	const [activeTab, setActiveTab] = useState<FavTab>('SALON');

	const [salonPage, setSalonPage] = useState<number>(1);
	const [favoriteSalons, setFavoriteSalons] = useState<Salon[]>([]);
	const [salonTotal, setSalonTotal] = useState<number>(0);

	const [servicePage, setServicePage] = useState<number>(1);
	const [favoriteServices, setFavoriteServices] = useState<Service[]>([]);
	const [serviceTotal, setServiceTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);
	const [likeTargetService] = useMutation(LIKE_TARGET_SERVICE);

	const { refetch: refetchFavoriteSalons } = useQuery(GET_FAVORITE_SALONS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: salonPage, limit } },
		skip: activeTab !== 'SALON',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			const list: Salon[] = data?.getFavoriteSalons?.list ?? [];
			setFavoriteSalons(list.map(withSalonFallback));
			setSalonTotal(data?.getFavoriteSalons?.metaCounter?.[0]?.total ?? 0);
		},
	});

	const { refetch: refetchFavoriteServices } = useQuery(GET_FAVORITE_SERVICES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: servicePage, limit } },
		skip: activeTab !== 'SERVICE',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setFavoriteServices(data?.getFavoriteServices?.list ?? []);
			setServiceTotal(data?.getFavoriteServices?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	// Like tugmasi bosilsa backend'da toggle bo'ladi (favorites'dan chiqadi), keyin royxat yangilanadi
	const unlikeSalonHandler = async (id: string) => {
		await likeTargetSalonHandler(likeTargetSalon, id);
		await refetchFavoriteSalons({ input: { page: salonPage, limit } });
	};

	const unlikeServiceHandler = async (id: string) => {
		await likeTargetServiceHandler(likeTargetService, id);
		await refetchFavoriteServices({ input: { page: servicePage, limit } });
	};

	const salonPaginationHandler = (_e: any, value: number) => setSalonPage(value);
	const servicePaginationHandler = (_e: any, value: number) => setServicePage(value);

	const changeTabHandler = (tab: FavTab) => {
		setActiveTab(tab);
	};

	return (
		<Box component="div" className="mypage-content">
			{/* Sarlavha */}
			<Typography className="content-title">{t('My Favorites')}</Typography>
			<Typography className="content-subtitle">{t("Salons and services you've saved")}</Typography>

			{/* Salons / Services tab */}
			<Stack direction="row" gap={1.5} className="filter-tabs">
				<Box
					component="div"
					className={`filter-tab ${activeTab === 'SALON' ? 'active' : ''}`}
					onClick={() => changeTabHandler('SALON')}
				>
					{t('Salons')}
				</Box>
				<Box
					component="div"
					className={`filter-tab ${activeTab === 'SERVICE' ? 'active' : ''}`}
					onClick={() => changeTabHandler('SERVICE')}
				>
					{t('Services')}
				</Box>
			</Stack>

			{/* ═══ SALONS TAB ═══ */}
			{activeTab === 'SALON' &&
				(favoriteSalons.length === 0 ? (
					<EmptyList
						emoji="💗"
						title={t('No favorites yet')}
						desc={t('Salons and services you like will appear here')}
					/>
				) : (
					<>
						<Box component="div" className="favorites-grid">
							{favoriteSalons.map((salon) => (
								<SalonCard key={salon._id} salon={salon} myFavorites={true} onLike={unlikeSalonHandler} />
							))}
						</Box>

						{favoriteSalons.length !== 0 && (
							<Stack alignItems="center" sx={{ mt: 4 }}>
								<MuiPagination
									page={salonPage}
									count={Math.ceil(salonTotal / limit)}
									onChange={salonPaginationHandler}
									shape="circular"
									sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
								/>
							</Stack>
						)}
					</>
				))}

			{/* ═══ SERVICES TAB ═══ */}
			{activeTab === 'SERVICE' &&
				(favoriteServices.length === 0 ? (
					<EmptyList
						emoji="💗"
						title={t('No favorites yet')}
						desc={t('Salons and services you like will appear here')}
					/>
				) : (
					<>
						<Box component="div" className="favorites-grid">
							{favoriteServices.map((svc) => (
								<Stack
									key={svc._id}
									className="fav-service-card"
									onClick={() => router.push(`/service/${svc._id}`)}
								>
									{/* Rasm */}
									<Box
										component="div"
										className="fsc-img"
										style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }}
									>
										<IconButton
											className="fsc-like-btn liked"
											onClick={(e) => {
												e.stopPropagation();
												unlikeServiceHandler(svc._id);
											}}
										>
											<FavoriteIcon sx={{ fontSize: 16, color: '#FF4D8D' }} />
										</IconButton>
									</Box>

									{/* Body */}
									<Box component="div" className="fsc-body">
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Typography className="fsc-name">{svc.serviceTitle}</Typography>
											<Stack direction="row" alignItems="center" gap={0.4}>
												<StarIcon sx={{ fontSize: 14, color: '#FFB800' }} />
												<Typography sx={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
													{formatRating(svc.serviceRating)}
												</Typography>
											</Stack>
										</Stack>

										{svc.salonData?.salonTitle && (
											<Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.75 }}>
												<LocationOnOutlinedIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
												<Typography className="fsc-salon">{svc.salonData.salonTitle}</Typography>
											</Stack>
										)}

										<Box component="div" className="fsc-type-chip">
											{TYPE_EMOJI[svc.serviceType]} {t(svc.serviceType)}
										</Box>

										<Stack direction="row" justifyContent="space-between" alignItems="center" className="fsc-price-row">
											<Typography className="fsc-price">₩{formatPrice(svc.servicePrice)}</Typography>
											<Stack direction="row" alignItems="center" gap={1.25}>
												<Stack direction="row" alignItems="center" gap={0.3}>
													<FavoriteBorderIcon sx={{ fontSize: 13, color: '#999' }} />
													<Typography sx={{ fontSize: 12, color: '#888' }}>{svc.serviceLikes ?? 0}</Typography>
												</Stack>
												<Stack direction="row" alignItems="center" gap={0.3}>
													<RemoveRedEyeIcon sx={{ fontSize: 13, color: '#999' }} />
													<Typography sx={{ fontSize: 12, color: '#888' }}>{svc.serviceViews ?? 0}</Typography>
												</Stack>
											</Stack>
										</Stack>

										<Button
											fullWidth
											className="fsc-book-btn"
											onClick={(e) => {
												e.stopPropagation();
												router.push(`/service/${svc._id}`);
											}}
										>
											{t('View Service')}
										</Button>
									</Box>
								</Stack>
							))}
						</Box>

						{favoriteServices.length !== 0 && (
							<Stack alignItems="center" sx={{ mt: 4 }}>
								<MuiPagination
									page={servicePage}
									count={Math.ceil(serviceTotal / limit)}
									onChange={servicePaginationHandler}
									shape="circular"
									sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
								/>
							</Stack>
						)}
					</>
				))}
		</Box>
	);
};

export default MyFavorites;