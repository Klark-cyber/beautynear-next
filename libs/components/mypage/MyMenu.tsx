import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Stack, Box, Typography, Avatar, Chip } from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { MemberType } from '../../enums/member.enum';

interface MenuItem {
	category: string;
	label: string;
	icon: React.ReactNode;
	danger?: boolean;
}

const MyMenu = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);

	const category = (router.query.category as string) ?? 'myBookings';
	const isAgent = user?.memberType === MemberType.AGENT;

	const activityItems: MenuItem[] = [
		{ category: 'myBookings', label: 'My Bookings', icon: <CalendarMonthOutlinedIcon /> },
		{ category: 'myFavorites', label: 'My Favorites', icon: <FavoriteBorderIcon /> },
		{ category: 'recentlyVisited', label: 'Recently Viewed', icon: <AccessTimeIcon /> },
	];

	const agentItems: MenuItem[] = [
		{ category: 'mySalons', label: 'My Salons', icon: <StorefrontOutlinedIcon /> },
		{ category: 'addSalon', label: 'Add Salon', icon: <AddBusinessOutlinedIcon /> },
		{ category: 'agentBookings', label: 'Booking Requests', icon: <CalendarMonthOutlinedIcon /> },
	];

	const communityItems: MenuItem[] = [
		{ category: 'myArticles', label: 'My Articles', icon: <ArticleOutlinedIcon /> },
		{ category: 'writeArticle', label: 'Write Article', icon: <EditOutlinedIcon /> },
	];

	const accountItems: MenuItem[] = [
		{ category: 'myProfile', label: 'Edit Profile', icon: <SettingsOutlinedIcon /> },
	];

	const goCategory = (cat: string) => {
		router.push(`/mypage?category=${cat}`, undefined, { scroll: false });
	};

	const renderItem = (item: MenuItem) => (
		<Stack
			key={item.category}
			direction="row"
			alignItems="center"
			gap={1.5}
			className={`menu-item ${category === item.category ? 'active' : ''} ${item.danger ? 'danger' : ''}`}
			onClick={() => goCategory(item.category)}
		>
			<Box component="div" className="menu-icon">
				{item.icon}
			</Box>
			<Typography className="menu-label">{t(item.label)}</Typography>
		</Stack>
	);

	return (
		<Stack className="my-menu">
			{/* Profil bloki */}
			<Stack alignItems="center" className="profile-block">
				<Avatar
					src={
						user?.memberImage
							? `${REACT_APP_API_URL}/${user?.memberImage}`
							: '/img/profile/defaultUser.svg'
					}
					className="profile-avatar"
				/>
				<Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.5 }}>
					<Typography className="profile-name">{user?.memberNick ?? 'Guest'}</Typography>
					<Chip label={t(user?.memberType === MemberType.ADMIN ? 'Administrator' : isAgent ? 'Agent' : 'User')} size="small" className="profile-badge" />
				</Stack>
				<Typography className="profile-email">{user?.memberPhone ?? ''}</Typography>
			</Stack>

			<Box component="div" className="menu-divider" />

			{/* MY ACTIVITY */}
			<Typography className="menu-section-label">{t('MY ACTIVITY')}</Typography>
			<Stack className="menu-group">{activityItems.map(renderItem)}</Stack>

			{/* AGENT (faqat agent uchun) */}
			{isAgent && (
				<>
					<Typography className="menu-section-label">{t('MY BUSINESS')}</Typography>
					<Stack className="menu-group">{agentItems.map(renderItem)}</Stack>
				</>
			)}

			{/* COMMUNITY */}
			<Typography className="menu-section-label">{t('COMMUNITY')}</Typography>
			<Stack className="menu-group">{communityItems.map(renderItem)}</Stack>

			{/* ACCOUNT */}
			<Typography className="menu-section-label">{t('ACCOUNT')}</Typography>
			<Stack className="menu-group">
				{accountItems.map(renderItem)}
				<Stack
					direction="row"
					alignItems="center"
					gap={1.5}
					className="menu-item danger"
					onClick={() => logOut()}
				>
					<Box component="div" className="menu-icon">
						<LogoutIcon />
					</Box>
					<Typography className="menu-label">{t('Logout')}</Typography>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default MyMenu;