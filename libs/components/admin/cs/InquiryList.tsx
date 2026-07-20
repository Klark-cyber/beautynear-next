import React from 'react';
import { Box, Stack, Typography, Chip } from '@mui/material';
import moment from 'moment';
import { REACT_APP_API_URL } from '../../../config';

const imgUrl = (raw?: string): string => {
	if (!raw) return '/img/profile/defaultUser.svg';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const STATUS_COLOR: Record<string, string> = {
	WAITING: 'type-admin',
	ANSWERED: 'type-agent',
	CLOSED: 'type-user',
};

interface InquiryListProps {
	inquiries: any[];
	onSelect: (inquiry: any) => void;
	selectedId: string | null;
}

// ⚠️ MUHIM: bu komponent avval "Users" jadvalidan nusxa kochirilgan,
// hech qanday haqiqiy malumotga ega bolmagan holat edi. Endi toliq
// qayta qurildi.

export const InquiryList = ({ inquiries, onSelect, selectedId }: InquiryListProps) => {
	return (
		<Box component="div">
			<Stack direction="row" alignItems="center" className="admin-table-head">
				<Typography className="th" sx={{ width: '22%' }}>FROM</Typography>
				<Typography className="th" sx={{ width: '38%' }}>SUBJECT</Typography>
				<Typography className="th" sx={{ width: '15%' }}>STATUS</Typography>
				<Typography className="th" sx={{ width: '25%' }}>DATE</Typography>
			</Stack>

			{inquiries.length === 0 && (
				<Stack alignItems="center" className="admin-no-data">
					<Typography>No inquiries found</Typography>
				</Stack>
			)}

			{inquiries.map((inquiry) => (
				<Stack
					key={inquiry._id}
					direction="row"
					alignItems="center"
					className="admin-table-row"
					onClick={() => onSelect(inquiry)}
					sx={{ cursor: 'pointer', background: selectedId === inquiry._id ? 'rgba(255,77,141,0.04)' : undefined }}
				>
					<Stack direction="row" alignItems="center" gap={1} sx={{ width: '22%', minWidth: 0 }}>
						<Box
							component="div"
							sx={{
								width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
								backgroundImage: `url(${imgUrl(inquiry.memberData?.memberImage)})`,
								backgroundSize: 'cover', backgroundPosition: 'center',
							}}
						/>
						<Typography className="td" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
							{inquiry.memberData?.memberNick}
						</Typography>
					</Stack>
					<Typography className="td" sx={{ width: '38%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
						{inquiry.inquirySubject}
					</Typography>
					<Box sx={{ width: '15%' }}>
						<Chip label={inquiry.inquiryStatus} size="small" className={`admin-chip ${STATUS_COLOR[inquiry.inquiryStatus] ?? 'type-user'}`} />
					</Box>
					<Typography className="td" sx={{ width: '25%' }}>{moment(inquiry.createdAt).format('MMM DD, YYYY')}</Typography>
				</Stack>
			))}
		</Box>
	);
};