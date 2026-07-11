import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
	Box, Stack, Typography, Button, OutlinedInput, InputAdornment,
	Pagination as MuiPagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import EmptyList from '../../libs/components/common/Emptylist';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { T } from '../../libs/types/common';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/community/articleImg.png'): string => {
	if (!raw) return fallback;
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const stripHtml = (html?: string): string => {
	if (!html) return '';
	return html.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const CATEGORY_TABS = [
	{ value: BoardArticleCategory.FREE, label: 'Free Board', emoji: '💬' },
	{ value: BoardArticleCategory.RECOMMEND, label: 'Recommendation', emoji: '⭐' },
	{ value: BoardArticleCategory.NEWS, label: 'News', emoji: '📰' },
	{ value: BoardArticleCategory.HUMOR, label: 'Humor', emoji: '😄' },
];

const CATEGORY_LABEL: Record<string, string> = {
	FREE: 'Free Board',
	RECOMMEND: 'Recommendation',
	NEWS: 'News',
	HUMOR: 'Humor',
};

const CATEGORY_SUBTITLE: Record<string, string> = {
	FREE: 'Express your opinions freely here without content restrictions',
	RECOMMEND: 'Discover trusted recommendations from our beauty community',
	NEWS: 'Stay up to date with the latest beauty news and trends',
	HUMOR: 'Light-hearted and fun stories from our members',
};

const DEFAULT_INPUT: BoardArticlesInquiry = {
	page: 1,
	limit: 6,
	sort: 'createdAt',
	direction: 'ASC' as any,
	search: { articleCategory: BoardArticleCategory.FREE },
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const Community: NextPage = ({ initialInput = DEFAULT_INPUT, ...props }: any) => {
	const { t } = useTranslation('common');
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);

	const [searchFilter, setSearchFilter] = useState<BoardArticlesInquiry>(initialInput);
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);
	const [searchText, setSearchText] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const { refetch } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setBoardArticles(data?.getBoardArticles?.list ?? []);
			setTotalCount(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	// ⚠️ TUZATILDI: avval `initialInput.search.articleCategory = ...` orqali
	// umumiy (barcha renderlar uchun bitta) `defaultProps` obyekti to'g'ridan-
	// to'g'ri o'zgartirilar edi — bu jiddiy holat-oqishi (state leak) xatosi.
	// Endi URL'dagi category faqat LOCAL state'ga (searchFilter) qo'llanadi.
	useEffect(() => {
		const category = router.query?.articleCategory as BoardArticleCategory | undefined;
		if (category && category !== searchFilter.search.articleCategory) {
			setSearchFilter((prev) => ({ ...prev, page: 1, search: { ...prev.search, articleCategory: category } }));
		} else if (!router.query?.articleCategory) {
			router.replace(
				{ pathname: router.pathname, query: { articleCategory: 'FREE' } },
				router.pathname,
				{ shallow: true },
			);
		}
	}, [router.query?.articleCategory]);

	/** HANDLERS **/
	const tabChangeHandler = async (category: BoardArticleCategory) => {
		setSearchFilter({ ...searchFilter, page: 1, search: { articleCategory: category } });
		await router.push(
			{ pathname: '/community', query: { articleCategory: category } },
			router.pathname,
			{ shallow: true },
		);
	};

	const searchHandler = () => {
		setSearchFilter({ ...searchFilter, page: 1, search: { ...searchFilter.search, text: searchText } });
	};

	const paginationHandler = (_e: any, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	// ⚠️ TUZATILDI: avval `boardArticlesRefetch` — chaqirilganda XATO
	// TASHLAYDIGAN soxta (stub) funksiya edi. Endi useQuery'dan kelgan
	// HAQIQIY `refetch` ishlatiladi.
	const likeArticleHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);

			await likeTargetBoardArticle({ variables: { input: id } });
			await refetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const goDetail = (id: string) => {
		router.push(`/community/detail?id=${id}&articleCategory=${searchFilter.search.articleCategory}`);
	};

	// ⚠️ TUZATILDI: avval login qilinmagan bo'lsa ham to'g'ridan-to'g'ri
	// MyPage'ga o'tkazib yuborar edi (u yerda keyin boshqa xatoga duch
	// kelinardi). Endi login qilinmagan bo'lsa aniq xabar chiqadi.
	const goWrite = () => {
		if (!user?._id) {
			sweetMixinErrorAlert('Please login first!');
			return;
		}
		router.push({ pathname: '/mypage', query: { category: 'writeArticle' } });
	};

	const activeCategory = searchFilter.search.articleCategory;

	/* ── MOBILE ── */
	if (device === 'mobile') {
		return <div>COMMUNITY PAGE MOBILE</div>;
	}

	/* ── DESKTOP ── */
	return (
		<div id="community-list-page">
			<div className="container">
				<Stack className="main-box" direction="row">
					{/* Chap sidebar */}
					<Stack className="left-config">
						<Stack className="brand-box">
							<Typography className="brand-label">{t('BeautyNear Community')}</Typography>
						</Stack>

						<Stack className="category-nav">
							{CATEGORY_TABS.map((tab) => (
								<Box
									key={tab.value}
									component="div"
									className={`nav-item ${activeCategory === tab.value ? 'active' : ''}`}
									onClick={() => tabChangeHandler(tab.value)}
								>
									<span className="nav-emoji">{tab.emoji}</span>
									<Typography className="nav-label">{t(tab.label)}</Typography>
								</Box>
							))}
						</Stack>

						<Button className="write-btn" startIcon={<EditOutlinedIcon />} onClick={goWrite}>
							{t('Write Article')}
						</Button>
					</Stack>

					{/* O'ng kontent */}
					<Stack className="right-config">
						{/* Qidiruv */}
						<OutlinedInput
							fullWidth
							className="search-input"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && searchHandler()}
							placeholder={t('Search articles...')}
							startAdornment={
								<InputAdornment position="start">
									<SearchIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
								</InputAdornment>
							}
						/>

						{/* Sarlavha */}
						<Stack direction="row" justifyContent="space-between" alignItems="flex-end" className="title-box">
							<Box component="div">
								<Typography className="title">{t(CATEGORY_LABEL[activeCategory] ?? activeCategory)}</Typography>
								<Typography className="sub-title">{t(CATEGORY_SUBTITLE[activeCategory] ?? '')}</Typography>
							</Box>
							<Typography className="result-count">
								<Box component="span" sx={{ color: '#FF4D8D', fontWeight: 700 }}>{totalCount}</Box> {t('articles')}
							</Typography>
						</Stack>

						{/* Maqolalar */}
						{boardArticles.length === 0 ? (
							<Box component="div" className="empty-frame">
								<EmptyList emoji="📝" title={t('No articles found')} desc={t('Be the first to share something with the community!')} />
							</Box>
						) : (
							<Box component="div" className="articles-grid">
								{boardArticles.map((article) => {
									const isLiked = article.meLiked?.[0]?.myFavorite;
									const authorImg = imgUrl(article.memberData?.memberImage, '/img/profile/defaultUser.svg');
									return (
										<Stack key={article._id} className="ca-card" onClick={() => goDetail(article._id)}>
											<Box component="div" className="ca-img" style={{ backgroundImage: `url(${imgUrl(article.articleImage)})` }}>
												<Box component="div" className="ca-category-badge">
													{CATEGORY_TABS.find((c) => c.value === article.articleCategory)?.emoji} {t(CATEGORY_LABEL[article.articleCategory])}
												</Box>
												<Box component="div" className="ca-time-badge">{moment(article.createdAt).fromNow()}</Box>
											</Box>
											<Box component="div" className="ca-body">
												<Typography className="ca-title">{article.articleTitle}</Typography>
												<Typography className="ca-preview">{stripHtml(article.articleContent)}</Typography>

												<Stack direction="row" alignItems="center" gap={0.75} className="ca-author-row">
													<Box component="div" className="ca-author-avatar" style={{ backgroundImage: `url(${authorImg})` }} />
													<Typography className="ca-author-name">{article.memberData?.memberNick}</Typography>
												</Stack>

												<Stack direction="row" alignItems="center" gap={1.5} className="ca-footer">
													<Stack direction="row" alignItems="center" gap={0.4} className="ca-stat" onClick={(e) => likeArticleHandler(e, article._id)}>
														{isLiked ? (
															<FavoriteIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
														) : (
															<FavoriteBorderIcon sx={{ fontSize: 15, color: '#999' }} />
														)}
														<Typography className="ca-stat-num">{article.articleLikes}</Typography>
													</Stack>
													<Stack direction="row" alignItems="center" gap={0.4} className="ca-stat">
														<ChatBubbleOutlineIcon sx={{ fontSize: 14, color: '#999' }} />
														<Typography className="ca-stat-num">{article.articleComments}</Typography>
													</Stack>
													<Stack direction="row" alignItems="center" gap={0.4} className="ca-stat">
														<RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
														<Typography className="ca-stat-num">{article.articleViews}</Typography>
													</Stack>
												</Stack>
											</Box>
										</Stack>
									);
								})}
							</Box>
						)}

						{totalCount > 0 && (
							<Stack className="pagination-config">
								<MuiPagination
									count={Math.ceil(totalCount / searchFilter.limit)}
									page={searchFilter.page}
									shape="circular"
									onChange={paginationHandler}
									sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
								/>
								<Typography className="total-result">
									{t('Total')} {totalCount} {totalCount > 1 ? t('articles') : t('article')} {t('available')}
								</Typography>
							</Stack>
						)}
					</Stack>
				</Stack>
			</div>
		</div>
	);
};

Community.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'ASC',
		search: {
			articleCategory: 'FREE',
		},
	},
};

export default withLayoutBasic(Community);