import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { sweetConfirmAlert } from '../../sweetAlert';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

const imgUrl = (raw?: string, fallback = '/img/banner/hero.jpg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const MobileMyArticles = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);

    const [articles, setArticles] = useState<any[]>([]);

    useQuery(GET_BOARD_ARTICLES, {
        fetchPolicy: 'network-only',
        variables: { input: { page: 1, limit: 20, sort: 'createdAt', direction: 'DESC', search: { memberId: user?._id } } },
        skip: !user?._id,
        onCompleted: (data: T) => setArticles(data?.getBoardArticles?.list ?? []),
    });

    const [updateBoardArticle] = useMutation(UPDATE_BOARD_ARTICLE);

    const deleteHandler = async (id: string) => {
        if (await sweetConfirmAlert(t('Are you sure you want to delete this article?'))) {
            try {
                // ⚠️ TUZATILDI: avval faqat UI holati yangilanardi, backend'ga
                // hech narsa yuborilmasdi — shuning uchun refreshdan keyin
                // maqola yana paydo bo'lardi. Endi haqiqiy "soft delete"
                // (articleStatus: DELETE) qo'llaniladi.
                await updateBoardArticle({ variables: { input: { _id: id, articleStatus: 'DELETE' } } });
                setArticles((prev) => prev.filter((a) => a._id !== id));
            } catch (err) {
                console.log('ERROR, deleteHandler:', err);
            }
        }
    };

    return (
        <Box component="div" id="mobile-myarticles">
            <Box component="div" className="ma-write-btn" onClick={() => router.push('/mypage?category=writeArticle')}>
                <AddIcon sx={{ fontSize: 18 }} />
                {t('Write New Article')}
            </Box>

            <Stack className="ma-list">
                {articles.length === 0 && (
                    <Stack alignItems="center" className="ma-empty">
                        <Typography className="ma-empty-emoji">📝</Typography>
                        <Typography className="ma-empty-title">{t("You haven't written any articles yet")}</Typography>
                    </Stack>
                )}

                {articles.map((a) => (
                    <Stack key={a._id} direction="row" gap={1.25} className="ma-card" onClick={() => router.push(`/community/detail?id=${a._id}`)}>
                        <Box component="div" className="ma-card-img" style={{ backgroundImage: `url(${imgUrl(a.articleImage)})` }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography className="ma-card-title">{a.articleTitle}</Typography>
                            <Typography className="ma-card-time">{moment(a.createdAt).fromNow()}</Typography>
                            <Stack direction="row" alignItems="center" gap={1.25} sx={{ mt: 0.5 }}>
                                <Stack direction="row" alignItems="center" gap={0.3}>
                                    <FavoriteBorderIcon sx={{ fontSize: 12, color: '#aaa' }} />
                                    <Typography className="ma-meta">{a.articleLikes ?? 0}</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" gap={0.3}>
                                    <ChatBubbleOutlineIcon sx={{ fontSize: 11, color: '#aaa' }} />
                                    <Typography className="ma-meta">{a.articleComments ?? 0}</Typography>
                                </Stack>
                                <Stack direction="row" alignItems="center" gap={0.3}>
                                    <RemoveRedEyeOutlinedIcon sx={{ fontSize: 12, color: '#aaa' }} />
                                    <Typography className="ma-meta">{a.articleViews ?? 0}</Typography>
                                </Stack>
                            </Stack>
                            <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                                <Box component="div" className="ma-edit-btn" onClick={(e: any) => { e.stopPropagation(); router.push(`/mypage?category=writeArticle&id=${a._id}`); }}>
                                    {t('Edit')}
                                </Box>
                                <Box component="div" className="ma-delete-btn" onClick={(e: any) => { e.stopPropagation(); deleteHandler(a._id); }}>
                                    {t('Delete')}
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
};

export default MobileMyArticles;