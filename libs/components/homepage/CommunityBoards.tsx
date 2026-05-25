import React, { useState } from 'react';
import Link from 'next/link';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Typography } from '@mui/material';
import CommunityCard from './CommunityCard';
import { BoardArticle } from '../../types/board-article/board-article';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { T } from '../../types/common';

const CommunityBoards = () => {
	const device = useDeviceDetect();
	const [searchCommunity, setSearchCommunity] = useState({
		page: 1,
		sort: 'articleViews',
		direction: 'DESC',
	});
	const [newsArticles, setNewsArticles] = useState<BoardArticle[]>([]);
	const [freeArticles, setFreeArticles] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/
	const {
		loading: getNewsArticlesLoading,      // So'rov ketayotgan vaqtda true bo'ladi
		data: getNewsArticlesData,            // So'rov muvaffaqiyatli bo'lsa, ma'lumotlar shu yerga keladi
		error: getNewsArticlesError,          // Agar xatolik bo'lsa, xato haqida ma'lumot shu yerda bo'ladi
		refetch: getNewsArticlesRefetch,      // So'rovni qaytadan yuborish uchun ishlatiladigan funksiya
	  } = useQuery(GET_BOARD_ARTICLES, {        // GET_PROPERTIES - bu sizning GraphQL so'rov (query)ingiz
		fetchPolicy: 'network-only',   // Birinchi keshdan ko'rsatadi, keyin tarmoqdan yangi ma'lumotni olib keshni yangilaydi 
		variables: { input: {...searchCommunity, limit:6, search: {articleCategory: BoardArticleCategory.NEWS}} }, // So'rovga yuboriladigan parametrlar (initialInput props-dan kelmoqda)
		notifyOnNetworkStatusChange: true,  // So'rov qayta yuborilganda (refetch) loading holati o'zgarishini kuzatib boradi
		onCompleted: (data: T) => {         // So'rov muvaffaqiyatli yakunlanganda ishga tushadigan callback funksiya
		  setNewsArticles(data?.getBoardArticles?.list); // Kelgan ma'lumotni trendProperties state-iga saqlash
		},
	  });
	  	const {
		loading: getFreeArticlesLoading,      // So'rov ketayotgan vaqtda true bo'ladi
		data: getFreeArticlesData,            // So'rov muvaffaqiyatli bo'lsa, ma'lumotlar shu yerga keladi
		error: getFreeArticlesError,          // Agar xatolik bo'lsa, xato haqida ma'lumot shu yerda bo'ladi
		refetch: getFreeArticlesRefetch,      // So'rovni qaytadan yuborish uchun ishlatiladigan funksiya
	  } = useQuery(GET_BOARD_ARTICLES, {        // GET_PROPERTIES - bu sizning GraphQL so'rov (query)ingiz
		fetchPolicy: 'network-only',   // Birinchi keshdan ko'rsatadi, keyin tarmoqdan yangi ma'lumotni olib keshni yangilaydi 
		variables: { input: {...searchCommunity, limit:3, search: {articleCategory: BoardArticleCategory.FREE}} }, // So'rovga yuboriladigan parametrlar (initialInput props-dan kelmoqda)
		notifyOnNetworkStatusChange: true,  // So'rov qayta yuborilganda (refetch) loading holati o'zgarishini kuzatib boradi
		onCompleted: (data: T) => {         // So'rov muvaffaqiyatli yakunlanganda ishga tushadigan callback funksiya
		  setFreeArticles(data?.getBoardArticles?.list); // Kelgan ma'lumotni trendProperties state-iga saqlash
		},
	  });

	if (device === 'mobile') {
		return <div>COMMUNITY BOARDS (MOBILE)</div>;
	} else {
		return (
			<Stack className={'community-board'}>
				<Stack className={'container'}>
					<Stack>
						<Typography variant={'h1'}>COMMUNITY BOARD HIGHLIGHTS</Typography>
					</Stack>
					<Stack className="community-main">
						<Stack className={'community-left'}>
							<Stack className={'content-top'}>
								<Link href={'/community?articleCategory=NEWS'}>
									<span>News</span>
								</Link>
								<img src="/img/icons/arrowBig.svg" alt="" />
							</Stack>
							<Stack className={'card-wrap'}>
								{newsArticles.map((article, index) => {
									return <CommunityCard vertical={true} article={article} index={index} key={article?._id} />;
								})}
							</Stack>
						</Stack>
						<Stack className={'community-right'}>
							<Stack className={'content-top'}>
								<Link href={'/community?articleCategory=FREE'}>
									<span>Free</span>
								</Link>
								<img src="/img/icons/arrowBig.svg" alt="" />
							</Stack>
							<Stack className={'card-wrap vertical'}>
								{freeArticles.map((article, index) => {
									return <CommunityCard vertical={false} article={article} index={index} key={article?._id} />;
								})}
							</Stack>
						</Stack>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default CommunityBoards;
