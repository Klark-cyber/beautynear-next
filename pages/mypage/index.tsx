import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Stack } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyMenu from '../../libs/components/mypage/MyMenu';
import MyBookings from '../../libs/components/mypage/MyBookings';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import Followings from '../../libs/components/mypage/Followings';
import Followers from '../../libs/components/mypage/Followers';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import AgentBookings from '../../libs/components/mypage/AgentBookings';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MySalons from '../../libs/components/mypage/MySalons';
import AddNewSalon from '../../libs/components/mypage/AddNewSalon';
import MyArticles from '../../libs/components/mypage/MyArticles';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MyServices from '../../libs/components/mypage/MyServices';
import AddNewService from '../../libs/components/mypage/AddNewServices';

const MyPage: NextPage = () => {
	const router = useRouter();
	const category = (router.query.category as string) ?? 'myBookings';

	const renderContent = () => {
		switch (category) {
			case 'myBookings':
				return <MyBookings />;
			case 'agentBookings':
				return <AgentBookings />;
			case 'myFavorites':
				return <MyFavorites />;
			case 'followings':
				return <Followings />;
			case 'followers':
				return <Followers />;
			case 'recentlyVisited':
				return <RecentlyVisited />;
			case 'myProfile':
				return <MyProfile />;
			case 'mySalons':
				return <MySalons />;
			case 'addSalon':
				return <AddNewSalon />;
			case 'myServices':
				return <MyServices />;
			case 'addService':
				return <AddNewService />;
			case 'myArticles':
				return <MyArticles />;
			case 'writeArticle':
				return <WriteArticle />;
			default:
				return <MyBookings />;
		}
	};

	return (
		<Stack className="mypage-page">
			<Stack direction="row" gap={4} alignItems="flex-start" className="mypage-inner">
				{/* Chap: sidebar */}
				<MyMenu />

				{/* O'ng: tanlangan bo'lim */}
				<Stack className="mypage-main" flex={1}>
					{renderContent()}
				</Stack>
			</Stack>
		</Stack>
	);
};

export async function getServerSideProps(ctx: any) {
	return {
		props: {
			...(await serverSideTranslations(ctx.locale, ['common'])),
		},
	};
}

export default withLayoutBasic(MyPage);