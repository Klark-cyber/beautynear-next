import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import {
	Stack, Box, Typography, Button, OutlinedInput, Select,
	MenuItem, InputAdornment, Drawer, Modal,
} from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import SalonCard from '../../libs/components/salon/Saloncard';
import SalonFilter from '../../libs/components/salon/Salonfilter';
import Pagination from '../../libs/components/common/Pagination';
import EmptyList from '../../libs/components/common/Emptylist';
import { GET_SALONS } from '../../apollo/user/query';
import { LIKE_TARGET_SALON } from '../../apollo/user/mutation';
import { T } from '../../libs/types/common';
import { Salon } from '../../libs/types/salon/salon';
import { SalonsInquiry } from '../../libs/types/salon/salon.input';
import { SalonLocation, SalonType } from '../../libs/enums/salon.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { Message } from '../../libs/enums/common.enum';
import { userVar } from '../../apollo/store';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import MyLocationIcon from '@mui/icons-material/MyLocation';

export const getServerSideProps = async ({ locale, query }: any) => {
	const input = query?.input ? JSON.parse(query.input) : null;
	return {
		props: {
			...(await serverSideTranslations(locale, ['common'])),
			initialInput: input ?? {
				page: 1,
				limit: 9,
				sort: 'createdAt',
				direction: 'DESC',
				search: {},
			},
		},
	};
};

const SORT_OPTIONS = [
	{ value: 'createdAt', label: 'Latest' },
	{ value: 'salonLikes', label: 'Most Popular' },
	{ value: 'salonRank', label: 'Top Rated' },
	{ value: 'nearest', label: 'Nearest' },
];

const TYPE_CHIPS = [
	{ value: null, label: 'All' },
	{ value: SalonType.HAIR, label: 'Hair' },
	{ value: SalonType.NAIL, label: 'Nail' },
	{ value: SalonType.SKIN, label: 'Skin' },
	{ value: SalonType.CLINIC, label: 'Clinic' },
	{ value: SalonType.MASSAGE, label: 'Massage' },
];

// Seoul default koordinatalari
const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.9780;

