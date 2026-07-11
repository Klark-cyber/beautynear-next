import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, Button, Pagination as MuiPagination } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import EmptyList from '../common/Emptylist';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';
import { T } from '../../types/common';
import { REACT_APP_API_URL, Messages } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string): string => {
	if (!raw) return '/img/community/articleImg.png';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const formatCount = (n?: number): string => {
	if (n === undefined || n === null) return '0';
	return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;
};

// TUI Editor HTML saqlaydi (<p>...</p>, <img>...) — preview uchun teglarni tozalaymiz
const stripHtml = (html?: string): string => {
	if (!html) return '';
	return html
		.replace(/<img[^>]*>/gi, '') // rasm teglarini butunlay olib tashlaymiz
		.replace(/<[^>]+>/g, ' ') // qolgan barcha teglarni bo'sh joyga almashtiramiz
		.replace(/\s+/g, ' ')
		.trim();
};

// BoardArticleCategory enum qiymatlarini dizayndagi label'larga moslashtiramiz
const CATEGORY_LABEL: Record<string, string> = {
	FREE: 'Free',
	RECOMMEND: 'Tips',
	NEWS: 'News',
	HUMOR: 'Humor',
};

const limit = 6;

/* ─── Component ───────────────────────────────────────────────────────────── */

const MyArticles: NextPage = ({ initialInput = { page: 1, limit: 6, sort: 'createdAt', direction: 'DESC', search: {} }, ...props }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);

	const [page, setPage] = useState<number>(1);
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [updateBoardArticle] = useMutation(UPDATE_BOARD_ARTICLE);

	// ⚠️ Nestar konventsiyasi: initialInput prop orqali keladi (defaultProps'da
	// belgilangan), keyin memberId + page runtime'da qo'shiladi
	const searchCommunity: T = {
		...initialInput,
		page,
		search: { ...initialInput.search, memberId: user?._id },
	};

	const { refetch } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: searchCommunity },
		skip: !user?._id,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setBoardArticles(data?.getBoardArticles?.list ?? []);
			setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (_e: any, value: number) => setPage(value);

	const likeArticleHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);

			await likeTargetBoardArticle({ variables: { input: id } });
			await refetch({ input: searchCommunity });
			await sweetTopSmallSuccessAlert('Success!', 750);
		} catch (err: any) {
			console.log('ERROR, likeArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	// Property/Salon'dagi "delete" naqshi bilan bir xil — alohida DELETE mutation
	// yo'q, articleStatus'ni DELETE qilib soft-delete qilamiz (updateBoardArticle)
	const deleteArticleHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (await sweetConfirmAlert('Are you sure to delete this article?')) {
				await updateBoardArticle({
					variables: { input: { _id: id, articleStatus: BoardArticleStatus.DELETE } },
				});
				await refetch({ input: searchCommunity });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const editArticleHandler = (e: any, id: string) => {
		e.stopPropagation();
		router.push({ pathname: '/mypage', query: { category: 'writeArticle', articleId: id } });
	};

	const goWriteArticle = () => {
		router.push({ pathname: '/mypage', query: { category: 'writeArticle' } });
	};

	const goArticleDetail = (id: string) => {
		router.push(`/community/detail?id=${id}`);
	};

	return (
		<Box component="div" className="mypage-content">
			{/* Sarlavha + Write New Article */}
			<Stack direction="row" alignItems="flex-start" justifyContent="space-between" className="articles-header-row">
				<Box component="div">
					<Typography className="content-title">{t('My Articles')}</Typography>
					<Typography className="content-subtitle">{t('Your posts in the beauty community')}</Typography>
				</Box>
				<Button className="write-article-btn" startIcon={<AddIcon />} onClick={goWriteArticle}>
					{t('Write New Article')}
				</Button>
			</Stack>

			{boardArticles.length === 0 ? (
				<Box component="div" className="follow-page-frame">
					<EmptyList
						emoji="📝"
						title={t('No articles yet')}
						desc={t('Share your beauty tips and experiences with the community')}
					/>
					<Stack alignItems="center" sx={{ mt: 2 }}>
						<Button className="write-article-btn" onClick={goWriteArticle}>
							{t('Write Your First Article')}
						</Button>
					</Stack>
				</Box>
			) : (
				<>
					<Box component="div" className="favorites-grid">
						{boardArticles.map((article) => {
							const isLiked = article.meLiked?.[0]?.myFavorite;
							return (
								<Stack key={article._id} className="ma-card" onClick={() => goArticleDetail(article._id)}>
									{/* Rasm */}
									<Box component="div" className="ma-img" style={{ backgroundImage: `url(${imgUrl(article.articleImage)})` }}>
										<Box component="div" className="ma-category-badge">
											{CATEGORY_LABEL[article.articleCategory] ?? article.articleCategory}
										</Box>
										<Box component="div" className="ma-time-badge">
											{moment(article.createdAt).fromNow()}
										</Box>
									</Box>

									{/* Body */}
									<Box component="div" className="ma-body">
										<Typography className="ma-title">{article.articleTitle}</Typography>
										<Typography className="ma-preview">{stripHtml(article.articleContent)}</Typography>

										<Stack direction="row" alignItems="center" justifyContent="space-between" className="ma-footer">
											<Stack direction="row" alignItems="center" gap={1.5}>
												<Stack
													direction="row"
													alignItems="center"
													gap={0.4}
													className="ma-stat"
													onClick={(e) => likeArticleHandler(e, article._id)}
												>
													{isLiked ? (
														<FavoriteIcon sx={{ fontSize: 15, color: '#FF4D8D' }} />
													) : (
														<FavoriteBorderIcon sx={{ fontSize: 15, color: '#999' }} />
													)}
													<Typography className="ma-stat-num">{formatCount(article.articleLikes)}</Typography>
												</Stack>
												<Stack direction="row" alignItems="center" gap={0.4} className="ma-stat">
													<ChatBubbleOutlineIcon sx={{ fontSize: 14, color: '#999' }} />
													<Typography className="ma-stat-num">{formatCount(article.articleComments)}</Typography>
												</Stack>
												<Stack direction="row" alignItems="center" gap={0.4} className="ma-stat">
													<RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
													<Typography className="ma-stat-num">{formatCount(article.articleViews)}</Typography>
												</Stack>
											</Stack>

											<Stack direction="row" alignItems="center" gap={0.75}>
												<IconButton className="ma-action-btn edit" onClick={(e) => editArticleHandler(e, article._id)}>
													<EditOutlinedIcon sx={{ fontSize: 16 }} />
												</IconButton>
												<IconButton className="ma-action-btn delete" onClick={(e) => deleteArticleHandler(e, article._id)}>
													<DeleteOutlineIcon sx={{ fontSize: 16 }} />
												</IconButton>
											</Stack>
										</Stack>
									</Box>
								</Stack>
							);
						})}
					</Box>

					{boardArticles.length !== 0 && (
						<Stack alignItems="center" sx={{ mt: 4 }}>
							<MuiPagination
								page={page}
								count={Math.ceil(total / limit)}
								onChange={paginationHandler}
								shape="circular"
								sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
							/>
						</Stack>
					)}
				</>
			)}
		</Box>
	);
};

export default MyArticles;

MyArticles.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};