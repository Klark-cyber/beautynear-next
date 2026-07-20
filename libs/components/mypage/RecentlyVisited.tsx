import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, Chip, Button, Pagination as MuiPagination } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { useQuery } from '@apollo/client';
import { GET_VISITED_SALONS, GET_VISITED_SERVICES } from '../../../apollo/user/query';
import SalonCard from '../salon/Saloncard';
import EmptyList from '../common/Emptylist';
import { Salon } from '../../types/salon/salon';
import { Service } from '../../types/service/service';
import { T } from '../../types/common';
import { REACT_APP_API_URL } from '../../config';

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
 * Backend getVisitedSalons hozircha salonWorkHours'ni aggregation $project
 * bosqichida qaytarmaydi (MyFavorites'dagi bilan bir xil sabab — Salon
 * ObjectType'da bu maydon NON-NULLABLE). Portfolio doirasida frontend
 * fallback bilan cheklanamiz (service/[id].tsx'dagi naqsh bilan bir xil).
 */
const DEFAULT_WORK_HOURS = '09:00-21:00';

const withSalonFallback = (salon: Salon): Salon => ({
	...salon,
	salonWorkHours: salon.salonWorkHours || DEFAULT_WORK_HOURS,
});

type VisitedTab = 'SALON' | 'SERVICE';

const limit = 6;

/* ─── Component ───────────────────────────────────────────────────────────── */

const RecentlyVisited: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');

	const [activeTab, setActiveTab] = useState<VisitedTab>('SALON');

	const [salonPage, setSalonPage] = useState<number>(1);
	const [visitedSalons, setVisitedSalons] = useState<Salon[]>([]);
	const [salonTotal, setSalonTotal] = useState<number>(0);

	const [servicePage, setServicePage] = useState<number>(1);
	const [visitedServices, setVisitedServices] = useState<Service[]>([]);
	const [serviceTotal, setServiceTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	useQuery(GET_VISITED_SALONS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: salonPage, limit } },
		skip: activeTab !== 'SALON',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			const list: Salon[] = data?.getVisitedSalons?.list ?? [];
			setVisitedSalons(list.map(withSalonFallback));
			setSalonTotal(data?.getVisitedSalons?.metaCounter?.[0]?.total ?? 0);
		},
	});

	useQuery(GET_VISITED_SERVICES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: servicePage, limit } },
		skip: activeTab !== 'SERVICE',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setVisitedServices(data?.getVisitedServices?.list ?? []);
			setServiceTotal(data?.getVisitedServices?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const salonPaginationHandler = (_e: any, value: number) => setSalonPage(value);
	const servicePaginationHandler = (_e: any, value: number) => setServicePage(value);
	const changeTabHandler = (tab: VisitedTab) => setActiveTab(tab);

	const goServiceDetail = (id: string) => router.push(`/service/${id}`);

	return (
		<Box component="div" className="mypage-content">
			{/* Sarlavha */}
			<Typography className="content-title">{t('Recently Viewed')}</Typography>
			<Typography className="content-subtitle">{t("Salons and services you've recently checked out")}</Typography>

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

			{/* ═══ SALONS TAB — SalonCard qayta ishlatiladi (recentlyVisited rejimi) ═══ */}
			{activeTab === 'SALON' &&
				(visitedSalons.length === 0 ? (
					<Box component="div" className="follow-page-frame">
						<EmptyList
							emoji="🕐"
							title={t('No recently viewed items')}
							desc={t('Salons and services you check out will appear here')}
						/>
					</Box>
				) : (
					<Box component="div" className="follow-page-frame">
						<Box component="div" className="favorites-grid">
							{visitedSalons.map((salon) => (
								<SalonCard key={salon._id} salon={salon} recentlyVisited={true} />
							))}
						</Box>

						{visitedSalons.length !== 0 && (
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
					</Box>
				))}

			{/* ═══ SERVICES TAB — alohida ServiceCard komponenti hali yo'q, shu joyda yozilgan ═══ */}
			{activeTab === 'SERVICE' &&
				(visitedServices.length === 0 ? (
					<Box component="div" className="follow-page-frame">
						<EmptyList
							emoji="🕐"
							title={t('No recently viewed items')}
							desc={t('Salons and services you check out will appear here')}
						/>
					</Box>
				) : (
					<Box component="div" className="follow-page-frame">
						<Box component="div" className="favorites-grid">
							{visitedServices.map((svc) => (
								<Stack key={svc._id} className="rv-card" onClick={() => goServiceDetail(svc._id)}>
									{/* Rasm */}
									<Box
										component="div"
										className="rv-img"
										style={{ backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})` }}
									>
										<Box component="div" className="rv-clock-badge">
											<AccessTimeIcon sx={{ fontSize: 15 }} />
										</Box>
									</Box>

									{/* Body */}
									<Box component="div" className="rv-body">
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Typography className="rv-name">{svc.serviceTitle}</Typography>
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
												<Typography className="rv-address">{svc.salonData.salonTitle}</Typography>
											</Stack>
										)}

										<Box component="div" className="rv-type-chip">
											{TYPE_EMOJI[svc.serviceType]} {t(svc.serviceType)}
										</Box>

										<Typography className="rv-price">₩{formatPrice(svc.servicePrice)}</Typography>

										<Button
											fullWidth
											className="rv-btn"
											onClick={(e) => {
												e.stopPropagation();
												goServiceDetail(svc._id);
											}}
										>
											{t('View Again')}
										</Button>
									</Box>
								</Stack>
							))}
						</Box>

						{visitedServices.length !== 0 && (
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
					</Box>
				))}
		</Box>
	);
};

export default RecentlyVisited;