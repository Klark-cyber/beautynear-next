import React, { useCallback, useRef, useState } from 'react';
import { Stack, Box, Typography, IconButton } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { SalonType } from '../../enums/salon.enum';

interface CategoryItem {
    value: SalonType | null;
    label: string;
    emoji: string;
}

// Backend SalonType enumiga mos kategoriyalar
const CATEGORIES: CategoryItem[] = [
    { value: null, label: 'All', emoji: '' },
    { value: SalonType.NAIL, label: 'Nail Art', emoji: '💅' },
    { value: SalonType.SKIN, label: 'Facial', emoji: '🧖‍♀️' },
    { value: SalonType.HAIR, label: 'Hair', emoji: '💇‍♀️' },
    { value: SalonType.CLINIC, label: 'Skin Clinic', emoji: '🧴' },
    { value: SalonType.MASSAGE, label: 'Massage & Spa', emoji: '🪷' },
];

const CategoryChips = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const [active, setActive] = useState<SalonType | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    /** HANDLERS **/
    const chipHandler = useCallback(
        async (value: SalonType | null) => {
            try {
                setActive(value);
                const input: any = {
                    page: 1,
                    limit: 9,
                    sort: 'createdAt',
                    direction: 'DESC',
                    search: {},
                };
                if (value) input.search.typeList = [value];

                await router.push(`/salons?input=${JSON.stringify(input)}`, `/salons?input=${JSON.stringify(input)}`);
            } catch (err: any) {
                console.log('ERROR, chipHandler:', err);
            }
        },
        [router],
    );

    const scrollNextHandler = useCallback(() => {
        scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
    }, []);

    /** MOBILE **/
    if (device === 'mobile') {
        return (
            <Stack className="category-chips-section mobile">
                <Box component="div" className="chips-wrap" ref={scrollRef}>
                    {CATEGORIES.map((cat) => (
                        <Box
                            key={cat.label}
                            component="div"
                            className={`cat-chip ${cat.value === null ? 'all-chip' : ''} ${active === cat.value ? 'active' : ''}`}
                            onClick={() => chipHandler(cat.value)}
                        >
                            {cat.emoji && <Box component="div" className="chip-icon">{cat.emoji}</Box>}
                            <Typography className="chip-label">{t(cat.label)}</Typography>
                        </Box>
                    ))}
                </Box>
            </Stack>
        );
    }

    /** PC **/
    return (
        <Stack className="category-chips-section">
            <Stack className="chips-container" direction="row" alignItems="center">
                {/* Scrollable chips */}
                <Box component="div" className="chips-wrap" ref={scrollRef}>
                    {CATEGORIES.map((cat) =>
                        cat.value === null ? (
                            /* ALL — gradient doira */
                            <Box
                                key="all"
                                component="div"
                                className={`all-chip ${active === null ? 'active' : ''}`}
                                onClick={() => chipHandler(null)}
                            >
                                {t('All')}
                            </Box>
                        ) : (
                            /* Oddiy pill chip */
                            <Box
                                key={cat.label}
                                component="div"
                                className={`cat-chip ${active === cat.value ? 'active' : ''}`}
                                onClick={() => chipHandler(cat.value)}
                            >
                                <Box component="div" className="chip-icon">{cat.emoji}</Box>
                                <Typography className="chip-label">{t(cat.label)}</Typography>
                            </Box>
                        ),
                    )}
                </Box>

                {/* Next arrow */}
                <IconButton className="chips-next" onClick={scrollNextHandler}>
                    <ChevronRightIcon />
                </IconButton>
            </Stack>
        </Stack>
    );
};

export default CategoryChips;