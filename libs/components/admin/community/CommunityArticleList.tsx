import React from 'react';
import { Menu, MenuItem, Chip, IconButton, Stack, Typography, Box } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { BoardArticle } from '../../../types/board-article/board-article';
import { REACT_APP_API_URL } from '../../../config';
import { BoardArticleStatus } from '../../../enums/board-article.enum';

interface CommunityArticleListProps {
	articles: BoardArticle[];
	anchorEl: any[];
	menuIconClickHandler: (e: any, index: number) => void;
	menuIconCloseHandler: () => void;
	updateArticleHandler: (data: { _id: string; articleStatus: BoardArticleStatus }) => void;
	removeArticleHandler: (id: string) => void;
}

const CATEGORY_COLOR: Record<string, string> = {
	FREE: 'active',
	RECOMMEND: 'agent',
	NEWS: 'user',
	HUMOR: 'paused',
};

const STATUS_COLOR: Record<string, string> = {
	ACTIVE: 'active',
	DELETE: 'deleted',
};

const imgUrl = (raw?: string): string => {
	if (!raw) return '/img/community/articleImg.png';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

// HTML teglarni tozalash (TUI Editor HTML saqlaydi)
const stripHtml = (html?: string): string => {
	if (!html) return '';
	return html.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const CommunityArticleList = (props: CommunityArticleListProps) => {
	const { articles, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateArticleHandler, removeArticleHandler } = props;

	return (
		<Stack className="admin-member-table">
			{/* Sarlavha qatori */}
			<Stack direction="row" alignItems="center" className="admin-table-head">
				<Typography className="th" sx={{ flex: '0 0 320px' }}>Article</Typography>
				<Typography className="th" sx={{ flex: '0 0 160px' }}>Author</Typography>
				<Typography className="th" sx={{ flex: '0 0 110px' }}>Category</Typography>
				<Typography className="th" sx={{ flex: '0 0 90px' }} align="center">Views</Typography>
				<Typography className="th" sx={{ flex: '0 0 90px' }} align="center">Likes</Typography>
				<Typography className="th" sx={{ flex: '0 0 120px' }} align="center">Status</Typography>
				<Typography className="th" sx={{ flex: '0 0 60px' }} align="center">-</Typography>
			</Stack>

			{articles.length === 0 && (
				<Stack alignItems="center" className="admin-no-data">
					<Typography>No articles found</Typography>
				</Stack>
			)}

			{articles.map((article, index) => (
				<Stack key={article._id} direction="row" alignItems="center" className="admin-table-row">
					{/* Article */}
					<Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: '0 0 320px', minWidth: 0, overflow: 'hidden' }}>
						<Box
							component="div"
							sx={{
								width: 46, height: 46, borderRadius: 2, flexShrink: 0,
								backgroundImage: `url(${imgUrl(article.articleImage)})`,
								backgroundSize: 'cover', backgroundPosition: 'center',
							}}
						/>
						<Box component="div" sx={{ minWidth: 0 }}>
							<Typography className="member-nick" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{article.articleTitle}
							</Typography>
							<Typography className="member-fullname" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{stripHtml(article.articleContent)}
							</Typography>
						</Box>
					</Stack>

					{/* Author */}
					<Stack direction="row" alignItems="center" gap={1} sx={{ flex: '0 0 160px', minWidth: 0, overflow: 'hidden' }}>
						<Box
							component="div"
							sx={{
								width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
								backgroundImage: `url(${!article.memberData?.memberImage
										? '/img/profile/defaultUser.svg'
										: article.memberData.memberImage.startsWith('http')
											? article.memberData.memberImage
											: `${REACT_APP_API_URL}/${article.memberData.memberImage}`
									})`,
								backgroundSize: 'cover', backgroundPosition: 'center',
							}}
						/>
						<Typography className="td" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
							{article.memberData?.memberNick ?? '-'}
						</Typography>
					</Stack>

					{/* Category */}
					<Box sx={{ flex: '0 0 110px' }}>
						<Chip label={article.articleCategory} size="small" className={`admin-chip type-${CATEGORY_COLOR[article.articleCategory]}`} />
					</Box>

					{/* Views */}
					<Stack direction="row" alignItems="center" justifyContent="center" gap={0.4} sx={{ flex: '0 0 90px' }}>
						<RemoveRedEyeIcon sx={{ fontSize: 14, color: '#999' }} />
						<Typography className="td">{article.articleViews ?? 0}</Typography>
					</Stack>

					{/* Likes */}
					<Stack direction="row" alignItems="center" justifyContent="center" gap={0.4} sx={{ flex: '0 0 90px' }}>
						<FavoriteIcon sx={{ fontSize: 13, color: '#FF4D8D' }} />
						<Typography className="td">{article.articleLikes ?? 0}</Typography>
					</Stack>

					{/* Status */}
					<Box sx={{ flex: '0 0 120px', textAlign: 'center' }}>
						<Chip
							label={article.articleStatus}
							size="small"
							className={`admin-chip status-${STATUS_COLOR[article.articleStatus]}`}
							onClick={(e) => menuIconClickHandler(e, index)}
						/>
						<Menu
							anchorEl={anchorEl[index]}
							open={Boolean(anchorEl[index])}
							onClose={menuIconCloseHandler}
							PaperProps={{ sx: { borderRadius: 2, mt: 0.5 } }}
						>
							{Object.values(BoardArticleStatus)
								.filter((v) => v !== article.articleStatus)
								.map((status) => (
									<MenuItem key={status} onClick={() => updateArticleHandler({ _id: article._id, articleStatus: status })}>
										{status}
									</MenuItem>
								))}
						</Menu>
					</Box>

					{/* Delete — faqat DELETE holatidagilar uchun butunlay ochirish */}
					<Box sx={{ flex: '0 0 60px', textAlign: 'center' }}>
						{article.articleStatus === BoardArticleStatus.DELETE && (
							<IconButton size="small" onClick={() => removeArticleHandler(article._id)}>
								<DeleteOutlineIcon sx={{ fontSize: 18, color: '#FF4D6A' }} />
							</IconButton>
						)}
					</Box>
				</Stack>
			))}
		</Stack>
	);
};

export default CommunityArticleList;