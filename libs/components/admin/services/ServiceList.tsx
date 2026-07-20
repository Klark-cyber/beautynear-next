import React from 'react';
import Link from 'next/link';
import { Menu, MenuItem, Chip, IconButton, Stack, Typography, Box } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import { Service } from '../../../types/service/service';
import { REACT_APP_API_URL } from '../../../config';
import { ServiceStatus } from '../../../enums/service.enum';

interface ServiceListProps {
    services: Service[];
    anchorEl: any[];
    menuIconClickHandler: (e: any, index: number) => void;
    menuIconCloseHandler: () => void;
    updateServiceHandler: (data: { _id: string; serviceStatus: ServiceStatus }) => void;
    removeServiceHandler: (id: string) => void;
}

const TYPE_EMOJI: Record<string, string> = {
    HAIR: '✂️',
    NAIL: '💅',
    SKIN: '🧴',
    CLINIC: '💉',
    MASSAGE: '🪷',
};

const STATUS_COLOR: Record<string, string> = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DELETE: 'deleted',
};

const imgUrl = (raw?: string): string => {
    if (!raw) return '/img/banner/hero.jpg';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatPrice = (n?: number): string => {
    if (n === undefined || n === null) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const ServiceList = (props: ServiceListProps) => {
    const { services, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateServiceHandler, removeServiceHandler } = props;

    return (
        <Stack className="admin-member-table">
            {/* Sarlavha qatori */}
            <Stack direction="row" alignItems="center" className="admin-table-head">
                <Typography className="th" sx={{ flex: '0 0 260px' }}>Service</Typography>
                <Typography className="th" sx={{ flex: '0 0 220px' }}>Salon</Typography>
                <Typography className="th" sx={{ flex: '0 0 100px' }} align="center">Price</Typography>
                <Typography className="th" sx={{ flex: '0 0 90px' }} align="center">Rating</Typography>
                <Typography className="th" sx={{ flex: '0 0 90px' }} align="center">Views</Typography>
                <Typography className="th" sx={{ flex: '0 0 90px' }} align="center">Likes</Typography>
                <Typography className="th" sx={{ flex: '0 0 130px' }} align="center">Status</Typography>
                <Typography className="th" sx={{ flex: '0 0 60px' }} align="center">-</Typography>
            </Stack>

            {services.length === 0 && (
                <Stack alignItems="center" className="admin-no-data">
                    <Typography>No services found</Typography>
                </Stack>
            )}

            {services.map((svc, index) => (
                <Stack key={svc._id} direction="row" alignItems="center" className="admin-table-row">
                    {/* Service */}
                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: '0 0 260px' }}>
                        <Link href={`/service/${svc._id}`}>
                            <Box
                                component="div"
                                sx={{
                                    width: 46, height: 46, borderRadius: 2, cursor: 'pointer',
                                    backgroundImage: `url(${imgUrl(svc.serviceImages?.[0])})`,
                                    backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0,
                                }}
                            />
                        </Link>
                        <Box component="div" sx={{ minWidth: 0 }}>
                            <Link href={`/service/${svc._id}`}>
                                <Typography className="member-nick" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {svc.serviceTitle}
                                </Typography>
                            </Link>
                            <Chip label={`${TYPE_EMOJI[svc.serviceType]} ${svc.serviceType}`} size="small" className="admin-chip type-agent" sx={{ mt: 0.3 }} />
                        </Box>
                    </Stack>

                    {/* Salon */}
                    <Typography className="td" sx={{ flex: '0 0 220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {svc.salonData?.salonTitle ?? '-'}
                    </Typography>

                    {/* Price */}
                    <Typography className="td" sx={{ flex: '0 0 100px' }} align="center">
                        ₩{formatPrice(svc.servicePrice)}
                    </Typography>

                    {/* Rating */}
                    <Stack direction="row" alignItems="center" justifyContent="center" gap={0.4} sx={{ flex: '0 0 90px' }}>
                        <StarIcon sx={{ fontSize: 13, color: '#FFB800' }} />
                        <Typography className="td">{svc.serviceRating ? svc.serviceRating.toFixed(1) : '4.9'}</Typography>
                    </Stack>

                    {/* Views */}
                    <Stack direction="row" alignItems="center" justifyContent="center" gap={0.4} sx={{ flex: '0 0 90px' }}>
                        <RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
                        <Typography className="td">{svc.serviceViews ?? 0}</Typography>
                    </Stack>

                    {/* Likes */}
                    <Stack direction="row" alignItems="center" justifyContent="center" gap={0.4} sx={{ flex: '0 0 90px' }}>
                        <FavoriteIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
                        <Typography className="td">{svc.serviceLikes ?? 0}</Typography>
                    </Stack>

                    {/* Status */}
                    <Box sx={{ flex: '0 0 130px', textAlign: 'center' }}>
                        <Chip
                            label={svc.serviceStatus}
                            size="small"
                            className={`admin-chip status-${STATUS_COLOR[svc.serviceStatus]}`}
                            onClick={(e) => menuIconClickHandler(e, index)}
                        />
                        <Menu
                            anchorEl={anchorEl[index]}
                            open={Boolean(anchorEl[index])}
                            onClose={menuIconCloseHandler}
                            PaperProps={{ sx: { borderRadius: 2, mt: 0.5 } }}
                        >
                            {Object.values(ServiceStatus)
                                .filter((v) => v !== svc.serviceStatus)
                                .map((status) => (
                                    <MenuItem key={status} onClick={() => updateServiceHandler({ _id: svc._id, serviceStatus: status })}>
                                        {status}
                                    </MenuItem>
                                ))}
                        </Menu>
                    </Box>

                    {/* Delete — faqat DELETE holatidagilar uchun butunlay ochirish */}
                    <Box sx={{ flex: '0 0 60px', textAlign: 'center' }}>
                        {svc.serviceStatus === ServiceStatus.DELETE && (
                            <IconButton size="small" onClick={() => removeServiceHandler(svc._id)}>
                                <DeleteOutlineIcon sx={{ fontSize: 18, color: '#FF4D6A' }} />
                            </IconButton>
                        )}
                    </Box>
                </Stack>
            ))}
        </Stack>
    );
};

export default ServiceList;