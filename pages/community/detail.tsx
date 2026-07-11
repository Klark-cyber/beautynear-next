import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import {
	Box, Stack, Typography, Button, IconButton, Backdrop,
	Pagination as MuiPagination,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { Comment } from '../../libs/types/comment/comment';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { CommentUpdate } from '../../libs/types/comment/comment.update';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { T } from '../../libs/types/common';
import { GET_BOARD_ARTICLE, GET_COMMENTS } from '../../apollo/user/query';
import { CREATE_COMMENT, LIKE_TARGET_BOARD_ARTICLE, UPDATE_COMMENT } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { REACT_APP_API_URL, Messages } from '../../libs/config';
import {
	sweetConfirmAlert,
	sweetMixinErrorAlert,
	sweetMixinSuccessAlert,
	sweetTopSmallSuccessAlert,
} from '../../libs/sweetAlert';

const ToastViewerComponent = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/* ─── Helpers ─────────────────────────────────────────────────────────── */

// ⚠️ TUZATILDI: avval `${process.env.REACT_APP_API_URL} / ${...}` — orada
// SO'Z ORALIG'I bor edi, natijada butunlay buzuq manzil hosil bo'lar edi.
// Bundan tashqari to'liq (https://...) URL'lar tekshirilmagan edi.
const imgUrl = (raw?: string, fallback = '/img/community/articleImg.png'): string => {
	if (!raw) return fallback;
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
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

/* ─── Component ───────────────────────────────────────────────────────────── */

const CommunityDetail: NextPage = ({
	initialInput = { page: 1, limit: 5, sort: 'createdAt', direction: 'DESC', search: { commentRefId: '' } },
	...props
}: any) => {
	const { t } = useTranslation('common');
	const device = useDeviceDetect();
	const router = useRouter();
	const { query } = router;

	const articleId = query?.id as string;
	const articleCategory = (query?.articleCategory as string) ?? BoardArticleCategory.FREE;

	const user = useReactiveVar(userVar);
	const [comment, setComment] = useState<string>('');
	const [wordsCnt, setWordsCnt] = useState<number>(0);
	const [updatedCommentWordsCnt, setUpdatedCommentWordsCnt] = useState<number>(0);
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useState<CommentsInquiry>(initialInput);
	const [openBackdrop, setOpenBackdrop] = useState<boolean>(false);
	const [updatedComment, setUpdatedComment] = useState<string>('');
	const [updatedCommentId, setUpdatedCommentId] = useState<string>('');
	const [likeLoading, setLikeLoading] = useState<boolean>(false);
	const [boardArticle, setBoardArticle] = useState<BoardArticle>();

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [updateComment] = useMutation(UPDATE_COMMENT);

	const { refetch: boardArticleRefetch } = useQuery(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: { input: articleId },
		skip: !articleId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => setBoardArticle(data?.getBoardArticle),
	});

	const { refetch: getCommentsRefetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchFilter },
		skip: !searchFilter.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setComments(data?.getComments?.list ?? []);
			setTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	// ⚠️ TUZATILDI: bir maqoladan ikkinchisiga o'tganda (component qayta
	// yaratilmasdan, faqat articleId o'zgarganda) eski maqola state'da
	// qolib, bir lahza "xunuk eski data" ko'rinib turar edi. Endi
	// articleId o'zgarishi bilan darhol tozalanadi.
	useEffect(() => {
		setBoardArticle(undefined);
		setComments([]);
		setTotal(0);
	}, [articleId]);

	useEffect(() => {
		if (articleId) setSearchFilter((prev) => ({ ...prev, page: 1, search: { commentRefId: articleId } }));
	}, [articleId]);

	/** HANDLERS **/
	const tabChangeHandler = (category: BoardArticleCategory) => {
		router.push({ pathname: '/community', query: { articleCategory: category } });
	};

	const likeBoArticleHandler = async () => {
		try {
			if (likeLoading) return;
			if (!boardArticle?._id) return;
			if (!user?._id) throw new Error(Messages.error2);

			setLikeLoading(true);
			await likeTargetBoardArticle({ variables: { input: boardArticle._id } });
			await boardArticleRefetch({ input: articleId });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likeBoardArticleHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setLikeLoading(false);
		}
	};

	const createCommentHandler = async () => {
		if (!comment) return;
		try {
			if (!user?._id) throw new Error(Messages.error2);
			const commentInput: CommentInput = {
				commentGroup: CommentGroup.ARTICLE,
				commentRefId: articleId,
				commentContent: comment,
			};
			await createComment({ variables: { input: commentInput } });
			await getCommentsRefetch({ input: searchFilter });
			await boardArticleRefetch({ input: articleId });
			setComment('');
			setWordsCnt(0);
			await sweetMixinSuccessAlert(t('Successfully commented!'));
		} catch (error: any) {
			await sweetMixinErrorAlert(error.message);
		}
	};

	const updateButtonHandler = async (commentId: string, commentStatus?: CommentStatus) => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!commentId) throw new Error(t('Select a comment to update!'));

			const updateData: CommentUpdate = {
				_id: commentId,
				...(commentStatus && { commentStatus }),
				...(updatedComment && { commentContent: updatedComment }),
			};

			if (!updateData?.commentContent && !updateData?.commentStatus) {
				throw new Error(t('Provide data to update your comment!'));
			}

			if (commentStatus) {
				if (await sweetConfirmAlert(t('Do you want to delete the comment?'))) {
					await updateComment({ variables: { input: updateData } });
					await sweetMixinSuccessAlert(t('Successfully deleted!'));
				} else {
					return;
				}
			} else {
				await updateComment({ variables: { input: updateData } });
				await sweetMixinSuccessAlert(t('Successfully updated!'));
			}

			await getCommentsRefetch({ input: searchFilter });
		} catch (error: any) {
			await sweetMixinErrorAlert(error.message);
		} finally {
			setOpenBackdrop(false);
			setUpdatedComment('');
			setUpdatedCommentWordsCnt(0);
			setUpdatedCommentId('');
		}
	};

	const goMemberPage = (id?: string) => {
		if (!id) return;
		if (id === user?._id) router.push('/mypage');
		else router.push(`/member?memberId=${id}`);
	};

	const cancelButtonHandler = () => {
		setOpenBackdrop(false);
		setUpdatedComment('');
		setUpdatedCommentWordsCnt(0);
	};

	const updateCommentInputHandler = (value: string) => {
		if (value.length > 100) return;
		setUpdatedCommentWordsCnt(value.length);
		setUpdatedComment(value);
	};

	const paginationHandler = (_e: any, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const goWrite = () => router.push({ pathname: '/mypage', query: { category: 'writeArticle' } });

	const isLiked = boardArticle?.meLiked?.[0]?.myFavorite;
	const authorImg = imgUrl(boardArticle?.memberData?.memberImage, '/img/profile/defaultUser.svg');

	/* ── MOBILE ── */
	if (device === 'mobile') {
		return <div>COMMUNITY DETAIL PAGE MOBILE</div>;
	}

	/* ── DESKTOP ── */
	return (
		<div id="community-detail-page">
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
									className={`nav-item ${articleCategory === tab.value ? 'active' : ''}`}
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
						<Stack
							direction="row"
							alignItems="center"
							gap={0.75}
							className="back-link"
							onClick={() => router.push({ pathname: '/community', query: { articleCategory } })}
						>
							<ArrowBackIcon sx={{ fontSize: 15 }} />
							<Typography>{t('Back to Community')}</Typography>
						</Stack>

						{boardArticle ? (
							<>
								<Box component="div" className="article-card">
									{/* Qopqoq rasmi + ustiga kategoriya belgisi */}
									<Box component="div" className="cd-cover" style={{ backgroundImage: `url(${imgUrl(boardArticle?.articleImage)})` }}>
										<Box component="div" className="cd-category-chip">
											{CATEGORY_TABS.find((c) => c.value === boardArticle?.articleCategory)?.emoji} {t(CATEGORY_LABEL[boardArticle?.articleCategory ?? 'FREE'])}
										</Box>
									</Box>

									<Box component="div" className="cd-body">
										<Typography className="cd-title">{boardArticle?.articleTitle}</Typography>

										{/* Muallif + statistika */}
										<Stack direction="row" justifyContent="space-between" alignItems="center" className="cd-meta-row">
											<Stack direction="row" alignItems="center" gap={1} className="cd-author" onClick={() => goMemberPage(boardArticle?.memberData?._id)}>
												<Box component="div" className="cd-author-avatar" style={{ backgroundImage: `url(${authorImg})` }} />
												<Box component="div">
													<Typography className="cd-author-name">{boardArticle?.memberData?.memberNick}</Typography>
													<Typography className="cd-date">{moment(boardArticle?.createdAt).format('MMM DD, YYYY · HH:mm')}</Typography>
												</Box>
											</Stack>

											<Stack direction="row" alignItems="center" gap={2} className="cd-stats">
												<Stack direction="row" alignItems="center" gap={0.4} className="cd-stat" onClick={likeBoArticleHandler}>
													{isLiked ? (
														<FavoriteIcon sx={{ fontSize: 18, color: '#FF4D8D' }} />
													) : (
														<FavoriteBorderIcon sx={{ fontSize: 18, color: '#999' }} />
													)}
													<Typography>{boardArticle?.articleLikes}</Typography>
												</Stack>
												<Stack direction="row" alignItems="center" gap={0.4} className="cd-stat">
													<RemoveRedEyeIcon sx={{ fontSize: 17, color: '#999' }} />
													<Typography>{boardArticle?.articleViews}</Typography>
												</Stack>
												<Stack direction="row" alignItems="center" gap={0.4} className="cd-stat">
													<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: '#999' }} />
													<Typography>{boardArticle?.articleComments}</Typography>
												</Stack>
											</Stack>
										</Stack>

										{/* Kontent */}
										<Box component="div" className="cd-content">
											<ToastViewerComponent markdown={boardArticle?.articleContent} className="ytb_play" />
										</Box>
									</Box>
								</Box>

								{/* Izohlar */}
								<Box component="div" className="comments-card">
									<Typography className="cc-title">{t('Comments')} ({total})</Typography>

									<Stack direction="row" alignItems="center" className="leave-comment">
										<input
											type="text"
											placeholder={t('Leave a comment')}
											value={comment}
											onChange={(e) => {
												if (e.target.value.length > 100) return;
												setWordsCnt(e.target.value.length);
												setComment(e.target.value);
											}}
											onKeyDown={(e) => e.key === 'Enter' && createCommentHandler()}
										/>
										<Typography className="word-count">{wordsCnt}/100</Typography>
										<Button className="comment-btn" onClick={createCommentHandler}>{t('Post')}</Button>
									</Stack>

									<Stack className="comments-list">
										{comments.map((c) => {
											const commentAuthorImg = imgUrl(c.memberData?.memberImage, '/img/profile/defaultUser.svg');
											return (
												<Stack key={c._id} className="comment-row">
													<Box component="div" className="comment-avatar" style={{ backgroundImage: `url(${commentAuthorImg})` }} onClick={() => goMemberPage(c.memberData?._id)} />
													<Box component="div" sx={{ flex: 1, minWidth: 0 }}>
														<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
															<Box component="div">
																<Typography className="comment-name" onClick={() => goMemberPage(c.memberData?._id)}>{c.memberData?.memberNick}</Typography>
																<Typography className="comment-date">{moment(c.createdAt).format('DD.MM.YY HH:mm')}</Typography>
															</Box>
															{c.memberId === user?._id && (
																<Stack direction="row" gap={0.5}>
																	<IconButton size="small" onClick={() => {
																		setUpdatedComment(c.commentContent);
																		setUpdatedCommentWordsCnt(c.commentContent?.length ?? 0);
																		setUpdatedCommentId(c._id);
																		setOpenBackdrop(true);
																	}}>
																		<EditOutlinedIcon sx={{ fontSize: 16, color: '#999' }} />
																	</IconButton>
																	<IconButton size="small" onClick={() => updateButtonHandler(c._id, CommentStatus.DELETE)}>
																		<DeleteOutlineIcon sx={{ fontSize: 16, color: '#FF4D6A' }} />
																	</IconButton>
																</Stack>
															)}
														</Stack>
														<Typography className="comment-content">{c.commentContent}</Typography>
													</Box>
												</Stack>
											);
										})}
									</Stack>

									{total > 0 && (
										<Stack alignItems="center" sx={{ mt: 3 }}>
											<MuiPagination
												count={Math.ceil(total / searchFilter.limit) || 1}
												page={searchFilter.page}
												shape="circular"
												onChange={paginationHandler}
												sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
											/>
										</Stack>
									)}
								</Box>
							</>
						) : (
							<Stack className="loading-skeleton">
								<Box component="div" className="skel-cover" />
								<Box component="div" className="skel-line" style={{ width: '60%', height: 28 }} />
								<Box component="div" className="skel-line" style={{ width: '40%', height: 14 }} />
								<Box component="div" className="skel-line" style={{ width: '100%', height: 100, marginTop: 20 }} />
							</Stack>
						)}
					</Stack>
				</Stack>
			</div>

			{/* Izohni tahrirlash — responsive modal */}
			<Backdrop open={openBackdrop} className="edit-comment-backdrop" onClick={cancelButtonHandler}>
				<Box component="div" className="edit-comment-modal" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
						<Typography className="ecm-title">{t('Update comment')}</Typography>
						<IconButton size="small" onClick={cancelButtonHandler}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
					</Stack>
					<input
						autoFocus
						className="ecm-input"
						value={updatedComment}
						onChange={(e) => updateCommentInputHandler(e.target.value)}
						type="text"
					/>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
						<Typography className="ecm-count">{updatedCommentWordsCnt}/100</Typography>
						<Stack direction="row" gap={1}>
							<Button className="ecm-cancel-btn" onClick={cancelButtonHandler}>{t('Cancel')}</Button>
							<Button className="ecm-save-btn" onClick={() => updateButtonHandler(updatedCommentId, undefined)}>{t('Update')}</Button>
						</Stack>
					</Stack>
				</Box>
			</Backdrop>
		</div>
	);
};

CommunityDetail.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: { commentRefId: '' },
	},
};

export default withLayoutBasic(CommunityDetail);