const Salons: NextPage = ({ initialInput }: any) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);

	const [searchFilter, setSearchFilter] = useState<SalonsInquiry>(initialInput);
	const [salons, setSalons] = useState<Salon[]>([]);
	const [total, setTotal] = useState(0);
	const [searchText, setSearchText] = useState('');
	const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
	const [activeTypeChip, setActiveTypeChip] = useState<SalonType | null>(null);
	const [activeSort, setActiveSort] = useState<string>(initialInput.sort ?? 'createdAt');

	// Geo permission modal
	const [geoModalOpen, setGeoModalOpen] = useState(false);
	const [pendingNearestFilter, setPendingNearestFilter] = useState<SalonsInquiry | null>(null);

	/** APOLLO **/
	const [likeTargetSalon] = useMutation(LIKE_TARGET_SALON);

	const { refetch } = useQuery(GET_SALONS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setSalons(data?.getSalons?.list ?? []);
			setTotal(data?.getSalons?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.input) {
			setSearchFilter(JSON.parse(router.query.input as string));
		}
	}, [router.query.input]);

	useEffect(() => {
		refetch({ input: searchFilter }).then();
	}, [searchFilter]);

	/** GEO HELPERS **/
	const getCoordinates = (): { lat: number; lng: number } => {
		if (typeof window === 'undefined') return { lat: SEOUL_LAT, lng: SEOUL_LNG };
		const lat = parseFloat(localStorage.getItem('userLat') || String(SEOUL_LAT));
		const lng = parseFloat(localStorage.getItem('userLng') || String(SEOUL_LNG));
		return { lat, lng };
	};

	const buildNearestFilter = (lat: number, lng: number): SalonsInquiry => ({
		...searchFilter,
		sort: 'nearest',
		search: {
			...searchFilter.search,
			latitude: lat,
			longitude: lng,
			radius: 50,
		},
		page: 1,
	});

	// Geo ruxsat so'rash
	const requestGeoPermission = (onSuccess: (lat: number, lng: number) => void) => {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				localStorage.setItem('geoAllowed', 'true');
				localStorage.setItem('userLat', String(lat));
				localStorage.setItem('userLng', String(lng));
				onSuccess(lat, lng);
			},
			() => {
				// Ruxsat berilmadi → Seoul default
				onSuccess(SEOUL_LAT, SEOUL_LNG);
			},
		);
	};

	/** HANDLERS **/
	const likeHandler = useCallback(async (id: string) => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetSalon({ variables: { input: id } });
			await refetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	}, [user, searchFilter]);

	const searchHandler = useCallback(async () => {
		const updated = { ...searchFilter, search: { ...searchFilter.search, text: searchText }, page: 1 };
		setSearchFilter(updated);
		await router.push(
			`/salons?input=${JSON.stringify(updated)}`,
			`/salons?input=${JSON.stringify(updated)}`,
			{ scroll: false },
		);
	}, [searchText, searchFilter]);

	const sortHandler = useCallback(async (sort: string) => {
		try {
			setActiveSort(sort);

			// Nearest — geo logika
			if (sort === 'nearest') {
				const geoAllowed = localStorage.getItem('geoAllowed');

				if (geoAllowed) {
					// Ruxsat allaqachon berilgan
					const { lat, lng } = getCoordinates();
					const updated = buildNearestFilter(lat, lng);
					setSearchFilter(updated);
					await router.push(
						`/salons?input=${JSON.stringify(updated)}`,
						`/salons?input=${JSON.stringify(updated)}`,
						{ scroll: false },
					);
				} else {
					// Ruxsat so'rash kerak — modal ochiladi
					const pending = buildNearestFilter(SEOUL_LAT, SEOUL_LNG);
					setPendingNearestFilter(pending);
					setGeoModalOpen(true);
				}
				return;
			}

			// Boshqa sort — geo fieldlarini o'chirish
			const { latitude, longitude, radius, ...restSearch } = searchFilter.search;
			const updated: SalonsInquiry = {
				...searchFilter,
				sort,
				search: restSearch,
				page: 1,
			};
			setSearchFilter(updated);
			await router.push(
				`/salons?input=${JSON.stringify(updated)}`,
				`/salons?input=${JSON.stringify(updated)}`,
				{ scroll: false },
			);
		} catch (err: any) {
			console.log('ERROR, sortHandler:', err);
		}
	}, [searchFilter]);

	// Geo modal — Allow
	const geoAllowHandler = useCallback(() => {
		setGeoModalOpen(false);
		requestGeoPermission(async (lat, lng) => {
			const updated = buildNearestFilter(lat, lng);
			setSearchFilter(updated);
			setPendingNearestFilter(null);
			await router.push(
				`/salons?input=${JSON.stringify(updated)}`,
				`/salons?input=${JSON.stringify(updated)}`,
				{ scroll: false },
			);
		});
	}, [searchFilter]);

	// Geo modal — Skip → Seoul default
	const geoSkipHandler = useCallback(async () => {
		setGeoModalOpen(false);
		const updated = buildNearestFilter(SEOUL_LAT, SEOUL_LNG);
		setSearchFilter(updated);
		setPendingNearestFilter(null);
		await router.push(
			`/salons?input=${JSON.stringify(updated)}`,
			`/salons?input=${JSON.stringify(updated)}`,
			{ scroll: false },
		);
	}, [searchFilter]);

	const typeChipHandler = useCallback(async (type: SalonType | null) => {
		try {
			setActiveTypeChip(type);
			const search = { ...searchFilter.search };
			if (type) search.typeList = [type];
			else delete search.typeList;
			const updated = { ...searchFilter, search, page: 1 };
			setSearchFilter(updated);
			await router.push(
				`/salons?input=${JSON.stringify(updated)}`,
				`/salons?input=${JSON.stringify(updated)}`,
				{ scroll: false },
			);
		} catch (err: any) {
			console.log('ERROR, typeChipHandler:', err);
		}
	}, [searchFilter]);

	const pageHandler = useCallback(async (page: number) => {
		const updated = { ...searchFilter, page };
		setSearchFilter(updated);
		await router.push(
			`/salons?input=${JSON.stringify(updated)}`,
			`/salons?input=${JSON.stringify(updated)}`,
			{ scroll: false },
		);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [searchFilter]);

	// ── GEO PERMISSION MODAL ───────────────────────────────────────────────────
	const GeoModal = () => (
		<Modal
			open={geoModalOpen}
			onClose={geoSkipHandler}
			sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
		>
			<Box
				component="div"
				sx={{
					width: 360,
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
				<Stack alignItems="center" gap={2}>
					<Box component="div" sx={{
						width: 60, height: 60, borderRadius: '50%',
						background: 'rgba(255,77,141,0.08)',
						display: 'flex', alignItems: 'center', justifyContent: 'center',
					}}>
						<MyLocationIcon sx={{ fontSize: 28, color: '#FF4D8D' }} />
					</Box>

					<Typography sx={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a', textAlign: 'center' }}>
						{t('Enable Location Access')}
					</Typography>
					<Typography sx={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
						{t('Allow BeautyNear to access your location to show the nearest salons. If you skip, we will show salons near Seoul.')}
					</Typography>

					<Stack direction="row" gap={1.5} sx={{ width: '100%' }}>
						<Button
							fullWidth
							onClick={geoSkipHandler}
							sx={{
								py: 1.25, borderRadius: 2.5,
								border: '1.5px solid rgba(0,0,0,0.12)',
								color: '#555', fontWeight: 600, fontSize: 14,
								'&:hover': { background: '#f5f5f5' },
							}}
						>
							{t('Skip')}
						</Button>
						<Button
							fullWidth
							onClick={geoAllowHandler}
							sx={{
								py: 1.25, borderRadius: 2.5,
								background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
								color: '#fff', fontWeight: 700, fontSize: 14,
								boxShadow: '0 4px 16px rgba(255,77,141,0.3)',
								'&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(255,77,141,0.4)' },
							}}
						>
							{t('Allow Access')}
						</Button>
					</Stack>
				</Stack>
			</Box>
		</Modal>
	);

	// ── MOBILE ─────────────────────────────────────────────────────────────────
	if (device === 'mobile') {
		return (
			<Stack className="salons-page mobile">
				<GeoModal />

				<Stack className="mobile-search-bar">
					<OutlinedInput
						fullWidth size="small"
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						placeholder={t('Search salons, specialists...')}
						onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
						startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /></InputAdornment>}
						sx={{ borderRadius: 2.5, fontSize: 13, '& fieldset': { borderColor: 'rgba(255,77,141,0.2)' } }}
					/>
				</Stack>

				<Stack className="mobile-type-chips" direction="row" gap={1}>
					{TYPE_CHIPS.map((chip) => (
						<Box key={chip.label} component="div"
							onClick={() => typeChipHandler(chip.value as SalonType | null)}
							className={`type-chip ${activeTypeChip === chip.value ? 'active' : ''}`}>
							{t(chip.label)}
						</Box>
					))}
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
					<Typography sx={{ fontSize: 13, color: '#888' }}>
						<Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{total}</Box> {t('salons found')}
					</Typography>
				</Stack>

				<Stack className="mobile-cards" gap={2} sx={{ px: 2 }}>
					{salons.length === 0 ? (
						<EmptyList emoji="💅" title={t('No salons found')} desc={t('Try changing your filters')} />
					) : (
						salons.map((salon) => (
							<SalonCard key={salon._id} salon={salon} mode="full" onLike={likeHandler} />
						))
					)}
				</Stack>

				<Pagination page={searchFilter.page} limit={searchFilter.limit} total={total} onChange={pageHandler} />

				<Stack direction="row" className="mobile-bottom-bar">
					<Button fullWidth onClick={() => setMobileFilterOpen(true)}
						startIcon={<TuneIcon />} className="mobile-filter-btn">
						{t('Filter')}
					</Button>
					<Select
						value={activeSort}
						onChange={(e) => sortHandler(e.target.value)}
						size="small" className="mobile-sort-select"
					>
						{SORT_OPTIONS.map((s) => (
							<MenuItem key={s.value} value={s.value}>{t(s.label)}</MenuItem>
						))}
					</Select>
				</Stack>

				<Drawer anchor="bottom" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}
					PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflow: 'auto' } }}>
					<Box component="div" sx={{ p: 2 }}>
						<SalonFilter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} />
					</Box>
				</Drawer>
			</Stack>
		);
	}

	// ── DESKTOP ─────────────────────────────────────────────────────────────────
	return (
		<Stack className="salons-page">
			<GeoModal />

			{/* Top search bar */}
			<Stack className="salons-top-bar">
				<Stack className="salons-top-inner" direction="row" alignItems="center" gap={2}>
					<OutlinedInput
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						placeholder={t('Search salons, specialists, services...')}
						onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
						startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /></InputAdornment>}
						sx={{
							flex: 1, borderRadius: 2.5, fontSize: 14,
							'& fieldset': { borderColor: 'rgba(255,77,141,0.2)' },
							'&:hover fieldset': { borderColor: '#FF4D8D' },
							'&.Mui-focused fieldset': { borderColor: '#FF4D8D' },
						}}
					/>

					<Stack direction="row" alignItems="center" gap={0.75}>
						<LocationOnOutlinedIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
						<Select
							value={searchFilter.search.locationList?.[0] ?? SalonLocation.ALL}
							onChange={async (e) => {
								const loc = e.target.value as SalonLocation;
								const search = { ...searchFilter.search };
								if (loc === SalonLocation.ALL) delete search.locationList;
								else search.locationList = [loc];
								const updated = { ...searchFilter, search, page: 1 };
								setSearchFilter(updated);
								await router.push(
									`/salons?input=${JSON.stringify(updated)}`,
									`/salons?input=${JSON.stringify(updated)}`,
									{ scroll: false },
								);
							}}
							size="small"
							sx={{
								minWidth: 140, borderRadius: 2,
								'& fieldset': { borderColor: 'rgba(255,77,141,0.2)' },
								'&:hover fieldset': { borderColor: '#FF4D8D' },
							}}
						>
							{Object.values(SalonLocation).map((loc) => (
								<MenuItem key={loc} value={loc}>
									{loc === SalonLocation.ALL ? `🇰🇷 ${t('All Korea')}` : loc}
								</MenuItem>
							))}
						</Select>
					</Stack>

					<Button className="find-now-btn" onClick={searchHandler}>
						{t('Find Now')}
					</Button>
				</Stack>

				{/* Type chips */}
				<Stack direction="row" gap={1} className="type-chips-bar">
					{TYPE_CHIPS.map((chip) => (
						<Box key={chip.label} component="div"
							onClick={() => typeChipHandler(chip.value as SalonType | null)}
							className={`type-chip ${activeTypeChip === chip.value ? 'active' : ''}`}>
							{t(chip.label)}
						</Box>
					))}
				</Stack>
			</Stack>

			{/* Main */}
			<Stack direction="row" className="salons-main">
				<Box component="div" className="salons-sidebar">
					<SalonFilter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} />
				</Box>

				<Stack className="salons-content">
					<Stack direction="row" justifyContent="space-between" alignItems="center" className="results-header">
						<Typography className="results-count">
							<Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{total}</Box> {t('salons found')}
						</Typography>

						<Stack direction="row" alignItems="center" gap={1}>
							<Typography sx={{ fontSize: 13, color: '#888' }}>{t('Sort by')}:</Typography>
							{SORT_OPTIONS.map((s) => (
								<Box key={s.value} component="div"
									onClick={() => sortHandler(s.value)}
									className={`sort-chip ${activeSort === s.value ? 'active' : ''}`}>
									{t(s.label)}
								</Box>
							))}
						</Stack>
					</Stack>

					{salons.length === 0 ? (
						<EmptyList
							emoji="💅"
							title={t('No salons found')}
							desc={t('Try adjusting your filters or search terms')}
							buttonText="Clear filters"
							buttonHref="/salons"
						/>
					) : (
						<Stack className="salons-grid">
							{salons.map((salon) => (
								<SalonCard key={salon._id} salon={salon} mode="full" onLike={likeHandler} />
							))}
						</Stack>
					)}

					<Pagination page={searchFilter.page} limit={searchFilter.limit} total={total} onChange={pageHandler} />
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Salons);