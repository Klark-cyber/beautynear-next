import React from 'react';
import { Box, Stack, Typography, IconButton, Chip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import moment from 'moment';

const TYPE_COLOR: Record<string, string> = {
	NOTICE: 'type-user',
	EVENT: 'type-agent',
	WARNING: 'type-admin',
};

interface NoticeListProps {
	notices: any[];
	onEdit: (notice: any) => void;
	onDelete: (id: string) => void;
	onTogglePin: (notice: any) => void;
}

// ⚠️ MUHIM: bu komponent avval "Users" jadvalidan nusxa ko'chirilgan,
// hech qanday haqiqiy ma'lumotga ega bo'lmagan holat edi (literal
// 'member._id', 'mb id' kabi qatorlar bor edi). Endi to'liq qayta
// qurildi — mavjud admin-table-* CSS klasslaridan foydalanadi.

export const NoticeList = ({ notices, onEdit, onDelete, onTogglePin }: NoticeListProps) => {
	return (
		<Box component="div">
			<Stack direction="row" alignItems="center" className="admin-table-head">
				<Box sx={{ width: '8%' }} />
				<Typography className="th" sx={{ width: '10%' }}>TYPE</Typography>
				<Typography className="th" sx={{ width: '40%' }}>TITLE</Typography>
				<Typography className="th" sx={{ width: '12%' }}>VIEWS</Typography>
				<Typography className="th" sx={{ width: '15%' }}>DATE</Typography>
				<Typography className="th" sx={{ width: '15%', textAlign: 'right' }}>ACTIONS</Typography>
			</Stack>

			{notices.length === 0 && (
				<Stack alignItems="center" className="admin-no-data">
					<Typography>No notices found</Typography>
				</Stack>
			)}

			{notices.map((notice) => (
				<Stack key={notice._id} direction="row" alignItems="center" className="admin-table-row">
					<Box sx={{ width: '8%' }}>
						<IconButton size="small" onClick={() => onTogglePin(notice)}>
							{notice.noticePinned ? <PushPinIcon sx={{ fontSize: 18, color: '#FF4D8D' }} /> : <PushPinOutlinedIcon sx={{ fontSize: 18, color: '#ccc' }} />}
						</IconButton>
					</Box>
					<Box sx={{ width: '10%' }}>
						<Chip label={notice.noticeType} size="small" className={`admin-chip ${TYPE_COLOR[notice.noticeType] ?? 'type-user'}`} />
					</Box>
					<Typography className="td" sx={{ width: '40%' }}>{notice.noticeTitle}</Typography>
					<Typography className="td" sx={{ width: '12%' }}>{notice.noticeViews ?? 0}</Typography>
					<Typography className="td" sx={{ width: '15%' }}>{moment(notice.createdAt).format('MMM DD, YYYY')}</Typography>
					<Stack direction="row" justifyContent="flex-end" sx={{ width: '15%' }}>
						<IconButton size="small" onClick={() => onEdit(notice)}>
							<EditOutlinedIcon sx={{ fontSize: 18, color: '#666' }} />
						</IconButton>
						<IconButton size="small" onClick={() => onDelete(notice._id)}>
							<DeleteOutlineIcon sx={{ fontSize: 18, color: '#DC3545' }} />
						</IconButton>
					</Stack>
				</Stack>
			))}
		</Box>
	);
};