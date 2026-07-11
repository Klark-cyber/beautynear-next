import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, FormControl, MenuItem, Stack, Typography, Select, TextField } from '@mui/material';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Editor } from '@toast-ui/react-editor';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import axios from 'axios';
import { T } from '../../types/common';
import '@toast-ui/editor/dist/toastui-editor.css';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { CREATE_BOARD_ARTICLE, UPDATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { GET_BOARD_ARTICLE } from '../../../apollo/user/query';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert, sweetTopSuccessAlert } from '../../sweetAlert';
import { Message } from '../../enums/common.enum';

const TuiEditor = () => {
	const editorRef = useRef<Editor>(null),
		token = getJwtToken(),
		router = useRouter();

	// ⚠️ articleId router.query'da bo'lsa — bu EDIT rejimi, bo'lmasa CREATE rejimi
	const articleId = router.query.articleId as string | undefined;
	const isEditMode = Boolean(articleId);

	const [articleCategory, setArticleCategory] = useState<BoardArticleCategory>(BoardArticleCategory.FREE);
	const [articleTitle, setArticleTitle] = useState<string>('');
	const [initialContent, setInitialContent] = useState<string>('Type here');
	const [editorReady, setEditorReady] = useState<boolean>(!isEditMode); // create rejimida darhol tayyor

	const memoizedValues = useMemo(() => {
		return { articleImage: '' };
	}, []);

	/** APOLLO REQUESTS **/
	const [createBoardArticle] = useMutation(CREATE_BOARD_ARTICLE);
	const [updateBoardArticle] = useMutation(UPDATE_BOARD_ARTICLE);

	// Edit rejimida — mavjud maqolani yuklab olamiz
	const { data: getBoardArticleData } = useQuery(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: { input: articleId },
		skip: !isEditMode,
		onCompleted: (data: T) => {
			const article = data?.getBoardArticle;
			if (!article) return;
			setArticleTitle(article.articleTitle ?? '');
			setArticleCategory(article.articleCategory ?? BoardArticleCategory.FREE);
			setInitialContent(article.articleContent || 'Type here');
			memoizedValues.articleImage = article.articleImage ?? '';
			setEditorReady(true); // data kelgach Editor'ni initialValue bilan render qilamiz
		},
	});

	/** HANDLERS **/
	const uploadImage = async (image: any) => {
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target) 
				  }`,
					variables: {
						file: null,
						target: 'article',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.file'],
				}),
			);
			formData.append('0', image);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			memoizedValues.articleImage = responseImage;

			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			console.log('Error, uploadImage:', err);
		}
	};

	const changeCategoryHandler = (e: any) => {
		setArticleCategory(e.target.value);
	};

	const articleTitleHandler = (e: T) => {
		setArticleTitle(e.target.value);
	};

	const handleRegisterButton = async () => {
		try {
			const editor = editorRef.current;
			const articleContent = editor?.getInstance().getHTML() as string;

			if (articleContent === '' && articleTitle === '') {
				throw new Error(Message.INSERT_ALL_INPUTS);
			}

			if (isEditMode) {
				// ── UPDATE: mavjud maqolani yangilaymiz, yangisini yaratmaymiz ──
				await updateBoardArticle({
					variables: {
						input: {
							_id: articleId,
							articleTitle,
							articleContent,
							articleImage: memoizedValues.articleImage,
						},
					},
				});
				await sweetTopSuccessAlert('Article is updated successfully', 700);
			} else {
				// ── CREATE: yangi maqola ──
				await createBoardArticle({
					variables: {
						input: { articleTitle, articleContent, articleImage: memoizedValues.articleImage, articleCategory },
					},
				});
				await sweetTopSuccessAlert('Article is created successfully', 700);
			}

			await router.push({
				pathname: '/mypage',
				query: { category: 'myArticles' },
			});
		} catch (err: any) {
			console.log(err);
			sweetErrorHandling(new Error(Message.INSERT_ALL_INPUTS)).then();
		}
	};

	const doDisabledCheck = () => {
		if (articleTitle === '') {
			return true;
		}
	};

	// Edit rejimida data hali kelmagan bo'lsa — Editor'ni render qilmaymiz
	// (Toast UI Editor initialValue faqat mount vaqtida o'qiladi, shuning
	// uchun data kelgach qayta render qilib, to'g'ri boshlang'ich matn bilan
	// ko'rsatishimiz kerak)
	if (isEditMode && !editorReady) {
		return (
			<Stack alignItems="center" sx={{ py: 10 }}>
				<Typography>Loading article...</Typography>
			</Stack>
		);
	}

	return (
		<Stack>
			<Stack direction="row" style={{ margin: '40px' }} justifyContent="space-evenly">
				<Box component={'div'} className={'form_row'} style={{ width: '300px' }}>
					<Typography style={{ color: '#7f838d', margin: '10px' }} variant="h3">
						Category
					</Typography>
					<FormControl sx={{ width: '100%', background: 'white' }}>
						<Select
							value={articleCategory}
							onChange={changeCategoryHandler}
							displayEmpty
							inputProps={{ 'aria-label': 'Without label' }}
						>
							<MenuItem value={BoardArticleCategory.FREE}>
								<span>Free</span>
							</MenuItem>
							<MenuItem value={BoardArticleCategory.HUMOR}>Humor</MenuItem>
							<MenuItem value={BoardArticleCategory.NEWS}>News</MenuItem>
							<MenuItem value={BoardArticleCategory.RECOMMEND}>Recommendation</MenuItem>
						</Select>
					</FormControl>
				</Box>
				<Box component={'div'} style={{ width: '300px', flexDirection: 'column' }}>
					<Typography style={{ color: '#7f838d', margin: '10px' }} variant="h3">
						Title
					</Typography>
					<TextField
						onChange={articleTitleHandler}
						value={articleTitle}
						id="filled-basic"
						label="Type Title"
						style={{ width: '300px', background: 'white' }}
					/>
				</Box>
			</Stack>

			<Editor
				key={isEditMode ? `edit-${articleId}` : 'create'}
				initialValue={initialContent}
				placeholder={'Type here'}
				previewStyle={'vertical'}
				height={'640px'}
				// @ts-ignore
				initialEditType={'WYSIWYG'}
				toolbarItems={[
					['heading', 'bold', 'italic', 'strike'],
					['image', 'table', 'link'],
					['ul', 'ol', 'task'],
				]}
				ref={editorRef}
				hooks={{
					addImageBlobHook: async (image: any, callback: any) => {
						const uploadedImageURL = await uploadImage(image);
						callback(uploadedImageURL);
						return false;
					},
				}}
				events={{
					load: function (param: any) { },
				}}
			/>

			<Stack direction="row" justifyContent="center">
				<Button
					variant="contained"
					color="primary"
					style={{ margin: '30px', width: '250px', height: '45px' }}
					onClick={handleRegisterButton}
					disabled={doDisabledCheck()}
				>
					{isEditMode ? 'Update' : 'Register'}
				</Button>
			</Stack>
		</Stack>
	);
};

export default TuiEditor;