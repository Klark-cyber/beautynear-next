import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Autoplay } from 'swiper';

SwiperCore.use([Autoplay]);
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SendIcon from '@mui/icons-material/Send';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_BOARD_ARTICLE, GET_BOARD_ARTICLES, GET_COMMENTS } from '../../../apollo/user/query';
import { LIKE_TARGET_BOARD_ARTICLE, CREATE_COMMENT, LIKE_TARGET_COMMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const CATEGORY_COLORS: Record<string, string> = {
    RECOMMEND: '#FF4D8D',
    NEWS: '#2980B9',
    HUMOR: '#F5A623',
    FREE: '#888',
};

interface Props {
    articleId: string;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

const MobileCommunityDetail = ({ articleId }: Props) => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [article, setArticle] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentTotal, setCommentTotal] = useState(0);
    const [commentText, setCommentText] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
    const [showAllComments, setShowAllComments] = useState(false);

    /** APOLLO REQUESTS **/
    const [likeTargetArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
    const [createComment] = useMutation(CREATE_COMMENT);
    const [likeTargetComment] = useMutation(LIKE_TARGET_COMMENT);

    useQuery(GET_BOARD_ARTICLE, {
        fetchPolicy: 'network-only',
        variables: { input: articleId },
        skip: !articleId,
        onCompleted: (data: T) => setArticle(data?.getBoardArticle ?? null),
    });

    const { refetch: commentsRefetch } = useQuery(GET_COMMENTS, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: { commentRefId: articleId, commentGroup: 'ARTICLE' } } },
        skip: !articleId,
        onCompleted: (data: T) => {
            setComments(data?.getComments?.list ?? []);
            setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
        },
    });

    useQuery(GET_BOARD_ARTICLES, {
        fetchPolicy: 'cache-and-network',
        variables: { input: { page: 1, limit: 4, sort: 'createdAt', direction: 'DESC', search: article ? { articleCategory: article.articleCategory } : undefined } },
        skip: !article,
        onCompleted: (data: T) => setRelatedArticles((data?.getBoardArticles?.list ?? []).filter((a: T) => a._id !== articleId)),
    });

    /** HANDLERS **/
    const requireAuth = () => {
        if (!user?._id) {
            router.push('/account/join');
            return false;
        }
        return true;
    };

    const likeHandler = () => {
        if (!requireAuth() || !article) return;
        likeTargetArticle({ variables: { input: articleId } }).then(() => {
            setArticle((prev: any) =>
                prev
                    ? {
                        ...prev,
                        meLiked: [{ memberId: user._id, likeRefId: articleId, myFavorite: !prev.meLiked?.[0]?.myFavorite }],
                        articleLikes: (prev.articleLikes ?? 0) + (prev.meLiked?.[0]?.myFavorite ? -1 : 1),
                    }
                    : prev,
            );
        });
    };

    const likeCommentHandler = async (commentId: string) => {
        if (!requireAuth()) return;
        try {
            await likeTargetComment({ variables: { input: commentId } });
            setComments((prev) =>
                prev.map((c) =>
                    c._id === commentId
                        ? {
                            ...c,
                            meLiked: [{ memberId: user._id, likeRefId: commentId, myFavorite: !c.meLiked?.[0]?.myFavorite }],
                            commentLikes: (c.commentLikes ?? 0) + (c.meLiked?.[0]?.myFavorite ? -1 : 1),
                        }
                        : c,
                ),
            );
        } catch (err) {
            console.log('ERROR, likeCommentHandler:', err);
        }
    };

    const submitCommentHandler = async () => {
        if (!requireAuth() || !commentText.trim()) return;
        setCommentSubmitting(true);
        try {
            await createComment({
                variables: {
                    input: {
                        commentGroup: 'ARTICLE',
                        commentRefId: articleId,
                        commentContent: commentText.trim(),
                    },
                },
            });
            setCommentText('');
            const { data } = await commentsRefetch();
            setComments(data?.getComments?.list ?? []);
            setCommentTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
        } catch (err: any) {
            console.log('ERROR, submitCommentHandler:', err);
            alert(err?.message ?? 'Something went wrong');
        } finally {
            setCommentSubmitting(false);
        }
    };

    const viewAllCommentsHandler = async () => {
        try {
            if (showAllComments) {
                // ⚠️ TUZATILDI: avval faqat matn "View all"ga qaytar, lekin
                // ro'yxat hali ham to'liq (50 ta) qolib ketardi
                const { data } = await commentsRefetch({ input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: { commentRefId: articleId, commentGroup: 'ARTICLE' } } });
                setComments(data?.getComments?.list ?? []);
                setShowAllComments(false);
            } else {
                const { data } = await commentsRefetch({ input: { page: 1, limit: 50, sort: 'createdAt', direction: 'DESC', search: { commentRefId: articleId, commentGroup: 'ARTICLE' } } });
                setComments(data?.getComments?.list ?? []);
                setShowAllComments(true);
            }
        } catch (err) {
            console.log('ERROR, viewAllCommentsHandler:', err);
        }
    };

    if (!article) {
        return (
            <Box id="mobile-community-detail">
                <Stack alignItems="center" justifyContent="center" sx={{ height: '60vh' }}>
                    <Typography sx={{ fontFamily: 'Inter, sans-serif', color: '#999' }}>{t('Loading...')}</Typography>
                </Stack>
            </Box>
        );
    }

    const liked = article.meLiked?.[0]?.myFavorite;
    const catColor = CATEGORY_COLORS[article.articleCategory] ?? '#888';

    return (
        <Box component="div" id="mobile-community-detail">
            {/* ═══ HEADER ═══ */}
            <Stack direction="row" alignItems="center" className="cd-header">
                <IconButton className="cd-icon-btn" onClick={() => router.push('/community')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Stack>

            <Box component="div" className="cd-body">
                {/* ═══ KATEGORIYA + SARLAVHA ═══ */}
                <Box component="div" className="cd-cat-badge" sx={{ background: `${catColor}18`, color: catColor }}>
                    {t(article.articleCategory)}
                </Box>
                <Typography className="cd-title">{article.articleTitle}</Typography>

                {/* ═══ MUALLIF ═══ */}
                <Stack direction="row" alignItems="center" gap={1} className="cd-author-row">
                    <Box component="div" className="cd-author-avatar" style={{ backgroundImage: `url(${imgUrl(article.memberData?.memberImage)})` }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography className="cd-author-name">{article.memberData?.memberNick}</Typography>
                        <Stack direction="row" alignItems="center" gap={0.75}>
                            <Typography className="cd-time">{moment(article.createdAt).fromNow()}</Typography>
                            <Typography className="cd-dot">•</Typography>
                            <Stack direction="row" alignItems="center" gap={0.3}>
                                <RemoveRedEyeOutlinedIcon sx={{ fontSize: 12, color: '#aaa' }} />
                                <Typography className="cd-time">{article.articleViews ?? 0} {t('views')}</Typography>
                            </Stack>
                            <Typography className="cd-dot">•</Typography>
                            {/* ⚠️ YANGI — like soni endi shu yerda, views yonida */}
                            <Stack direction="row" alignItems="center" gap={0.3} onClick={likeHandler} className="cd-mini-like">
                                {liked ? <FavoriteIcon sx={{ fontSize: 12, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 12, color: '#aaa' }} />}
                                <Typography className="cd-time">{article.articleLikes ?? 0}</Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Stack>

                {/* ═══ ASOSIY RASM ═══ */}
                {article.articleImage && (
                    <Box component="div" className="cd-main-img" style={{ backgroundImage: `url(${imgUrl(article.articleImage)})` }}>
                        <IconButton className="cd-img-like-btn" onClick={likeHandler}>
                            {liked ? <FavoriteIcon sx={{ fontSize: 20, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 20, color: '#fff' }} />}
                        </IconButton>
                    </Box>
                )}

                {/* ═══ MATN ═══ */}
                <Stack className="cd-content">
                    {article.articleContent.split('\n').filter(Boolean).map((para: string, i: number) => (
                        <Typography key={i} className="cd-paragraph">{para}</Typography>
                    ))}
                </Stack>

                {/* ═══ COMMENTS ═══ */}
                <Box component="div" className="cd-comments-section">
                    <Typography className="cd-comments-title">{t('Comments')} ({commentTotal})</Typography>

                    {/* Yozish formasi */}
                    <Stack direction="row" alignItems="center" gap={1} className="cd-comment-form">
                        <Box component="div" className="cd-comment-avatar" style={{ backgroundImage: `url(${imgUrl(user?.memberImage)})` }} />
                        <input
                            className="cd-comment-input"
                            placeholder={t('Write a comment...')}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onFocus={() => { if (!user?._id) router.push('/account/join'); }}
                        />
                        <IconButton
                            className={`cd-comment-post ${!commentText.trim() || commentSubmitting ? 'disabled' : ''}`}
                            onClick={submitCommentHandler}
                        >
                            <SendIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Stack>
                    {!user?._id && <Typography className="cd-login-note">{t('Login to like or comment')}</Typography>}

                    {/* Izohlar ro'yxati */}
                    <Stack gap={1.5} sx={{ mt: 2 }}>
                        {comments.map((c: any) => {
                            const cLiked = c.meLiked?.[0]?.myFavorite;
                            return (
                                <Stack key={c._id} direction="row" gap={1} className="cd-comment-item">
                                    <Box component="div" className="cd-comment-item-avatar" style={{ backgroundImage: `url(${imgUrl(c.memberData?.memberImage)})` }} />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <Typography className="cd-comment-name">{c.memberData?.memberNick}</Typography>
                                            <Typography className="cd-comment-time">{moment(c.createdAt).fromNow()}</Typography>
                                        </Stack>
                                        <Typography className="cd-comment-text">{c.commentContent}</Typography>
                                    </Box>
                                    <Stack alignItems="center" className="cd-comment-like" onClick={() => likeCommentHandler(c._id)}>
                                        {cLiked ? <FavoriteIcon sx={{ fontSize: 15, color: '#FF4D8D' }} /> : <FavoriteBorderIcon sx={{ fontSize: 15, color: '#ccc' }} />}
                                        <Typography className="cd-comment-like-count">{c.commentLikes ?? 0}</Typography>
                                    </Stack>
                                </Stack>
                            );
                        })}
                    </Stack>

                    {commentTotal > comments.length && (
                        <Stack direction="row" alignItems="center" justifyContent="center" gap={0.3} className="cd-viewall" onClick={viewAllCommentsHandler}>
                            <Typography>{showAllComments ? t('Show less') : t('View all comments')}</Typography>
                            <ChevronRightIcon sx={{ fontSize: 16, transform: showAllComments ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
                        </Stack>
                    )}
                </Box>

                {/* ═══ RELATED ARTICLES ═══ */}
                {relatedArticles.length > 0 && (
                    <Box component="div" className="cd-related-section">
                        <Typography className="cd-related-title">{t('Related Articles')}</Typography>
                        {/* ⚠️ YANGI — avval oddiy scroll edi, endi Homepage'dagi kabi
							avtomatik aylanuvchi swiper */}
                        <Swiper
                            slidesPerView={2.2}
                            spaceBetween={12}
                            loop={relatedArticles.length > 2}
                            autoplay={{ delay: 3200, disableOnInteraction: false }}
                            className="cd-related-swiper"
                        >
                            {relatedArticles.map((a) => {
                                const rColor = CATEGORY_COLORS[a.articleCategory] ?? '#888';
                                return (
                                    <SwiperSlide key={a._id}>
                                        <Stack className="cd-related-card" onClick={() => router.push(`/community/detail?id=${a._id}`)}>
                                            <Box component="div" className="cd-related-img" style={{ backgroundImage: `url(${imgUrl(a.articleImage, '/img/banner/hero.jpg')})` }}>
                                                <Box component="div" className="cd-related-badge" sx={{ background: rColor }}>{t(a.articleCategory)}</Box>
                                            </Box>
                                            <Typography className="cd-related-card-title">{a.articleTitle}</Typography>
                                            <Typography className="cd-related-author">{a.memberData?.memberNick}</Typography>
                                            <Typography className="cd-related-views">{a.articleViews ?? 0} {t('views')}</Typography>
                                        </Stack>
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MobileCommunityDetail;