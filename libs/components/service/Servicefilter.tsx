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

// ⚠️ TUZATILDI: avval ikonlarsiz edi — endi Salonfilter bilan bir xil emoji
const TYPE_OPTIONS: { label: string; value: ServiceType; emoji: string }[] = [
    { label: 'Hair', value: ServiceType.HAIR, emoji: '✂️' },
    { label: 'Nail', value: ServiceType.NAIL, emoji: '💅' },
    { label: 'Facial', value: ServiceType.SKIN, emoji: '🧴' },
    { label: 'Clinic', value: ServiceType.CLINIC, emoji: '💉' },
    { label: 'Massage', value: ServiceType.MASSAGE, emoji: '🪷' },
];

// ⚠️ MUHIM: avval "Apply Filters" tugmasi bosilmaguncha HECH NARSA
// qo'llanmasdi. Endi Salonfilter bilan bir xil — HAR bir tanlov
// DARHOL qo'llanadi (tugma shart emas).

const Servicefilter = ({ onApply, onReset }: ServicefilterProps) => {
    const { t } = useTranslation('common');

    const [location, setLocation] = useState<string>(''); // '' = All Korea
    const [types, setTypes] = useState<ServiceType[]>([]);
    const [priceRange, setPriceRange] = useState<number[]>([PRICE_MIN, PRICE_MAX]);
    const [minRating, setMinRating] = useState<number>(0);
    const [durationMax, setDurationMax] = useState<number>(0);

    const buildAndApply = (overrides: Partial<{ location: string; types: ServiceType[]; priceRange: number[]; minRating: number; durationMax: number }> = {}) => {
        const loc = overrides.location !== undefined ? overrides.location : location;
        const ty = overrides.types !== undefined ? overrides.types : types;
        const pr = overrides.priceRange !== undefined ? overrides.priceRange : priceRange;
        const mr = overrides.minRating !== undefined ? overrides.minRating : minRating;
        const dm = overrides.durationMax !== undefined ? overrides.durationMax : durationMax;

        const search: any = {};
        search.locationList = loc ? [loc] : undefined;
        search.typeList = ty.length > 0 ? ty : undefined;
        search.priceMin = pr[0] > PRICE_MIN ? pr[0] : undefined;
        search.priceMax = pr[1] < PRICE_MAX ? pr[1] : undefined;
        search.durationMax = dm > 0 ? dm : undefined;

        onApply(search, mr);
    };

    const locationHandler = (value: string) => {
        setLocation(value);
        buildAndApply({ location: value });
    };

    const typeToggle = (value: ServiceType) => {
        const next = types.includes(value) ? types.filter((v) => v !== value) : [...types, value];
        setTypes(next);
        buildAndApply({ types: next });
    };

    const ratingHandler = (r: number) => {
        const next = minRating === r ? 0 : r;
        setMinRating(next);
        buildAndApply({ minRating: next });
    };

    const durationHandler = (value: number) => {
        setDurationMax(value);
        buildAndApply({ durationMax: value });
    };

    // Narx — sudralayotganda emas, QO'YIB YUBORILGANDA qo'llanadi (ortiqcha sorovlarning oldini olish uchun)
    const priceCommitHandler = (_e: any, v: number | number[]) => {
        const next = v as number[];
        setPriceRange(next);
        buildAndApply({ priceRange: next });
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
                    <Stack direction="row" alignItems="center" className="sf-option" onClick={() => locationHandler('')}>
                        <Radio checked={location === ''} size="small" className="sf-radio" />
                        <Typography className="sf-option-label">{t('All Korea')}</Typography>
                    </Stack>
                    {Object.values(SalonLocation).map((loc) => (
                        <Stack key={loc} direction="row" alignItems="center" className="sf-option" onClick={() => locationHandler(loc)}>
                            <Radio checked={location === loc} size="small" className="sf-radio" />
                            <Typography className="sf-option-label">{t(loc)}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Stack>

            {/* ── Service Type — endi ikonlar bilan, Salon bilan bir xil tartibda ── */}
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
                            <Typography className="sf-option-label">{opt.emoji} {t(opt.label)}</Typography>
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
                    onChangeCommitted={priceCommitHandler}
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
                        <Stack key={r} direction="row" alignItems="center" className="sf-option" onClick={() => ratingHandler(r)}>
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
                            onClick={() => durationHandler(opt.value)}
                        >
                            <Radio checked={durationMax === opt.value} size="small" className="sf-radio" />
                            <Typography className="sf-option-label">{t(opt.label)}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Stack>

            {/* ⚠️ TUZATILDI: "Apply Filters" tugmasi olib tashlandi — har bir
               tanlov endi DARHOL qo'llanadi (Salonfilter bilan bir xil) */}
            <Button fullWidth className="sf-reset-btn" startIcon={<RestartAltIcon />} onClick={resetHandler}>
                {t('Reset')}
            </Button>
        </Stack>
    );
};

export default Servicefilter;