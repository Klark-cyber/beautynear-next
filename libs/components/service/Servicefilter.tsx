import React, { useState } from 'react';
import { Stack, Box, Typography, Checkbox, Radio, Slider, Button } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StarIcon from '@mui/icons-material/Star';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTranslation } from 'next-i18next';
import { ServiceType } from '../../enums/service.enum';
import { SalonLocation } from '../../enums/salon.enum';

interface ServicefilterProps {
    onApply: (search: any, minRating: number) => void;
    onReset: () => void;
}

const PRICE_MIN = 10000;
const PRICE_MAX = 500000;

// Hydration-safe narx (toLocaleString server/client farq qiladi)
const fmt = (n: number): string => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/* Duration variantlari — backend durationMax (faqat maksimum) qabul qiladi */
const DURATION_OPTIONS = [
    { label: 'Under 30 min', value: 30 },
    { label: 'Under 60 min', value: 60 },
    { label: 'Under 90 min', value: 90 },
    { label: 'Any duration', value: 0 },
];

/* Service Type — backend enum bilan mos (label rasmdagidek) */
const TYPE_OPTIONS: { label: string; value: ServiceType }[] = [
    { label: 'Facial', value: ServiceType.SKIN },
    { label: 'Nail', value: ServiceType.NAIL },
    { label: 'Hair', value: ServiceType.HAIR },
    { label: 'Massage', value: ServiceType.MASSAGE },
    { label: 'Clinic', value: ServiceType.CLINIC },
];

