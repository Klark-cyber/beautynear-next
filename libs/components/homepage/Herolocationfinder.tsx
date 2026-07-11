import React, { useCallback, useState } from 'react';
import { Stack, Typography, Button } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useTranslation } from 'next-i18next';

const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.978;

const HeaderLocationFinder = () => {
    const { t } = useTranslation('common');
    // Geo bar har safar saytga kirganda ko'rinadi —
    // user joylashuvi o'zgarishi mumkin, shu sabab storage da saqlanmaydi
    const [showGeo, setShowGeo] = useState(true);

    /** HANDLERS **/
    const allowGeoHandler = useCallback(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // Har safar yangi (real) koordinatalar saqlanadi
                localStorage.setItem('userLat', String(pos.coords.latitude));
                localStorage.setItem('userLng', String(pos.coords.longitude));
                setShowGeo(false);
            },
            () => {
                // GPS rad etilsa — Seoul default
                localStorage.setItem('userLat', String(SEOUL_LAT));
                localStorage.setItem('userLng', String(SEOUL_LNG));
                setShowGeo(false);
            },
        );
    }, []);

    const skipHandler = useCallback(() => {
        setShowGeo(false);
    }, []);

    if (!showGeo) return null;

    return (
        <Stack direction="row" alignItems="center" gap={2} className="geo-bar">
            <MyLocationIcon className="geo-icon" />
            <Typography className="geo-text">
                {t('Allow location access to see salons near you')}
            </Typography>
            <Button className="geo-allow" onClick={allowGeoHandler}>{t('Allow')}</Button>
            <Button className="geo-skip" onClick={skipHandler}>{t('Skip')}</Button>
        </Stack>
    );
};

export default HeaderLocationFinder;