import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import AppsIcon from '@mui/icons-material/Apps';
import { useQuery, useReactiveVar } from '@apollo/client';
import { GET_MY_BOOKINGS, GET_FAVORITE_SALONS, GET_MEMBER } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { sweetConfirmAlert } from '../../sweetAlert';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { logOut } from '../../auth';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileMyPage = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [bookingsTotal, setBookingsTotal] = useState(0);
    const [favoritesTotal, setFavoritesTotal] = useState(0);
    // ⚠️ TUZATILDI: userVar (JWT'dan) memberComments/memberFollowers'ni
    // hech qachon o'zida saqlamaydi — shuning uchun doim 0/bo'sh ko'rinardi.
    // Endi GET_MEMBER orqali haqiqiy, jonli ma'lumot olinadi.
    const [liveMember, setLiveMember] = useState<any>(null);

    const isAgent = user?.memberType === 'AGENT';

    /** APOLLO REQUESTS — faqat statistikalar uchun (yengil, limit:1) **/
    useQuery(GET_MY_BOOKINGS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 1, sort: 'createdAt', direction: 'DESC', search: {} } },
        skip: !user?._id,
        onCompleted: (data: T) => setBookingsTotal(data?.getMyBookings?.metaCounter?.[0]?.total ?? 0),
    });

    useQuery(GET_FAVORITE_SALONS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 1 } },
        skip: !user?._id,
        onCompleted: (data: T) => setFavoritesTotal(data?.getFavoriteSalons?.metaCounter?.[0]?.total ?? 0),
    });

    useQuery(GET_MEMBER, {
        fetchPolicy: 'network-only',
        variables: { input: user?._id },
        skip: !user?._id,
        onCompleted: (data: T) => setLiveMember(data?.getMember ?? null),
    });

    /** HANDLERS **/
    const goTo = (category: string) => router.push(`/mypage?category=${category}`);

    const logoutHandler = async () => {
        if (await sweetConfirmAlert(t('Are you sure you want to log out?'))) {
            logOut();
            router.push('/');
        }
    };

    if (!user?._id) {
        router.push('/account/join');
        return null;
    }

    return (
        <Box component="div" id="mobile-mypage">
            {/* ═══ SARLAVHA (bell/gear olib tashlandi, yuqoriroqqa kotarildi) ═══ */}
            <Typography className="mp-title-simple">{t('My Page')}</Typography>

            {/* ═══ PROFIL KARTASI ═══ */}
            <Stack className="mp-profile-card">
                <IconButton className="mp-edit-btn" onClick={() => goTo('myProfile')}>
                    <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <Stack direction="row" alignItems="center" gap={1.5}>
                    <Box component="div" className="mp-avatar" style={{ backgroundImage: `url(${imgUrl(user?.memberImage)})` }} />
                    <Box>
                        <Typography className="mp-name">{user?.memberNick}</Typography>
                        <Box component="div" className="mp-type-badge">{t(user?.memberType ?? 'USER')}</Box>
                        <Typography className="mp-contact">{user?.memberPhone}</Typography>
                    </Box>
                </Stack>

                <Stack direction="row" className="mp-stats-row">
                    <Stack alignItems="center" className="mp-stat" onClick={() => goTo('myBookings')}>
                        <Typography className="mp-stat-num">{bookingsTotal}</Typography>
                        <Typography className="mp-stat-label">{t('Bookings')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="mp-stat" onClick={() => goTo('myFavorites')}>
                        <Typography className="mp-stat-num">{favoritesTotal}</Typography>
                        <Typography className="mp-stat-label">{t('Favorites')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="mp-stat">
                        <Typography className="mp-stat-num">{liveMember?.memberComments ?? 0}</Typography>
                        <Typography className="mp-stat-label">{t('Reviews')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="mp-stat" onClick={() => goTo('followers')}>
                        <Typography className="mp-stat-num">{liveMember?.memberFollowers ?? 0}</Typography>
                        <Typography className="mp-stat-label">{t('Followers')}</Typography>
                    </Stack>
                    <Stack alignItems="center" className="mp-stat" onClick={() => goTo('followings')}>
                        <Typography className="mp-stat-num">{liveMember?.memberFollowings ?? 0}</Typography>
                        <Typography className="mp-stat-label">{t('Following')}</Typography>
                    </Stack>
                </Stack>
            </Stack>

            {/* ═══ MY ACTIVITY ═══ */}
            <Typography className="mp-section-title">{t('My Activity')}</Typography>
            <Stack className="mp-menu-group">
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('myBookings')}>
                    <Box component="div" className="mp-menu-icon"><CalendarMonthOutlinedIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('My Bookings')}</Typography>
                        <Typography className="mp-menu-desc">{t('Upcoming, completed, canceled')}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('myFavorites')}>
                    <Box component="div" className="mp-menu-icon"><FavoriteBorderIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('My Favorites')}</Typography>
                        <Typography className="mp-menu-desc">{t('Saved salons, services, specialists')}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('recentlyVisited')}>
                    <Box component="div" className="mp-menu-icon"><AccessTimeIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('Recently Viewed')}</Typography>
                        <Typography className="mp-menu-desc">{t('Salons, services you viewed')}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => router.push('/saved')}>
                    <Box component="div" className="mp-menu-icon"><BookmarkBorderIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('Saved')}</Typography>
                        <Typography className="mp-menu-desc">{t('All your saved items')}</Typography>
                    </Box>
                    <Box component="div" className="mp-new-badge">{t('New')}</Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
            </Stack>

            {/* ═══ COMMUNITY ═══ */}
            <Typography className="mp-section-title">{t('Community')}</Typography>
            <Stack className="mp-menu-group">
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('myArticles')}>
                    <Box component="div" className="mp-menu-icon"><ArticleOutlinedIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('My Articles')}</Typography>
                        <Typography className="mp-menu-desc">{t("Articles you've written")}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('writeArticle')}>
                    <Box component="div" className="mp-menu-icon"><EditNoteOutlinedIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('Write Article')}</Typography>
                        <Typography className="mp-menu-desc">{t('Share your beauty tips')}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
            </Stack>

            {/* ═══ SOCIAL ═══ */}
            <Typography className="mp-section-title">{t('Social')}</Typography>
            <Stack className="mp-menu-group">
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('followers')}>
                    <Box component="div" className="mp-menu-icon"><PeopleAltOutlinedIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('Followers')}</Typography>
                        <Typography className="mp-menu-desc">{t('People who follow you')}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('followings')}>
                    <Box component="div" className="mp-menu-icon"><PersonOutlineIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('Followings')}</Typography>
                        <Typography className="mp-menu-desc">{t('People you follow')}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
            </Stack>

            {/* ═══ BUSINESS (faqat AGENT) ═══ */}
            {isAgent && (
                <>
                    <Stack direction="row" alignItems="center" gap={0.75} className="mp-section-title-row">
                        <Typography className="mp-section-title" sx={{ mb: 0 }}>{t('Business')}</Typography>
                        <Box component="div" className="mp-agent-only-badge">{t('Only for Agents')}</Box>
                    </Stack>
                    <Stack className="mp-menu-group">
                        <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('mySalons')}>
                            <Box component="div" className="mp-menu-icon"><StorefrontOutlinedIcon sx={{ fontSize: 19 }} /></Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography className="mp-menu-label">{t('My Salons')}</Typography>
                                <Typography className="mp-menu-desc">{t('Manage your salons')}</Typography>
                            </Box>
                            <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('myServices')}>
                            <Box component="div" className="mp-menu-icon"><ContentCutOutlinedIcon sx={{ fontSize: 19 }} /></Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography className="mp-menu-label">{t('My Services')}</Typography>
                                <Typography className="mp-menu-desc">{t('Manage your services')}</Typography>
                            </Box>
                            <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('agentBookings')}>
                            <Box component="div" className="mp-menu-icon"><EventNoteOutlinedIcon sx={{ fontSize: 19 }} /></Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography className="mp-menu-label">{t('Agent Bookings')}</Typography>
                                <Typography className="mp-menu-desc">{t('Bookings at your salons')}</Typography>
                            </Box>
                            <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                        </Stack>
                    </Stack>
                </>
            )}

            {/* ═══ ACCOUNT ═══ */}
            <Typography className="mp-section-title">{t('Account')}</Typography>
            <Stack className="mp-menu-group" sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item" onClick={() => goTo('myProfile')}>
                    <Box component="div" className="mp-menu-icon"><PersonOutlineIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label">{t('Edit Profile')}</Typography>
                        <Typography className="mp-menu-desc">{t('Manage your information')}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
                <Stack direction="row" alignItems="center" gap={1.25} className="mp-menu-item danger" onClick={logoutHandler}>
                    <Box component="div" className="mp-menu-icon danger"><LogoutIcon sx={{ fontSize: 19 }} /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography className="mp-menu-label danger">{t('Logout')}</Typography>
                        <Typography className="mp-menu-desc">{t('Sign out from your account')}</Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 20, color: '#ccc' }} />
                </Stack>
            </Stack>

            {/* ═══ BOTTOM NAV ═══ */}
            <Stack direction="row" className="mp-bottom-nav">
                <Stack alignItems="center" className="mp-nav-item" onClick={() => router.push('/')}>
                    <HomeIcon sx={{ fontSize: 22 }} />
                    <Typography className="mp-nav-label">{t('Home')}</Typography>
                </Stack>
                <Stack alignItems="center" className="mp-nav-item" onClick={() => router.push('/salons')}>
                    <AppsIcon sx={{ fontSize: 22 }} />
                    <Typography className="mp-nav-label">{t('Explore')}</Typography>
                </Stack>
                <Stack alignItems="center" className="mp-nav-item" onClick={() => goTo('myFavorites')}>
                    <FavoriteBorderIcon sx={{ fontSize: 22 }} />
                    <Typography className="mp-nav-label">{t('Favorites')}</Typography>
                </Stack>
                <Stack alignItems="center" className="mp-nav-item active">
                    <PersonOutlineIcon sx={{ fontSize: 22 }} />
                    <Typography className="mp-nav-label">{t('My Page')}</Typography>
                </Stack>
            </Stack>
        </Box>
    );
};

export default MobileMyPage;