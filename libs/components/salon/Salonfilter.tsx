import React, { useCallback, useEffect, useState } from 'react';
import {
	Stack, Box, Typography, Checkbox, Button, Switch,
	OutlinedInput, Radio, RadioGroup, FormControlLabel,
	Slider, IconButton, Collapse,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import TuneIcon from '@mui/icons-material/Tune';
import { SalonLocation, SalonType } from '../../enums/salon.enum';
import { SalonsInquiry } from '../../types/salon/salon.input';

const LOCATIONS = Object.values(SalonLocation);
const TYPES = Object.values(SalonType);
const RATINGS = [
	{ value: 4.5, label: '4.5 & above' },
	{ value: 4.0, label: '4.0 & above' },
	{ value: 3.5, label: '3.5 & above' },
];
const TYPE_EMOJI: Record<SalonType, string> = {
	[SalonType.HAIR]: '✂️',
	[SalonType.NAIL]: '💅',
	[SalonType.SKIN]: '🧴',
	[SalonType.CLINIC]: '💉',
	[SalonType.MASSAGE]: '🪷',
};

interface SalonFilterProps {
	searchFilter: SalonsInquiry;
	setSearchFilter: (v: SalonsInquiry) => void;
	initialInput: SalonsInquiry;
	onReset?: () => void;
}

// Collapsible section — alohida karta
const FilterSection = ({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) => {
	const [open, setOpen] = useState(true);
	return (
		<Box component="div" className="filter-section">
			<Stack direction="row" justifyContent="space-between" alignItems="center"
				onClick={() => setOpen(!open)} className="filter-section-header">
				<Typography className="filter-section-title">
					{icon && <span style={{ marginRight: 6 }}>{icon}</span>}
					{title}
				</Typography>
				{open ? <ExpandLessIcon sx={{ fontSize: 16, color: '#888' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: '#888' }} />}
			</Stack>
			<Collapse in={open}>
				<Box component="div" className="filter-section-body">{children}</Box>
			</Collapse>
		</Box>
	);
};

// ⚠️ .toLocaleString() ISHLATMAYMIZ — server va brauzer turli locale bilan
// formatlab, hydration mismatch xatosiga olib keladi.
const formatPrice = (n?: number): string => {
	if (n === undefined || n === null) return '0';
	return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const SalonFilter = ({ searchFilter, setSearchFilter, initialInput, onReset }: SalonFilterProps) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [specialistText, setSpecialistText] = useState('');
	const [priceRange, setPriceRange] = useState<number[]>([10000, 500000]);
	const [openNow, setOpenNow] = useState(false);
	const [minRating, setMinRating] = useState<number | null>(null);

	/** LIFECYCLES — Nestar: bo'sh listlarni o'chirish (page default ga qaytadi) **/
	useEffect(() => {
		if (searchFilter?.search?.locationList?.length === 0) {
			const updated = { ...searchFilter, search: { ...searchFilter.search } };
			delete updated.search.locationList;
			setSearchFilter(updated);
			router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false }).then();
		}
		if (searchFilter?.search?.typeList?.length === 0) {
			const updated = { ...searchFilter, search: { ...searchFilter.search } };
			delete updated.search.typeList;
			setSearchFilter(updated);
			router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false }).then();
		}
	}, [searchFilter]);

	/** HANDLERS **/

	// Location — radio (bitta tanlanadi)
	const locationHandler = useCallback(async (location: SalonLocation) => {
		try {
			let updated: SalonsInquiry;
			if (location === SalonLocation.ALL) {
				const { locationList, ...restSearch } = searchFilter.search;
				updated = { ...searchFilter, search: restSearch, page: 1 };
			} else {
				updated = { ...searchFilter, search: { ...searchFilter.search, locationList: [location] }, page: 1 };
			}
			setSearchFilter(updated);
			await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
		} catch (err: any) {
			console.log('ERROR, locationHandler:', err);
		}
	}, [searchFilter]);

	// Type — checkbox (qo'shish/o'chirish). O'chirilganda bo'sh bo'lsa typeList delete → default
	const typeHandler = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const isChecked = e.target.checked;
			const value = e.target.value as SalonType;
			const current = searchFilter.search.typeList ?? [];
			const typeList = isChecked ? [...current, value] : current.filter((tt) => tt !== value);

			let updated: SalonsInquiry;
			if (typeList.length) {
				updated = { ...searchFilter, search: { ...searchFilter.search, typeList }, page: 1 };
			} else {
				// Bo'sh → o'chirish → default page
				const { typeList: _omit, ...restSearch } = searchFilter.search;
				updated = { ...searchFilter, search: restSearch, page: 1 };
			}
			setSearchFilter(updated);
			await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
		} catch (err: any) {
			console.log('ERROR, typeHandler:', err);
		}
	}, [searchFilter]);

	// Price range — backend SISearch da price field YO'Q,
	// shuning uchun faqat vizual (state) — backendga yuborilmaydi
	const priceHandler = useCallback((values: number[]) => {
		setPriceRange(values);
	}, []);

	// Rating
	const ratingHandler = useCallback(async (rating: number) => {
		try {
			const newRating = minRating === rating ? null : rating;
			setMinRating(newRating);
			const updated: SalonsInquiry = { ...searchFilter, page: 1 };
			setSearchFilter(updated);
			await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
		} catch (err: any) {
			console.log('ERROR, ratingHandler:', err);
		}
	}, [searchFilter, minRating]);

	// Open Now
	const openNowHandler = useCallback(async (checked: boolean) => {
		setOpenNow(checked);
		console.log('openNow:', checked);
	}, []);

	// Specialist name
	const specialistHandler = useCallback(async () => {
		try {
			const updated: SalonsInquiry = {
				...searchFilter,
				search: { ...searchFilter.search, text: specialistText },
				page: 1,
			};
			setSearchFilter(updated);
			await router.push(`/salons?input=${JSON.stringify(updated)}`, `/salons?input=${JSON.stringify(updated)}`, { scroll: false });
		} catch (err: any) {
			console.log('ERROR, specialistHandler:', err);
		}
	}, [searchFilter, specialistText]);

	// Reset — filter lokal state + parent (top) state'larni tozalaydi
	const refreshHandler = useCallback(async () => {
		try {
			setSpecialistText('');
			setPriceRange([10000, 500000]);
			setOpenNow(false);
			setMinRating(null);
			if (onReset) {
				// Parent (salons-index) top state'larni ham tozalaydi va refetch qiladi
				onReset();
			} else {
				setSearchFilter(initialInput);
				await router.push(`/salons?input=${JSON.stringify(initialInput)}`, `/salons?input=${JSON.stringify(initialInput)}`, { scroll: false });
			}
		} catch (err: any) {
			console.log('ERROR, refreshHandler:', err);
		}
	}, [initialInput, onReset]);

	const activeLocation = searchFilter.search.locationList?.[0] ?? SalonLocation.ALL;

	return (
		<Stack className="salon-filter">
			{/* Header */}
			<Stack direction="row" justifyContent="space-between" alignItems="center" className="filter-header">
				<Stack direction="row" alignItems="center" gap={1}>
					<TuneIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
					<Typography className="filter-title">{t('Filters')}</Typography>
				</Stack>
			</Stack>

			{/* Location */}
			<FilterSection title={t('Location')} icon="📍">
				<RadioGroup value={activeLocation}>
					{LOCATIONS.map((loc) => (
						<FormControlLabel
							key={loc}
							value={loc}
							onClick={() => locationHandler(loc)}
							control={<Radio size="small" sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.5 }} />}
							label={
								<Typography sx={{ fontSize: 13, color: activeLocation === loc ? '#FF4D8D' : '#333', fontWeight: activeLocation === loc ? 600 : 400 }}>
									{loc === SalonLocation.ALL ? `🇰🇷 ${t('All Korea')}` : loc}
								</Typography>
							}
						/>
					))}
				</RadioGroup>
			</FilterSection>

			{/* Salon Type */}
			<FilterSection title={t('Salon Type')} icon="✂️">
				{TYPES.map((type) => (
					<Stack key={type} direction="row" alignItems="center" className="filter-check-row">
						<Checkbox
							size="small"
							value={type}
							checked={(searchFilter.search.typeList ?? []).includes(type)}
							onChange={typeHandler}
							sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.5 }}
						/>
						<Typography sx={{ fontSize: 13, color: '#333' }}>{TYPE_EMOJI[type]} {t(type)}</Typography>
					</Stack>
				))}
			</FilterSection>

			{/* Price Range */}
			<FilterSection title={t('Price Range')} icon="💰">
				<Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
					<Typography sx={{ fontSize: 11, color: '#888' }}>₩{formatPrice(priceRange[0])}</Typography>
					<Typography sx={{ fontSize: 11, color: '#888' }}>₩{formatPrice(priceRange[1])}+</Typography>
				</Stack>
				<Slider
					value={priceRange}
					onChange={(_, val) => setPriceRange(val as number[])}
					min={10000} max={500000} step={10000}
					sx={{
						color: '#FF4D8D',
						'& .MuiSlider-thumb': { width: 16, height: 16, '&:hover': { boxShadow: '0 0 0 8px rgba(255,77,141,0.1)' } },
						'& .MuiSlider-track': { height: 4 },
						'& .MuiSlider-rail': { height: 4, opacity: 0.3 },
					}}
				/>
			</FilterSection>

			{/* Rating */}
			<FilterSection title={t('Minimum Rating')} icon="⭐">
				<RadioGroup value={minRating ?? ''}>
					{RATINGS.map((r) => (
						<FormControlLabel
							key={r.value}
							value={r.value}
							onClick={() => ratingHandler(r.value)}
							control={<Radio size="small" sx={{ color: 'rgba(255,77,141,0.4)', '&.Mui-checked': { color: '#FF4D8D' }, py: 0.5 }} />}
							label={
								<Stack direction="row" alignItems="center" gap={0.5}>
									{[1, 2, 3, 4, 5].map((s) => (
										<span key={s} style={{ fontSize: 12, color: s <= Math.floor(r.value) ? '#FFB800' : '#ddd' }}>★</span>
									))}
									<Typography sx={{ fontSize: 12, color: '#555' }}>{r.label}</Typography>
								</Stack>
							}
						/>
					))}
				</RadioGroup>
			</FilterSection>

			{/* Open Now */}
			<FilterSection title={t('Open Now')} icon="🕐">
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography sx={{ fontSize: 13, color: '#555' }}>{t('Show only open salons')}</Typography>
					<Switch
						checked={openNow}
						onChange={(e) => openNowHandler(e.target.checked)}
						sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#FF4D8D' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FF4D8D' } }}
					/>
				</Stack>
			</FilterSection>

			{/* Specialist Name */}
			<FilterSection title={t('Salon Name')} icon="👤">
				<Stack direction="row" alignItems="center" gap={1} className="specialist-search">
					<OutlinedInput
						size="small"
						value={specialistText}
						onChange={(e) => setSpecialistText(e.target.value)}
						placeholder={t('Search by name...')}
						onKeyDown={(e) => e.key === 'Enter' && specialistHandler()}
						sx={{
							flex: 1, fontSize: 13, borderRadius: 2,
							'& fieldset': { borderColor: 'rgba(255,77,141,0.2)' },
							'&:hover fieldset': { borderColor: '#FF4D8D !important' },
							'&.Mui-focused fieldset': { borderColor: '#FF4D8D !important' },
						}}
					/>
					<IconButton onClick={specialistHandler} sx={{ width: 36, height: 36, background: '#FF4D8D', color: '#fff', borderRadius: 1.5, '&:hover': { background: '#e53578' } }}>
						<SearchIcon sx={{ fontSize: 18 }} />
					</IconButton>
				</Stack>
			</FilterSection>

			{/* Reset */}
			<Box component="div" className="filter-reset-wrap">
				<Button fullWidth onClick={refreshHandler} className="reset-btn" startIcon={<RefreshIcon />}>{t('Reset')}</Button>
			</Box>
		</Stack>
	);
};

export default SalonFilter;