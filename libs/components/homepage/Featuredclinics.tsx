import React, { useState } from 'react';
import { Stack, Box, Typography, Chip } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper';
import StarIcon from '@mui/icons-material/Star';
import VerifiedIcon from '@mui/icons-material/Verified';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_SALONS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { Salon } from '../../types/salon/salon';
import { REACT_APP_API_URL } from '../../config';
import { SalonType } from '../../enums/salon.enum';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const FeaturedClinics = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const [clinics, setClinics] = useState < Salon[] > ([]);

    useQuery(GET_SALONS, {
        fetchPolicy: 'cache-and-network',
        variables: {
            input: {
                page: 1, limit: 8, sort: 'salonRank', direction: 'DESC',
                search: { typeList: [SalonType.CLINIC, SalonType.SKIN] },
            },
        },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => setClinics(data?.getSalons?.list ?? []),
    });

    if (!clinics.length) return null;

    const ClinicCard = ({ clinic }: { clinic: Salon }) => {
        const img = clinic.salonImages?.[0] ? `${REACT_APP_API_URL}/${clinic.salonImages[0]}` : '/img/banner/default.jpg';

        return (
            <Stack
                onClick={() => router.push(`/salons/${clinic._id}`)}
                sx={{
                    width: device === 'mobile' ? 200 : 260,
                    height: device === 'mobile' ? 180 : 220,
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'scale(1.03)', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' },
                    '&:hover .clinic-overlay': { opacity: 1 },
                }}
            >
                {/* Background image */}
                <Box component="div" sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

                {/* Dark overlay */}
                <Box component="div" sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)' }} />

                {/* Verified badge */}
                <Box component="div" sx={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,77,141,0.9)', borderRadius: 2, px: 1, py: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VerifiedIcon sx={{ fontSize: 11, color: '#fff' }} />
                    <Typography sx={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{t('Verified K-Clinic')}</Typography>
                </Box>

                {/* Info */}
                <Stack sx={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                    <Typography sx={{ fontSize: device === 'mobile' ? 13 : 15, fontWeight: 700, color: '#fff', mb: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {clinic.salonTitle}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {clinic.salonAddress}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                        <StarIcon sx={{ fontSize: 12, color: '#FFB800' }} />
                        <Typography sx={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>4.9</Typography>
                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>(120)</Typography>
                    </Stack>
                </Stack>

                {/* Hover overlay */}
                <Box component="div" className="clinic-overlay" sx={{ position: 'absolute', inset: 0, background: 'rgba(255,77,141,0.15)', opacity: 0, transition: 'opacity 0.3s' }} />
            </Stack>
        );
    };

    // Mobile
    if (device === 'mobile') {
        return (
            <Stack sx={{ py: 4, background: '#fff' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, mb: 2 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>{t('Featured K-Clinics')}</Typography>
                    <Link href="/salons?type=CLINIC">
                        <Typography sx={{ fontSize: 12, color: '#FF4D8D', fontWeight: 600, cursor: 'pointer' }}>{t('View all')}</Typography>
                    </Link>
                </Stack>
                <Stack direction="row" gap={1.5} sx={{ px: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, pb: 1 }}>
                    {clinics.map((clinic) => <ClinicCard key={clinic._id} clinic={clinic} />)}
                </Stack>
            </Stack>
        );
    }

    // Desktop: full-width Swiper
    return (
        <Stack sx={{ py: 7, px: 4, background: '#fff' }}>
            <Stack sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                    <Box component="div">
                        <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', mb: 0.25 }}>{t('Featured K-Beauty Clinics')}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#888' }}>{t('Verified aesthetic clinics for premium treatments')}</Typography>
                    </Box>
                    <Stack direction="row" alignItems="center" gap={2}>
                        <Link href="/salons?type=CLINIC">
                            <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#FF4D8D' }}>{t('View all clinics')}</Typography>
                                <Typography sx={{ color: '#FF4D8D' }}>→</Typography>
                            </Stack>
                        </Link>
                        <Stack direction="row" gap={0.5}>
                            <Box component="div" className="swiper-clinics-prev" sx={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,77,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { background: '#FF4D8D', '& svg': { color: '#fff' } } }}>
                                <WestIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
                            </Box>
                            <Box component="div" className="swiper-clinics-next" sx={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(255,77,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { background: '#FF4D8D', '& svg': { color: '#fff' } } }}>
                                <EastIcon sx={{ fontSize: 14, color: '#FF4D8D' }} />
                            </Box>
                        </Stack>
                    </Stack>
                </Stack>

                <Swiper
                    slidesPerView="auto"
                    spaceBetween={20}
                    modules={[Autoplay, Navigation]}
                    navigation={{ nextEl: '.swiper-clinics-next', prevEl: '.swiper-clinics-prev' }}
                    autoplay={{ delay: 5500, disableOnInteraction: false }}
                >
                    {clinics.map((clinic) => (
                        <SwiperSlide key={clinic._id} style={{ width: 260 }}>
                            <ClinicCard clinic={clinic} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </Stack>
        </Stack>
    );
};

export default FeaturedClinics;