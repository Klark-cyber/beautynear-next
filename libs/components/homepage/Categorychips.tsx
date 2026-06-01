import React, { useState } from 'react';
import { Stack, Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { ServiceType } from '../../enums/service.enum';

const CATEGORIES = [
    { type: ServiceType.NAIL, label: 'Nails', emoji: '💅' },
    { type: ServiceType.SKIN, label: 'Facial', emoji: '🧖‍♀️' },
    { type: ServiceType.HAIR, label: 'Hair', emoji: '💇‍♀️' },
    { type: null, label: 'Lash & Brow', emoji: '👁️' },
    { type: ServiceType.CLINIC, label: 'Skin Clinic', emoji: '🧴' },
    { type: ServiceType.CLINIC, label: 'Botox', emoji: '💉' },
    { type: ServiceType.MASSAGE, label: 'Spa', emoji: '🪷' },
];

const CategoryChips = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const [active, setActive] = useState<string | null>(null);

    const clickHandler = (label: string, type: ServiceType | null) => {
        setActive(label);
        const query: any = { page: 1, limit: 9 };
        if (type) query.serviceType = type;
        router.push({ pathname: '/services', query });
    };

    const chipSx = (label: string) => ({
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 0.5,
        px: device === 'mobile' ? 1.5 : 2,
        py: device === 'mobile' ? 1 : 1.25,
        borderRadius: 3,
        cursor: 'pointer',
        border: '1.5px solid',
        borderColor: active === label ? '#FF4D8D' : 'rgba(255,77,141,0.15)',
        background: active === label ? 'rgba(255,77,141,0.08)' : '#fff',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        '&:hover': {
            borderColor: '#FF4D8D',
            background: 'rgba(255,77,141,0.06)',
            transform: 'translateY(-3px)',
            boxShadow: '0 6px 20px rgba(255,77,141,0.15)',
        },
        '&:active': { transform: 'translateY(-1px)' },
    });

    return (
        <Stack
			sx= {{
        py: device === 'mobile' ? 1.5 : 2.5,
            px: device === 'mobile' ? 2 : 4,
                background: '#fff',
                    borderBottom: '1px solid rgba(255,77,141,0.08)',
                        overflowX: 'auto',
                            '&::-webkit-scrollbar': { display: 'none' },
    }
}
		>
    <Stack
				direction="row"
gap = { device === 'mobile' ? 1 : 1.5}
sx = {{
    maxWidth: 1280,
        mx: 'auto',
            width: '100%',
                justifyContent: device === 'mobile' ? 'flex-start' : 'center',
				}}
			>
{
    CATEGORIES.map((cat) => (
        <Box
						key= { cat.label }
						component = "div"
						onClick = {() => clickHandler(cat.label, cat.type)}
sx = { chipSx(cat.label) }
    >
    <Typography sx={ { fontSize: device === 'mobile' ? 20 : 24 } }> { cat.emoji } </Typography>
        < Typography
sx = {{
    fontSize: device === 'mobile' ? 10 : 12,
        fontWeight: active === cat.label ? 700 : 500,
            color: active === cat.label ? '#FF4D8D' : '#555',
                whiteSpace: 'nowrap',
                    transition: 'color 0.2s',
							}}
						>
    { t(cat.label) }
    </Typography>
    </Box>
				))}
</Stack>
    </Stack>
	);
};

export default CategoryChips;