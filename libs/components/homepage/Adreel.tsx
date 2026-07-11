import React from 'react';
import { Stack, Box, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

/**
 * AdReel — Homepage'da doimiy aylanib turuvchi (autoplay, loop, ovozsiz) fon video.
 * Salonlar uchun reklama-rolik joylashtiriladi. Boshqaruv tugmalari yo'q —
 * video sahifa ochilishi bilan boshlanadi va tugagach avtomatik qaytadan boshlanadi.
 *
 * Video faylni shu yerga joylashtiring:
 *   public/video/salon-promo.mp4
 *
 * (Ixtiyoriy) Video yuklanmaguncha ko'rinadigan birinchi kadr uchun:
 *   public/video/salon-promo-poster.jpg
 */

const VIDEO_SRC = '/video/salon-promo.mp4';
const POSTER_SRC = '/video/salon-promo-poster.jpg';

const AdReel = () => {
    const { t } = useTranslation('common');

    return (
        <Stack className="ad-reel-section">
            <Box component="div" className="ar-frame">
                <video
                    className="ar-video"
                    src={VIDEO_SRC}
                    poster={POSTER_SRC}
                    autoPlay
                    muted
                    loop
                    playsInline
                    // Video topilmasa butun bo'lim ko'rinmay qoladi (buzuq quti chiqmasin)
                    onError={(e) => {
                        const section = (e.target as HTMLVideoElement).closest('.ad-reel-section') as HTMLElement;
                        if (section) section.style.display = 'none';
                    }}
                />

                {/* Video ustidagi qorong'ulashtiruvchi qatlam — matn o'qilishi uchun */}
                <Box component="div" className="ar-overlay" />

                {/* Matn */}
                <Stack className="ar-content">
                    <Typography className="ar-eyebrow">{t('Featured Salons')}</Typography>
                    <Typography className="ar-title">{t('See Beauty in Motion')}</Typography>
                    <Typography className="ar-sub">{t('Watch real transformations from salons near you')}</Typography>
                </Stack>
            </Box>
        </Stack>
    );
};

export default AdReel;