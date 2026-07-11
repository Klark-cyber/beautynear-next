import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Box, Pagination, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { useRouter } from 'next/router';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import moment from 'moment';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticlesInquiry } from '../../types/board-article/board-article.input';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL, Messages } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string): string => {
	if (!raw) return '/img/community/articleImg.png';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const stripHtml = (html?: string): string => {
	if (!html) return '';
	return html.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const CATEGORY_LABEL: Record<string, string> = {
	FREE: 'Free',
	RECOMMEND: 'Tips',
	NEWS: 'News',
	HUMOR: 'Humor',
};

const DEFAULT_INITIAL_INPUT: BoardArticlesInquiry = {
	page: 1,
	limit: 6,
	sort: 'createdAt',
	direction: 'DESC' as any,
	search: {} as any,
};

/* ─── Component ───────────────────────────────────────────────────────────── */

const MemberArticles: NextPage = ({ initialInput = DEFAULT_INITIAL_INPUT, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [total, setTotal] = useState<number>(0);
	const { memberId } = router.query;
	const [searchFilter, setSearchFilter] = useState<BoardArticlesInquiry>(initialInput);
	const [memberBoardArticles, setMemberBoardArticles] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const { refetch: boardArticlesRefetch } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMemberBoardArticles(data?.getBoardArticles?.list ?? []);
			setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		// ⚠️ memberId URL'da bo'lmasa — o'z profilidagi maqolalarni ko'rsatamiz
		const targetMemberId = (memberId as string) || user?._id;
		if (targetMemberId) setSearchFilter({ ...initialInput, search: { memberId: targetMemberId } as T });
	}, [memberId, user?._id]);

	/** HANDLERS **/
	const paginationHandler = (_e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const likeArticleHandler = async (e: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);

			await likeTargetBoardArticle({ variables: { input: id } });
			await boardArticlesRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('Success!', 750);
		} catch (err: any) {
			console.log('ERROR, likeArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const goArticleDetail = (id: string) => router.push(`/community/detail?id=${id}`);

	if (device === 'mobile') {
		return <div>MEMBER ARTICLES MOBILE</div>;
	} else {
		return (
			<div id="member-articles-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Articles</Typography>
					</Stack>
				</Stack>

				<Stack className="articles-list-box">
					{memberBoardArticles?.length === 0 && (
						<div className={'no-data'}>
							<Box component="div" className="no-data-emoji">📝</Box>
							<p>No Articles found!</p>
						</div>
					)}
					{memberBoardArticles?.map((article: BoardArticle) => {
						const isLiked = article.meLiked?.[0]?.myFavorite;
						return (
							<Stack key={article._id} className="ma-card" onClick={() => goArticleDetail(article._id)}>
								<Box component="div" className="ma-img" style={{ backgroundImage: `url(${imgUrl(article.articleImage)})` }}>
									<Box component="div" className="ma-category-badge">
										{CATEGORY_LABEL[article.articleCategory] ?? article.articleCategory}
									</Box>
									<Box component="div" className="ma-time-badge">
										{moment(article.createdAt).fromNow()}
									</Box>
								</Box>
								<Box component="div" className="ma-body">
									<Typography className="ma-title">{article.articleTitle}</Typography>
									<Typography className="ma-preview">{stripHtml(article.articleContent)}</Typography>
									<Stack direction="row" alignItems="center" gap={1.5} className="ma-footer">
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
											<Typography className="ma-stat-num">{article.articleLikes ?? 0}</Typography>
										</Stack>
										<Stack direction="row" alignItems="center" gap={0.4} className="ma-stat">
											<ChatBubbleOutlineIcon sx={{ fontSize: 14, color: '#999' }} />
											<Typography className="ma-stat-num">{article.articleComments ?? 0}</Typography>
										</Stack>
										<Stack direction="row" alignItems="center" gap={0.4} className="ma-stat">
											<RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
											<Typography className="ma-stat-num">{article.articleViews ?? 0}</Typography>
										</Stack>
									</Stack>
								</Box>
							</Stack>
						);
					})}
				</Stack>

				{memberBoardArticles?.length !== 0 && (
					<Stack className="pagination-config">
						<Stack className="pagination-box">
							<Pagination
								count={Math.ceil(total / searchFilter.limit) || 1}
								page={searchFilter.page}
								shape="circular"
								onChange={paginationHandler}
								sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
							/>
						</Stack>
						<Stack className="total-result">
							<Typography>{total} article(s) available</Typography>
						</Stack>
					</Stack>
				)}
			</div>
		);
	}
};

MemberArticles.defaultProps = {
	initialInput: DEFAULT_INITIAL_INPUT,
};

export default MemberArticles;