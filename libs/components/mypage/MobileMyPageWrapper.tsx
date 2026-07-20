import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import MobileMyBookings from './MobileMyBookings';
import MobileMyFavorites from './MobileMyFavorites';
import MobileRecentlyVisited from './MobileRecentlyVisited';
import MobileMyArticles from './MobileMyArticles';
import MobileWriteArticle from './MobileWriteArticle';
import MobileFollowers from './MobileFollowers';
import MobileFollowings from './MobileFollowings';
import MobileMyProfile from './MobileMyProfile';
import MobileAgentBookings from './MobileAgentBookings';
import MobileMySalons from './MobileMySalons';
import MobileMyServices from './MobileMyServices';
import MobileAddNewService from './MobileAddNewService';
import MobileAddNewSalon from './MobileAddNewSalon';

const TITLES: Record<string, string> = {
    myBookings: 'My Bookings',
    agentBookings: 'Agent Bookings',
    myFavorites: 'My Favorites',
    followings: 'Followings',
    followers: 'Followers',
    recentlyVisited: 'Recently Viewed',
    myProfile: 'Edit Profile',
    changePassword: 'Change Password',
    mySalons: 'My Salons',
    addSalon: 'Add Salon',
    myServices: 'My Services',
    addService: 'Add Service',
    myArticles: 'My Articles',
    writeArticle: 'Write Article',
};

// ⚠️ YANGI — endi mobil uchun maxsus qurilgan komponentlar ishlatiladi
// (desktop komponentlarga bog'liqlik yo'q, faqat AgentBookings/MySalons/
// MyServices hali maxsus mobil versiyaga ega emas, vaqtincha desktopnikidan
// foydalaniladi)
const CONTENT_MAP: Record<string, React.ComponentType<any>> = {
    myBookings: MobileMyBookings,
    myFavorites: MobileMyFavorites,
    recentlyVisited: MobileRecentlyVisited,
    myArticles: MobileMyArticles,
    writeArticle: MobileWriteArticle,
    followers: MobileFollowers,
    followings: MobileFollowings,
    myProfile: MobileMyProfile,
    agentBookings: MobileAgentBookings,
    mySalons: MobileMySalons,
    addSalon: MobileAddNewSalon,
    myServices: MobileMyServices,
    addService: MobileAddNewService,
};

// ⚠️ YANGI — ba'zi bo'limlar uchun "orqaga" tugmasi asosiy menyuga emas,
// balki mantiqiy "ota" bo'limga qaytishi kerak (masalan Write/Edit Article
// dan — Articles ro'yxatiga, asosiy menyuga emas)
const BACK_TARGET: Record<string, string> = {
    writeArticle: '/mypage?category=myArticles',
    addSalon: '/mypage?category=mySalons',
    addService: '/mypage?category=myServices',
};

interface Props {
    category: string;
}

const MobileMyPageWrapper = ({ category }: Props) => {
    const { t } = useTranslation('common');
    const router = useRouter();

    const Content = CONTENT_MAP[category] ?? MobileMyBookings;

    return (
        <Box component="div" id="mobile-mypage-wrapper">
            <Stack direction="row" alignItems="center" gap={1.5} className="mpw-header">
                <IconButton className="mpw-icon-btn" onClick={() => router.push(BACK_TARGET[category] ?? '/mypage')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography className="mpw-title">{t(TITLES[category] ?? 'My Page')}</Typography>
            </Stack>
            <Box component="div" className="mpw-content">
                <Content />
            </Box>
        </Box>
    );
};

export default MobileMyPageWrapper;