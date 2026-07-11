import React from 'react';
import { Stack, Box, Typography } from '@mui/material';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const STEPS = [
    {
        num: 1,
        icon: <TravelExploreOutlinedIcon />,
        title: 'Search',
        desc: ['Find the best salons', 'or clinics near you'],
    },
    {
        num: 2,
        icon: <MarkEmailReadOutlinedIcon />,
        title: 'Choose & Book',
        desc: ['Pick your service,', 'check reviews and book'],
    },
    {
        num: 3,
        icon: <CelebrationOutlinedIcon />,
        title: 'Pay Deposit & Visit',
        desc: ['Pay a small deposit', 'and enjoy your beauty time'],
    },
];

// Egri chiziqli dashed connector
const Connector = () => (
    <Box component="div" className="hiw-connector">
        <svg width="120" height="56" viewBox="0 0 120 56" fill="none">
            <path
                d="M4,34 C28,10 44,50 62,28 C70,18 74,38 86,30 S110,18 116,24"
                stroke="#FFB8CF"
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeLinecap="round"
                opacity="0.7"
            />
        </svg>
    </Box>
);

const HowItWorks = () => {
    const { t } = useTranslation('common');
    const device = useDeviceDetect();

    /** MOBILE **/
    if (device === 'mobile') {
        return (
            <Stack className="how-it-works-section mobile">
                <Typography className="hiw-title">{t('How It Works')}</Typography>
                <Stack className="hiw-steps-mobile">
                    {STEPS.map((step) => (
                        <Stack key={step.num} direction="row" alignItems="center" className="hiw-card">
                            <Box component="div" className="hiw-icon-circle">{step.icon}</Box>
                            <Stack className="hiw-text">
                                <Stack direction="row" alignItems="center" gap={1}>
                                    <Box component="div" className="hiw-num">{step.num}</Box>
                                    <Typography className="hiw-step-title">{t(step.title)}</Typography>
                                </Stack>
                                <Typography className="hiw-step-desc">
                                    {t(step.desc[0])} {t(step.desc[1])}
                                </Typography>
                            </Stack>
                        </Stack>
                    ))}
                </Stack>
            </Stack>
        );
    }

    /** PC **/
    return (
        <Stack className="how-it-works-section">
            <Stack className="hiw-container">
                <Typography className="hiw-title">{t('How It Works')}</Typography>

                <Stack direction="row" alignItems="center" justifyContent="center" className="hiw-steps">
                    {STEPS.map((step, i) => (
                        <React.Fragment key={step.num}>
                            <Stack direction="row" alignItems="center" className="hiw-card">
                                <Box component="div" className="hiw-icon-circle">{step.icon}</Box>
                                <Stack className="hiw-text">
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Box component="div" className="hiw-num">{step.num}</Box>
                                        <Typography className="hiw-step-title">{t(step.title)}</Typography>
                                    </Stack>
                                    <Typography className="hiw-step-desc">
                                        {t(step.desc[0])}
                                        <br />
                                        {t(step.desc[1])}
                                    </Typography>
                                </Stack>
                            </Stack>

                            {i < STEPS.length - 1 && <Connector />}
                        </React.Fragment>
                    ))}
                </Stack>
            </Stack>
        </Stack>
    );
};

export default HowItWorks;