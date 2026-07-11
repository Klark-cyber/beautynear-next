import React from 'react';
import { Stack, Box, Typography } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation, Pagination } from 'swiper';

import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import StarIcon from '@mui/icons-material/Star';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';

// ⚠️ TUZATILDI: v8'da modullar ROOT paketdan import qilinadi va
// SwiperCore.use() orqali ROYXATDAN OTKAZILISHI SHART (v7dan oldingi API)
SwiperCore.use([Autoplay, Navigation, Pagination]);

// Hardcoded featured clinics — portfolio demo data (Unsplash images)
const CLINICS = [
    { id: '1', name: 'Lumière Clinic', services: 'Skin • Laser • Lifting', rating: 4.9, reviews: 520, img: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80' },
    { id: '2', name: 'Seoul Aesthetic', services: 'Botox • Filler • Contouring', rating: 4.8, reviews: 320, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80' },
    { id: '3', name: 'Derma Belle', services: 'Acne • Scar • Skin Renewal', rating: 4.9, reviews: 410, img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80' },
    { id: '4', name: 'BeauNote Clinic', services: 'Whitening • Rejuvenation', rating: 4.8, reviews: 280, img: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&q=80' },
    { id: '5', name: 'Glow Medical', services: 'Peeling • Hydration • Glow', rating: 4.9, reviews: 365, img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80' },
    { id: '6', name: 'Pure Derma', services: 'Pigmentation • Pores • Lift', rating: 4.7, reviews: 240, img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80' },
];

const FeaturedClinics = () => {
    const { t } = useTranslation('common');
    const device = useDeviceDetect();

    const ClinicCard = ({ clinic }: { clinic: typeof CLINICS[0] }) => (
        <Stack className="clinic-card">
            <Box component="div" className="clinic-img-wrap">
                <Box
                    component="div"
                    className="clinic-img"
                    style={{ backgroundImage: `url(${clinic.img})`, backgroundColor: '#FFE8F0' }}
                />
                <Stack direction="row" alignItems="center" gap={0.75} className="verified-badge">
                    <VerifiedUserOutlinedIcon sx={{ fontSize: 15 }} />
                    <Typography className="vb-text">{t('Verified K-Clinic')}</Typography>
                </Stack>
            </Box>

            <Stack className="clinic-info">
                <Typography className="clinic-name">{clinic.name}</Typography>
                <Typography className="clinic-services">{clinic.services}</Typography>
                <Stack direction="row" alignItems="center" gap={0.75} className="clinic-rating">
                    <StarIcon className="cr-star" />
                    <Typography className="cr-num">{clinic.rating}</Typography>
                    <Typography className="cr-count">({clinic.reviews})</Typography>
                </Stack>
            </Stack>
        </Stack>
    );

    /** MOBILE **/
    if (device === 'mobile') {
        return (
            <Stack className="featured-clinics-section mobile">
                <Stack direction="row" justifyContent="space-between" alignItems="center" className="fc-header">
                    <Typography className="fc-title">{t('Featured K-Beauty Clinics')}</Typography>
                    <Link href="/salons">
                        <Typography className="fc-viewall">{t('View all')} →</Typography>
                    </Link>
                </Stack>
                <Stack direction="row" gap={1.5} className="fc-scroll">
                    {CLINICS.map((clinic) => (
                        <ClinicCard key={clinic.id} clinic={clinic} />
                    ))}
                </Stack>
            </Stack>
        );
    }

    /** PC **/
    return (
        <Stack className="featured-clinics-section">
            <Stack className="fc-container">
                {/* Header — Trending Services kabi: title + (View all + strelkalar) */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" className="fc-header">
                    <Stack>
                        <Typography className="fc-title">{t('Featured K-Beauty Clinics')}</Typography>
                        <Typography className="fc-subtitle">
                            {t('Hand-picked premium Korean clinics trusted by thousands of customers.')}
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={2}>
                        <Link href="/salons">
                            <Stack direction="row" alignItems="center" gap={0.5} className="fc-viewall">
                                <Typography className="fcv-text">{t('View all clinics')}</Typography>
                                <EastIcon sx={{ fontSize: 16 }} />
                            </Stack>
                        </Link>
                        <Stack direction="row" gap={0.75}>
                            <Box component="div" className="fc-arrow swiper-featured-prev"><WestIcon /></Box>
                            <Box component="div" className="fc-arrow swiper-featured-next"><EastIcon /></Box>
                        </Stack>
                    </Stack>
                </Stack>

                {/* Slider */}
                <Swiper
                    slidesPerView={5}
                    spaceBetween={24}
                    modules={[Autoplay, Navigation, Pagination]}
                    navigation={{ prevEl: '.swiper-featured-prev', nextEl: '.swiper-featured-next' }}
                    pagination={{ el: '.fc-pagination', clickable: true }}
                    autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    loop={CLINICS.length > 4}
                >
                    {CLINICS.map((clinic) => (
                        <SwiperSlide key={clinic.id} className="fc-slide">
                            <ClinicCard clinic={clinic} />
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Pagination dots */}
                <Box component="div" className="fc-pagination" />
            </Stack>
        </Stack>
    );
};

export default FeaturedClinics;