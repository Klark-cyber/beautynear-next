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

// MUI category icons
import ContentCutIcon from '@mui/icons-material/ContentCut';
import BackHandOutlinedIcon from '@mui/icons-material/BackHandOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined';
import AppsIcon from '@mui/icons-material/Apps';

// Backend SISearch qabul qiladigan maydonlar (boshqalari olib tashlanadi)
const ALLOWED_SEARCH_FIELDS = ['memberId', 'locationList', 'typeList', 'latitude', 'longitude', 'radius', 'text'];

const sanitizeInput = (input: any) => {
	if (!input) return null;
	if (input.search) {
		const cleanSearch: any = {};
		for (const key of ALLOWED_SEARCH_FIELDS) {
			if (input.search[key] !== undefined) cleanSearch[key] = input.search[key];
		}
		input.search = cleanSearch;
	}
	return input;
};

export const getServerSideProps = async ({ locale, query }: any) => {
	const raw = query?.input ? JSON.parse(query.input) : null;
	const input = sanitizeInput(raw);
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

// Category chips — icon + label. value=null hamma. backendsiz turlar value='' (bo'sh natija)
const TYPE_CHIPS: { value: SalonType | null | ''; label: string; icon: React.ReactNode }[] = [
	{ value: null, label: 'All', icon: <AppsIcon /> },
	{ value: SalonType.HAIR, label: 'Hair', icon: <ContentCutIcon /> },
	{ value: SalonType.NAIL, label: 'Nail', icon: <BackHandOutlinedIcon /> },
	{ value: SalonType.SKIN, label: 'Skin', icon: <SpaOutlinedIcon /> },
	{ value: SalonType.CLINIC, label: 'Clinic', icon: <LocalHospitalOutlinedIcon /> },
	{ value: SalonType.MASSAGE, label: 'Massage', icon: <SelfImprovementOutlinedIcon /> },
	{ value: '', label: 'Botox', icon: <VaccinesOutlinedIcon /> },
	{ value: '', label: 'Eyebrow', icon: <RemoveRedEyeOutlinedIcon /> },
	{ value: '', label: 'Makeup', icon: <BrushOutlinedIcon /> },
];

const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.978;

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
	const [activeChip, setActiveChip] = useState<string>('All');
	const [activeSort, setActiveSort] = useState<string>(initialInput.sort ?? 'createdAt');

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
			const parsed = JSON.parse(router.query.input as string);
			// Eski/noma'lum search maydonlarini tozalash (priceMin/priceMax va h.k.)
			if (parsed.search) {
				const clean: any = {};
				for (const key of ['memberId', 'locationList', 'typeList', 'latitude', 'longitude', 'radius', 'text', 'priceMin', 'priceMax']) {
					if (parsed.search[key] !== undefined) clean[key] = parsed.search[key];
				}
				parsed.search = clean;
			}
			setSearchFilter(parsed);
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
		search: { ...searchFilter.search, latitude: lat, longitude: lng, radius: 50 },
		page: 1,
	});

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
			() => onSuccess(SEOUL_LAT, SEOUL_LNG),
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
		await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
	}, [searchText, searchFilter]);

	const sortHandler = useCallback(async (sort: string) => {
		try {
			setActiveSort(sort);
			if (sort === 'nearest') {
				const geoAllowed = localStorage.getItem('geoAllowed');
				if (geoAllowed) {
					const { lat, lng } = getCoordinates();
					const updated = buildNearestFilter(lat, lng);
					setSearchFilter(updated);
					await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
				} else {
					setPendingNearestFilter(buildNearestFilter(SEOUL_LAT, SEOUL_LNG));
					setGeoModalOpen(true);
				}
				return;
			}
			const { latitude, longitude, radius, ...restSearch } = searchFilter.search;
			const updated: SalonsInquiry = { ...searchFilter, sort, search: restSearch, page: 1 };
			setSearchFilter(updated);
			await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
		} catch (err: any) {
			console.log('ERROR, sortHandler:', err);
		}
	}, [searchFilter]);

	const geoAllowHandler = useCallback(() => {
		setGeoModalOpen(false);
		requestGeoPermission(async (lat, lng) => {
			const updated = buildNearestFilter(lat, lng);
			setSearchFilter(updated);
			setPendingNearestFilter(null);
			await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
		});
	}, [searchFilter]);

	const geoSkipHandler = useCallback(async () => {
		setGeoModalOpen(false);
		const updated = buildNearestFilter(SEOUL_LAT, SEOUL_LNG);
		setSearchFilter(updated);
		setPendingNearestFilter(null);
		await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
	}, [searchFilter]);

	// Category chip — null=All, ''=backendsiz (bo'sh natija), SalonType=filtr
	const chipHandler = useCallback(async (chip: { value: SalonType | null | ''; label: string }) => {
		try {
			setActiveChip(chip.label);
			const search = { ...searchFilter.search };
			if (chip.value === null) {
				delete search.typeList;
			} else {
				search.typeList = [chip.value as SalonType];
			}
			const updated = { ...searchFilter, search, page: 1 };
			setSearchFilter(updated);
			await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
		} catch (err: any) {
			console.log('ERROR, chipHandler:', err);
		}
	}, [searchFilter]);

	// Reset — filter + TOP state'larni birga tozalaydi.
	// MUHIM: initialInput URL'dan kelgan eski qidiruv bo'lishi mumkin,
	// shuning uchun QAT'IY toza default ishlatamiz.
	const resetAllHandler = useCallback(async () => {
		const cleanDefault = {
			page: 1,
			limit: 9,
			sort: 'createdAt',
			direction: 'DESC' as any,
			search: {},
		};
		setSearchText('');
		setActiveChip('All');
		setActiveSort('createdAt');
		setSearchFilter(cleanDefault);
		await router.push(`/salons?input=${JSON.stringify(cleanDefault)}`, `/salons?input=${JSON.stringify(cleanDefault)}`, { scroll: false });
	}, []);

	const pageHandler = useCallback(async (page: number) => {
		const updated = { ...searchFilter, page };
		setSearchFilter(updated);
		await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [searchFilter]);

	/** GEO MODAL **/
	const GeoModal = () => (
		<Modal open={geoModalOpen} onClose={geoSkipHandler} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<Box component="div" className="geo-modal">
				<Stack alignItems="center" gap={2}>
					<Box component="div" className="gm-icon"><MyLocationIcon sx={{ fontSize: 28, color: '#FF4D8D' }} /></Box>
					<Typography className="gm-title">{t('Enable Location Access')}</Typography>
					<Typography className="gm-desc">
						{t('Allow BeautyNear to access your location to show the nearest salons. If you skip, we will show salons near Seoul.')}
					</Typography>
					<Stack direction="row" gap={1.5} sx={{ width: '100%' }}>
						<Button fullWidth onClick={geoSkipHandler} className="gm-skip">{t('Skip')}</Button>
						<Button fullWidth onClick={geoAllowHandler} className="gm-allow">{t('Allow Access')}</Button>
					</Stack>
				</Stack>
			</Box>
		</Modal>
	);

	/** Category chips bar (umumiy) **/
	const CategoryBar = () => (
		<Stack direction="row" className="cat-chips-bar">
			{TYPE_CHIPS.map((chip) => (
				<Box
					key={chip.label}
					component="div"
					onClick={() => chipHandler(chip)}
					className={`cat-chip ${activeChip === chip.label ? 'active' : ''} ${chip.value === null ? 'all' : ''}`}
				>
					<Box component="div" className="cc-icon">{chip.icon}</Box>
					<Typography className="cc-label">{t(chip.label)}</Typography>
				</Box>
			))}
		</Stack>
	);

	/** MOBILE **/
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

				<Box component="div" className="mobile-cat-scroll">
					<CategoryBar />
				</Box>

				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
					<Typography sx={{ fontSize: 13, color: '#888' }}>
						<Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{total}</Box> {t('salons found')}
					</Typography>
				</Stack>

				<Stack className="mobile-cards" gap={2} sx={{ px: 2 }}>
					{salons.length === 0 ? (
						<EmptyList emoji="💅" title={t('No salons found')} desc={t('Try changing your filters')} />
					) : (
						salons.map((salon) => <SalonCard key={salon._id} salon={salon} mode="full" onLike={likeHandler} />)
					)}
				</Stack>

				<Pagination page={searchFilter.page} limit={searchFilter.limit} total={total} onChange={pageHandler} />

				<Stack direction="row" className="mobile-bottom-bar">
					<Button fullWidth onClick={() => setMobileFilterOpen(true)} startIcon={<TuneIcon />} className="mobile-filter-btn">{t('Filter')}</Button>
					<Select value={activeSort} onChange={(e) => sortHandler(e.target.value)} size="small" className="mobile-sort-select">
						{SORT_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{t(s.label)}</MenuItem>)}
					</Select>
				</Stack>

				<Drawer anchor="bottom" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}
					PaperProps={{ sx: { borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflow: 'auto' } }}>
					<Box component="div" sx={{ p: 2 }}>
						<SalonFilter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} onReset={resetAllHandler} />
					</Box>
				</Drawer>
			</Stack>
		);
	}

	/** DESKTOP **/
	return (
		<Stack className="salons-page">
			<GeoModal />

			{/* Top search bar */}
			<Stack className="salons-top-bar">
				<Stack className="salons-top-inner">
					<Stack className="search-row" direction="row" alignItems="center" gap={2}>
						{/* Search input — alohida panel */}
						<Box component="div" className="search-box">
							<OutlinedInput
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								placeholder={t('Search salons, specialists, services...')}
								onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
								className="sp-input"
								startAdornment={<InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /></InputAdornment>}
							/>
						</Box>

						{/* Location — alohida panel */}
						<Box component="div" className="location-box">
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
									await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
								}}
								variant="standard"
								disableUnderline
								className="sp-select"
							>
								{Object.values(SalonLocation).map((loc) => (
									<MenuItem key={loc} value={loc}>{loc === SalonLocation.ALL ? `🇰🇷 ${t('All Korea')}` : loc}</MenuItem>
								))}
							</Select>
						</Box>

						{/* Find Now — alohida tugma */}
						<Button className="find-now-btn" onClick={searchHandler}>{t('Find Now')}</Button>
					</Stack>

					{/* Category chips */}
					<CategoryBar />
				</Stack>
			</Stack>

			{/* Main */}
			<Stack direction="row" className="salons-main">
				<Box component="div" className="salons-sidebar">
					<SalonFilter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} onReset={resetAllHandler} />
				</Box>

				<Stack className="salons-content">
					<Stack direction="row" justifyContent="space-between" alignItems="center" className="results-header">
						<Typography className="results-count">
							<Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{total}</Box> {t('salons found')}
						</Typography>
						<Stack direction="row" alignItems="center" gap={1}>
							<Typography sx={{ fontSize: 13, color: '#888' }}>{t('Sort by')}:</Typography>
							{SORT_OPTIONS.map((s) => (
								<Box key={s.value} component="div" onClick={() => sortHandler(s.value)}
									className={`sort-chip ${activeSort === s.value ? 'active' : ''}`}>
									{t(s.label)}
								</Box>
							))}
						</Stack>
					</Stack>

					{salons.length === 0 ? (
						<EmptyList emoji="💅" title={t('No salons found')} desc={t('Try adjusting your filters or search terms')} buttonText="Clear filters" onButtonClick={resetAllHandler} />
					) : (
						<Stack className="salons-grid">
							{salons.map((salon) => <SalonCard key={salon._id} salon={salon} mode="full" onLike={likeHandler} />)}
						</Stack>
					)}

					{salons.length !== 0 && (
						<Stack className="salons-pagination">
							<Pagination page={searchFilter.page} limit={searchFilter.limit} total={total} onChange={pageHandler} />
							<Typography className="total-result">
								{t('Total')} {total} {total > 1 ? t('salons') : t('salon')} {t('available')}
							</Typography>
						</Stack>
					)}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Salons);