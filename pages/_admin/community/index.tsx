import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Select, MenuItem, Pagination as MuiPagination } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_BOARD_ARTICLES_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_BOARD_ARTICLE_BY_ADMIN, REMOVE_BOARD_ARTICLE_BY_ADMIN } from '../../../apollo/admin/mutation';
import CommunityArticleList from '../../../libs/components/admin/community/CommunityArticleList';
import { AllBoardArticlesInquiry } from '../../../libs/types/board-article/board-article.input';
import { BoardArticle } from '../../../libs/types/board-article/board-article';
import { BoardArticleCategory, BoardArticleStatus } from '../../../libs/enums/board-article.enum';
import { T } from '../../../libs/types/common';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

const STATUS_TABS = [
	{ label: 'All', value: undefined },
	{ label: 'Active', value: BoardArticleStatus.ACTIVE },
	{ label: 'Deleted', value: BoardArticleStatus.DELETE },
];

const AdminCommunity: NextPage = ({
	initialInquiry = { page: 1, limit: 15, sort: 'createdAt', direction: 'DESC', search: {} },
	...props
}: any) => {
	const [articlesInquiry, setArticlesInquiry] = useState<AllBoardArticlesInquiry>(initialInquiry);
	const [articles, setArticles] = useState<BoardArticle[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
	const [anchorEl, setAnchorEl] = useState<any[]>([]);

	/** APOLLO REQUESTS **/
	const [updateBoardArticleByAdmin] = useMutation(UPDATE_BOARD_ARTICLE_BY_ADMIN);
	const [removeBoardArticleByAdmin] = useMutation(REMOVE_BOARD_ARTICLE_BY_ADMIN);

	const { refetch } = useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: articlesInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setArticles(data?.getAllBoardArticlesByAdmin?.list ?? []);
			setTotal(data?.getAllBoardArticlesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const tabChangeHandler = (status: BoardArticleStatus | undefined) => {
		const search: T = { ...articlesInquiry.search };
		if (status) search.articleStatus = status;
		else delete search.articleStatus;
		setArticlesInquiry({ ...articlesInquiry, page: 1, search });
	};

	const categoryChangeHandler = (category: string) => {
		setCategoryFilter(category);
		const search: T = { ...articlesInquiry.search };
		if (category !== 'ALL') search.articleCategory = category as BoardArticleCategory;
		else delete search.articleCategory;
		setArticlesInquiry({ ...articlesInquiry, page: 1, search });
	};

	const paginationHandler = (_e: any, value: number) => {
		setArticlesInquiry({ ...articlesInquiry, page: value });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const temp = anchorEl.slice();
		temp[index] = e.currentTarget;
		setAnchorEl(temp);
	};

	const menuIconCloseHandler = () => setAnchorEl([]);

	const updateArticleHandler = async (updateData: { _id: string; articleStatus: BoardArticleStatus }) => {
		menuIconCloseHandler();
		try {
			if (await sweetConfirmAlert(`Are you sure to change status to ${updateData.articleStatus}?`)) {
				await updateBoardArticleByAdmin({ variables: { input: updateData } });
				await refetch({ input: articlesInquiry });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	// Faqat DELETE holatidagi (soft-deleted) maqolalarni butunlay o'chirish uchun
	const removeArticleHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert('Are you sure to permanently remove this article?')) {
				await removeBoardArticleByAdmin({ variables: { input: id } });
				await refetch({ input: articlesInquiry });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const activeStatus = articlesInquiry.search.articleStatus;

	return (
		<Box component="div" className="admin-content">
			<Typography className="admin-page-title">Community Management</Typography>
			<Typography className="admin-page-subtitle">Manage all articles posted in the community</Typography>

			{/* Status tablar */}
			<Stack direction="row" gap={1.5} className="admin-filter-tabs">
				{STATUS_TABS.map((tab) => (
					<Box
						key={tab.label}
						component="div"
						className={`admin-filter-tab ${activeStatus === tab.value ? 'active' : ''}`}
						onClick={() => tabChangeHandler(tab.value)}
					>
						{tab.label}
					</Box>
				))}
			</Stack>

			{/* Kategoriya filtri */}
			<Stack direction="row" gap={2} className="admin-search-row">
				<Select className="admin-select" value={categoryFilter} onChange={(e) => categoryChangeHandler(e.target.value)}>
					<MenuItem value="ALL">All Categories</MenuItem>
					{Object.values(BoardArticleCategory).map((cat) => (
						<MenuItem key={cat} value={cat}>{cat}</MenuItem>
					))}
				</Select>
			</Stack>

			{/* Jadval */}
			<Box component="div" className="admin-table-frame">
				<CommunityArticleList
					articles={articles}
					anchorEl={anchorEl}
					menuIconClickHandler={menuIconClickHandler}
					menuIconCloseHandler={menuIconCloseHandler}
					updateArticleHandler={updateArticleHandler}
					removeArticleHandler={removeArticleHandler}
				/>

				{articles.length !== 0 && (
					<Stack alignItems="center" sx={{ mt: 3 }}>
						<MuiPagination
							page={articlesInquiry.page}
							count={Math.ceil(total / articlesInquiry.limit)}
							onChange={paginationHandler}
							shape="circular"
							sx={{ '& .MuiPaginationItem-root.Mui-selected': { background: '#FF4D8D', color: '#fff' } }}
						/>
					</Stack>
				)}
			</Box>
		</Box>
	);
};

AdminCommunity.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 15,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminCommunity);