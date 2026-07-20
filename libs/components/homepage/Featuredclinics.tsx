import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Stack, Box, Typography } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay, Navigation, Pagination } from 'swiper';
import { useQuery } from '@apollo/client';

import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import StarIcon from '@mui/icons-material/Star';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { GET_SALONS } from '../../../apollo/user/query';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

// ⚠️ TUZATILDI: v8'da modullar ROOT paketdan import qilinadi va
// SwiperCore.use() orqali ROYXATDAN OTKAZILISHI SHART (v7dan oldingi API)
SwiperCore.use([Autoplay, Navigation, Pagination]);

// ⚠️ MUHIM: avval bu yerda 6 ta QAT'IY YOZILGAN (hardcoded) klinika
// bor edi — Unsplash stok rasmlari, soxta reyting/sharh sonlari, hech
// qanday bazaga ulanmagan, kartaga bosilganda hech narsa sodir
// bo'lmasdi. Endi GET_SALONS orqali haqiqiy CLINIC/SKIN turidagi
// salonlar ko'rsatiladi (Mobile versiyasi bilan bir xil naqsh).

const imgUrl = (raw?: string): string => {
    if (!raw) return '/img/banner/hero.jpg';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const FeaturedClinics = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const [clinics, setClinics] = useState<any[]>([]);

    useQuery(GET_SALONS, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 8, sort: 'salonRank', direction: 'DESC', search: { typeList: ['CLINIC', 'SKIN'] } } },
        onCompleted: (data: T) => setClinics(data?.getSalons?.list ?? []),
    });

    const ClinicCard = ({ clinic }: { clinic: any }) => (
        <Stack className="clinic-card" onClick={() => router.push(`/salons/${clinic._id}`)} sx={{ cursor: 'pointer' }}>
            <Box component="div" className="clinic-img-wrap">
                <Box
                    component="div"
                    className="clinic-img"
                    style={{ backgroundImage: `url(${imgUrl(clinic.salonImages?.[0])})`, backgroundColor: '#FFE8F0' }}
                />
                {clinic.salonType === 'CLINIC' && (
                    <Stack direction="row" alignItems="center" gap={0.75} className="verified-badge">
                        <VerifiedUserOutlinedIcon sx={{ fontSize: 15 }} />
                        <Typography className="vb-text">{t('Verified K-Clinic')}</Typography>
                    </Stack>
                )}
            </Box>

            <Stack className="clinic-info">
                <Typography className="clinic-name">{clinic.salonTitle}</Typography>
                <Stack direction="row" alignItems="center" gap={0.75} className="clinic-rating">
                    <StarIcon className="cr-star" />
                    <Typography className="cr-num">{(clinic.salonRating ?? 0).toFixed(1)}</Typography>
                    <Typography className="cr-count">({clinic.salonComments ?? 0})</Typography>
                </Stack>
                <Typography className="clinic-services">{clinic.salonDesc}</Typography>
            </Stack>
        </Stack>
    );

    if (clinics.length === 0) return null;

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
                    {clinics.map((clinic) => (
                        <ClinicCard key={clinic._id} clinic={clinic} />
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
                    loop={clinics.length > 4}
                >
                    {clinics.map((clinic) => (
                        <SwiperSlide key={clinic._id} className="fc-slide">
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