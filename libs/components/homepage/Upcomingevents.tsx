import React from 'react';
import { Stack, Box, Typography, Button, Chip } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const EVENTS = [
    {
        day: '24',
        month: 'MAY',
        title: 'K-Beauty Workshop',
        desc: 'Learn skincare secrets from experts',
        location: 'Seoul, Gangnam',
        seats: 32,
        seatsLeft: 12,
        color: '#FF4D8D',
    },
    {
        day: '30',
        month: 'MAY',
        title: 'Makeup Trends 2026',
        desc: 'Latest Korean makeup trends',
        location: 'Seoul, Apgujeong',
        seats: 28,
        seatsLeft: 8,
        color: '#9c67f6',
    },
    {
        day: '07',
        month: 'JUN',
        title: 'Wellness Spa Day',
        desc: 'Relax & recharge your beauty',
        location: 'Seoul, Cheongdam',
        seats: 20,
        seatsLeft: 15,
        color: '#4CAF50',
    },
];

const UpcomingEvents = () => {
    const { t } = useTranslation('common');
    const device = useDeviceDetect();

    return (
        <Stack sx={{ py: device === 'mobile' ? 4 : 7, px: device === 'mobile' ? 2 : 4, background: '#FAFAFA' }}>
            <Stack sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: device === 'mobile' ? 2 : 4 }}>
                    <Box component="div">
                        <Typography sx={{ fontSize: device === 'mobile' ? 18 : 22, fontWeight: 800, color: '#1a1a1a', mb: 0.25 }}>
                            {t('Upcoming Events')}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: '#888' }}>{t('Join K-Beauty workshops & events')}</Typography>
                    </Box>
                    <Link href="/community?articleCategory=NEWS">
                        <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#FF4D8D' }}>{t('View all events')}</Typography>
                            <Typography sx={{ color: '#FF4D8D' }}>→</Typography>
                        </Stack>
                    </Link>
                </Stack>

                <Stack gap={1.5}>
                    {EVENTS.map((event) => (
                        <Stack
                            key={event.title}
                            direction="row"
                            alignItems="center"
                            sx={{
                                p: device === 'mobile' ? 2 : 2.5,
                                background: '#fff',
                                borderRadius: 3,
                                border: '1px solid rgba(255,77,141,0.08)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                transition: 'all 0.25s',
                                '&:hover': { transform: 'translateX(4px)', boxShadow: '0 4px 20px rgba(255,77,141,0.1)', borderColor: 'rgba(255,77,141,0.2)' },
                            }}
                            gap={2.5}
                        >
                            {/* Date badge */}
                            <Stack
                                alignItems="center"
                                justifyContent="center"
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 2.5,
                                    background: `rgba(${event.color === '#FF4D8D' ? '255,77,141' : event.color === '#9c67f6' ? '156,103,246' : '76,175,80'},0.1)`,
                                    flexShrink: 0,
                                }}
                            >
                                <Typography sx={{ fontSize: 20, fontWeight: 900, color: event.color, lineHeight: 1 }}>{event.day}</Typography>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: event.color, opacity: 0.8 }}>{event.month}</Typography>
                            </Stack>

                            {/* Info */}
                            <Stack sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: device === 'mobile' ? 13 : 14, fontWeight: 700, color: '#1a1a1a', mb: 0.25 }}>
                                    {t(event.title)}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: '#888', mb: 0.75 }}>{t(event.desc)}</Typography>
                                <Stack direction="row" gap={2}>
                                    <Stack direction="row" alignItems="center" gap={0.5}>
                                        <LocationOnOutlinedIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                                        <Typography sx={{ fontSize: 11, color: '#666' }}>{event.location}</Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" gap={0.5}>
                                        <PeopleOutlineIcon sx={{ fontSize: 13, color: '#888' }} />
                                        <Typography sx={{ fontSize: 11, color: '#888' }}>
                                            {event.seatsLeft} {t('Seats Left')}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Stack>

                            {/* Seats progress */}
                            {!device || device !== 'mobile' ? (
                                <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
                                    <Box component="div" sx={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.08)', mb: 0.75, overflow: 'hidden' }}>
                                        <Box component="div" sx={{ height: '100%', width: `${(event.seatsLeft / event.seats) * 100}%`, background: event.color, borderRadius: 2 }} />
                                    </Box>
                                    <Typography sx={{ fontSize: 10, color: '#999' }}>{event.seatsLeft}/{event.seats} {t('seats')}</Typography>
                                </Stack>
                            ) : null}

                            {/* Button */}
                            <Button
                                size="small"
                                sx={{
                                    background: `linear-gradient(135deg, ${event.color}, ${event.color}cc)`,
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    px: 2,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                    boxShadow: `0 3px 12px ${event.color}40`,
                                    transition: 'all 0.25s',
                                    '&:hover': { transform: 'scale(1.05)', boxShadow: `0 6px 20px ${event.color}60` },
                                }}
                            >
                                {t('Join Event')}
                            </Button>
                        </Stack>
                    ))}
                </Stack>
            </Stack>
        </Stack>
    );
};

export default UpcomingEvents;