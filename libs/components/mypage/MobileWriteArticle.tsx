import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, OutlinedInput, IconButton } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import axios from 'axios';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_BOARD_ARTICLE } from '../../../apollo/user/query';
import { CREATE_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

const CATEGORIES = [
    { label: 'Recommend', value: 'RECOMMEND' },
    { label: 'News', value: 'NEWS' },
    { label: 'Humor', value: 'HUMOR' },
];

const imgUrl = (raw?: string): string => {
    if (!raw) return '';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const MobileWriteArticle = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const user = useReactiveVar(userVar);
    const token = getJwtToken();
    const imageInputRef = useRef<HTMLInputElement>(null);

    const editId = router.query.id as string | undefined;
    const isEditMode = Boolean(editId);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('RECOMMEND');
    const [content, setContent] = useState('');
    const [articleImage, setArticleImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [createBoardArticle] = useMutation(CREATE_BOARD_ARTICLE);
    const [updateBoardArticle] = useMutation(UPDATE_BOARD_ARTICLE);

    useQuery(GET_BOARD_ARTICLE, {
        fetchPolicy: 'network-only',
        variables: { input: editId },
        skip: !editId,
        onCompleted: (data: any) => {
            const a = data?.getBoardArticle;
            console.log('[EDIT ARTICLE] fetched data:', a);
            console.log('[EDIT ARTICLE] articleContent value:', JSON.stringify(a?.articleContent));
            if (a) {
                setTitle(a.articleTitle ?? '');
                setCategory(a.articleCategory ?? 'RECOMMEND');
                setContent(a.articleContent ?? '');
                setArticleImage(a.articleImage ?? '');
            }
        },
    });

    // ⚠️ YANGI — MyProfile'dagi bilan bir xil multipart yuklash naqshi,
    // faqat target: 'article' bilan
    const uploadImageHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const image = e.target.files?.[0];
            if (!image) return;
            setUploading(true);

            const formData = new FormData();
            formData.append('operations', JSON.stringify({
                query: `mutation ImageUploader($file: Upload!, $target: String!) {
					imageUploader(file: $file, target: $target)
				}`,
                variables: { file: null, target: 'article' },
            }));
            formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
            formData.append('0', image);

            const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'apollo-require-preflight': true,
                    Authorization: `Bearer ${token}`,
                },
            });

            setArticleImage(response.data.data.imageUploader);
        } catch (err: any) {
            console.log('Error, uploadImageHandler:', err);
            sweetMixinErrorAlert('Image upload failed').then();
        } finally {
            setUploading(false);
        }
    };

    const canPublish = title.trim() && content.trim() && !submitting && !uploading;

    const publishHandler = async () => {
        if (!canPublish) return;
        setSubmitting(true);
        try {
            if (isEditMode) {
                await updateBoardArticle({
                    variables: {
                        input: {
                            _id: editId,
                            articleCategory: category,
                            articleTitle: title.trim(),
                            articleContent: content.trim(),
                            articleImage,
                        },
                    },
                });
                await sweetMixinSuccessAlert(t('Article updated!'));
            } else {
                await createBoardArticle({
                    variables: {
                        input: {
                            articleCategory: category,
                            articleTitle: title.trim(),
                            articleContent: content.trim(),
                            articleImage,
                        },
                    },
                });
                await sweetMixinSuccessAlert(t('Article published!'));
            }
            router.push('/mypage?category=myArticles');
        } catch (err: any) {
            sweetErrorHandling(err).then();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box component="div" id="mobile-writearticle">
            <Stack direction="row" alignItems="center" justifyContent="flex-end" className="wa-topbar">
                <Box
                    component="div"
                    className={`wa-publish-btn ${!canPublish ? 'disabled' : ''}`}
                    onClick={publishHandler}
                >
                    {submitting ? t(isEditMode ? 'Updating...' : 'Publishing...') : t(isEditMode ? 'Update' : 'Publish')}
                </Box>
            </Stack>

            {/* ═══ YANGI — MAQOLA RASMI ═══ */}
            <Typography className="wa-label">{t('Cover Image')}</Typography>
            <Box component="div" className="wa-image-upload" onClick={() => imageInputRef.current?.click()}>
                {articleImage ? (
                    <Box component="div" className="wa-image-preview" style={{ backgroundImage: `url(${imgUrl(articleImage)})` }}>
                        <Box component="div" className="wa-image-change">{t('Change')}</Box>
                    </Box>
                ) : (
                    <Stack alignItems="center" gap={0.5} className="wa-image-placeholder">
                        <AddPhotoAlternateIcon sx={{ fontSize: 26, color: '#FF4D8D' }} />
                        <Typography className="wa-image-placeholder-text">{uploading ? t('Uploading...') : t('Add a cover image')}</Typography>
                    </Stack>
                )}
                <input ref={imageInputRef} type="file" hidden accept="image/jpg, image/jpeg, image/png" onChange={uploadImageHandler} />
            </Box>

            <Typography className="wa-label">{t('Title')}</Typography>
            <OutlinedInput
                fullWidth
                className="wa-title-input"
                placeholder={t('Enter article title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <Typography className="wa-label">{t('Category')}</Typography>
            <Stack direction="row" gap={1} className="wa-cat-row">
                {CATEGORIES.map((c) => (
                    <Box
                        key={c.value}
                        component="div"
                        className={`wa-cat-chip ${category === c.value ? 'active' : ''}`}
                        onClick={() => setCategory(c.value)}
                    >
                        {t(c.label)}
                    </Box>
                ))}
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography className="wa-label">{t('Content')}</Typography>
                <Typography className="wa-char-count">{content.length}/5000</Typography>
            </Stack>
            <textarea
                className="wa-content-textarea"
                placeholder={t('Write your article...')}
                value={content}
                maxLength={5000}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
            />
        </Box>
    );
};

export default MobileWriteArticle;