const Servicefilter = ({ onApply, onReset }: ServicefilterProps) => {
    const { t } = useTranslation('common');

    const [location, setLocation] = useState<string>(''); // '' = All Korea
    const [types, setTypes] = useState<ServiceType[]>([]);
    const [priceRange, setPriceRange] = useState<number[]>([PRICE_MIN, PRICE_MAX]);
    const [minRating, setMinRating] = useState<number>(0);
    const [durationMax, setDurationMax] = useState<number>(0);

    const typeToggle = (value: ServiceType) => {
        setTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    };

    const applyHandler = () => {
        const search: any = {};
        if (location) search.locationList = [location];
        else search.locationList = undefined;
        if (types.length > 0) search.typeList = types;
        else search.typeList = undefined;
        if (priceRange[0] > PRICE_MIN) search.priceMin = priceRange[0];
        else search.priceMin = undefined;
        if (priceRange[1] < PRICE_MAX) search.priceMax = priceRange[1];
        else search.priceMax = undefined;
        if (durationMax > 0) search.durationMax = durationMax;
        else search.durationMax = undefined;

        onApply(search, minRating);
    };

    const resetHandler = () => {
        setLocation('');
        setTypes([]);
        setPriceRange([PRICE_MIN, PRICE_MAX]);
        setMinRating(0);
        setDurationMax(0);
        onReset();
    };

    return (
        <Stack className="service-filter">
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" className="sf-header">
                <Typography className="sf-title">{t('Filters')}</Typography>
                <TuneIcon sx={{ fontSize: 20, color: '#555' }} />
            </Stack>

            {/* ── Location ── */}
            <Stack className="sf-section">
                <Stack direction="row" alignItems="center" gap={0.75} className="sf-section-title">
                    <LocationOnOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography className="sf-label">{t('Location')}</Typography>
                </Stack>
                <Stack className="sf-options">
                    <Stack direction="row" alignItems="center" className="sf-option" onClick={() => setLocation('')}>
                        <Radio checked={location === ''} size="small" className="sf-radio" />
                        <Typography className="sf-option-label">{t('All Korea')}</Typography>
                    </Stack>
                    {Object.values(SalonLocation).map((loc) => (
                        <Stack key={loc} direction="row" alignItems="center" className="sf-option" onClick={() => setLocation(loc)}>
                            <Radio checked={location === loc} size="small" className="sf-radio" />
                            <Typography className="sf-option-label">{t(loc)}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Stack>

            {/* ── Service Type ── */}
            <Stack className="sf-section">
                <Stack direction="row" alignItems="center" gap={0.75} className="sf-section-title">
                    <ContentCutIcon sx={{ fontSize: 16 }} />
                    <Typography className="sf-label">{t('Service Type')}</Typography>
                </Stack>
                <Stack className="sf-options">
                    {TYPE_OPTIONS.map((opt) => (
                        <Stack
                            key={opt.value}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            className="sf-option"
                            onClick={() => typeToggle(opt.value)}
                        >
                            <Typography className="sf-option-label">{t(opt.label)}</Typography>
                            <Checkbox checked={types.includes(opt.value)} size="small" className="sf-checkbox" />
                        </Stack>
                    ))}
                </Stack>
            </Stack>

            {/* ── Price Range ── */}
            <Stack className="sf-section">
                <Stack direction="row" alignItems="center" gap={0.75} className="sf-section-title">
                    <PaidOutlinedIcon sx={{ fontSize: 17 }} />
                    <Typography className="sf-label">{t('Price Range')}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, mb: 0.5 }}>
                    <Typography className="sf-price-label">₩{fmt(priceRange[0])}</Typography>
                    <Typography className="sf-price-label">
                        ₩{fmt(priceRange[1])}
                        {priceRange[1] >= PRICE_MAX ? '+' : ''}
                    </Typography>
                </Stack>
                <Slider
                    value={priceRange}
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={10000}
                    onChange={(_e, v) => setPriceRange(v as number[])}
                    className="sf-slider"
                    sx={{
                        color: '#FF4D8D',
                        '& .MuiSlider-thumb': { width: 16, height: 16, background: '#FF4D8D' },
                        '& .MuiSlider-rail': { background: '#f0d5de' },
                    }}
                />
            </Stack>

            {/* ── Minimum Rating (frontend-side) ── */}
            <Stack className="sf-section">
                <Stack direction="row" alignItems="center" gap={0.75} className="sf-section-title">
                    <StarBorderIcon sx={{ fontSize: 17 }} />
                    <Typography className="sf-label">{t('Minimum Rating')}</Typography>
                </Stack>
                <Stack className="sf-options">
                    {[4.5, 4.0].map((r) => (
                        <Stack key={r} direction="row" alignItems="center" className="sf-option" onClick={() => setMinRating(minRating === r ? 0 : r)}>
                            <Radio checked={minRating === r} size="small" className="sf-radio" />
                            <Typography className="sf-option-label">{r} & {t('above')}</Typography>
                            <Stack direction="row" sx={{ ml: 1 }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <StarIcon
                                        key={s}
                                        sx={{ fontSize: 14, color: s <= Math.floor(r) ? '#FFB800' : '#e0e0e0' }}
                                    />
                                ))}
                            </Stack>
                        </Stack>
                    ))}
                </Stack>
            </Stack>

            {/* ── Duration ── */}
            <Stack className="sf-section">
                <Stack direction="row" alignItems="center" gap={0.75} className="sf-section-title">
                    <AccessTimeIcon sx={{ fontSize: 17 }} />
                    <Typography className="sf-label">{t('Duration')}</Typography>
                </Stack>
                <Stack className="sf-options">
                    {DURATION_OPTIONS.map((opt) => (
                        <Stack
                            key={opt.label}
                            direction="row"
                            alignItems="center"
                            className="sf-option"
                            onClick={() => setDurationMax(opt.value)}
                        >
                            <Radio checked={durationMax === opt.value} size="small" className="sf-radio" />
                            <Typography className="sf-option-label">{t(opt.label)}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Stack>

            {/* ── Tugmalar ── */}
            <Button fullWidth className="sf-apply-btn" onClick={applyHandler}>
                {t('Apply Filters')}
            </Button>
            <Button fullWidth className="sf-reset-btn" startIcon={<RestartAltIcon />} onClick={resetHandler}>
                {t('Reset')}
            </Button>
        </Stack>
    );
};

export default Servicefilter;