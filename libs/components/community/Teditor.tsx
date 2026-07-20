import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, FormControl, MenuItem, Stack, Typography, Select, TextField, IconButton } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
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
	// ⚠️ YANGI — avval bu qiymat useMemo ICHIDA (ko'rinmas holda) saqlanardi,
	// foydalanuvchi UNI hech qachon KO'RA olmasdi — faqat matn ichiga rasm
	// qo'yilganda "yon ta'sir" sifatida o'rnatilardi. Endi ALOHIDA, ANIQ
	// "Cover Image" bo'limi orqali boshqariladi.
	const [articleImage, setArticleImage] = useState<string>('');
	const [coverUploading, setCoverUploading] = useState<boolean>(false);
	const coverInputRef = useRef<HTMLInputElement>(null);

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
			setArticleImage(article.articleImage ?? '');
			setEditorReady(true); // data kelgach Editor'ni initialValue bilan render qilamiz
		},
	});

	/** HANDLERS **/
	// Muharrir ICHIGA (matn orasiga) rasm qo'yish uchun — endi bu FAQAT
	// content ichidagi rasm, Cover Image'ga hech qanday ta'sir qilmaydi
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
			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			console.log('Error, uploadImage:', err);
		}
	};

	// ⚠️ YANGI — aniq, ALOHIDA "Cover Image" yuklash (matnga tegmaydi)
	const coverUploadHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const image = e.target.files?.[0];
			if (!image) return;
			setCoverUploading(true);

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
		} catch (err) {
			console.log('Error, coverUploadHandler:', err);
			sweetMixinErrorAlert('Image upload failed').then();
		} finally {
			setCoverUploading(false);
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
							articleImage: articleImage,
						},
					},
				});
				await sweetTopSuccessAlert('Article is updated successfully', 700);
			} else {
				// ── CREATE: yangi maqola ──
				await createBoardArticle({
					variables: {
						input: { articleTitle, articleContent, articleImage: articleImage, articleCategory },
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
				{/* ⚠️ YANGI — avval ALOHIDA Cover Image yuklash imkoniyati
				    umuman yo'q edi, rasm faqat muharrir matni ICHIGA
				    qo'yilardi */}
				<Box component={'div'} style={{ width: '300px', flexDirection: 'column' }}>
					<Typography style={{ color: '#7f838d', margin: '10px' }} variant="h3">
						Cover Image
					</Typography>
					<Box
						component="div"
						onClick={() => coverInputRef.current?.click()}
						style={{
							width: '300px',
							height: '160px',
							background: '#fff',
							border: articleImage ? 'none' : '1.5px dashed rgba(255,77,141,0.4)',
							borderRadius: '10px',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px',
							cursor: 'pointer',
							overflow: 'hidden',
							position: 'relative',
						}}
					>
						{articleImage ? (
							<>
								<img
									src={articleImage.startsWith('http') ? articleImage : `${REACT_APP_API_URL}/${articleImage}`}
									alt="cover"
									style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
								/>
								<Box
									component="div"
									style={{
										position: 'absolute',
										bottom: 0,
										left: 0,
										right: 0,
										padding: '6px',
										background: 'rgba(0,0,0,0.55)',
										textAlign: 'center',
									}}
								>
									<Typography sx={{ fontSize: 11.5, color: '#fff', fontWeight: 600 }}>
										{coverUploading ? 'Uploading...' : 'Click to change'}
									</Typography>
								</Box>
							</>
						) : (
							<>
								<AddPhotoAlternateIcon sx={{ color: '#FF4D8D', fontSize: 30 }} />
								<Typography sx={{ fontSize: 13, color: '#888' }}>
									{coverUploading ? 'Uploading...' : 'Upload cover image'}
								</Typography>
							</>
						)}
					</Box>
					<input ref={coverInputRef} type="file" hidden accept="image/jpg, image/jpeg, image/png" onChange={coverUploadHandler} />
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
					// ⚠️ TUZATILDI: useEffect orqali urinish ishlamadi — Toast UI
					// Editor o'zining ICHKI tayyorlanish jarayoniga ega, va React
					// effect undan OLDINROQ ishga tushishi mumkin edi. Endi
					// editor'ning O'ZINING "load" hodisasidan foydalanamiz — bu
					// editor HAQIQATAN tayyor bo'lgandagina ishga tushadi.
					load: function () {
						if (isEditMode && editorRef.current) {
							editorRef.current.getInstance().setHTML(initialContent);
						}
					},
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