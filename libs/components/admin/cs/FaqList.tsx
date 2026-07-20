import React, { useState } from 'react';
import { Box, Stack, Typography, IconButton, Chip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const CATEGORY_COLOR: Record<string, string> = {
	BOOKING: 'type-user',
	PAYMENT: 'type-agent',
	ACCOUNT: 'type-admin',
	SALONS: 'type-user',
	OTHER: 'type-agent',
};

interface FaqListProps {
	faqs: any[];
	onEdit: (faq: any) => void;
	onDelete: (id: string) => void;
	onToggleStatus: (faq: any) => void;
}

// ⚠️ MUHIM: bu komponent avval "Users" jadvalidan nusxa kochirilgan,
// hech qanday haqiqiy malumotga ega bolmagan holat edi. Endi toliq
// qayta qurildi — mavjud admin-table-* CSS klasslaridan foydalanadi.

export const FaqList = ({ faqs, onEdit, onDelete, onToggleStatus }: FaqListProps) => {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	return (
		<Box component="div">
			<Stack direction="row" alignItems="center" className="admin-table-head">
				<Typography className="th" sx={{ width: '12%' }}>CATEGORY</Typography>
				<Typography className="th" sx={{ width: '48%' }}>QUESTION</Typography>
				<Typography className="th" sx={{ width: '15%' }}>STATUS</Typography>
				<Typography className="th" sx={{ width: '25%', textAlign: 'right' }}>ACTIONS</Typography>
			</Stack>

			{faqs.length === 0 && (
				<Stack alignItems="center" className="admin-no-data">
					<Typography>No FAQs found</Typography>
				</Stack>
			)}

			{faqs.map((faq) => {
				const isOpen = expandedId === faq._id;
				return (
					<Box component="div" key={faq._id}>
						<Stack direction="row" alignItems="center" className="admin-table-row" onClick={() => setExpandedId(isOpen ? null : faq._id)} sx={{ cursor: 'pointer' }}>
							<Box sx={{ width: '12%' }}>
								<Chip label={faq.faqCategory} size="small" className={`admin-chip ${CATEGORY_COLOR[faq.faqCategory] ?? 'type-user'}`} />
							</Box>
							<Stack direction="row" alignItems="center" gap={0.5} sx={{ width: '48%' }}>
								{isOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: '#999' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: '#999' }} />}
								<Typography className="td">{faq.faqQuestion}</Typography>
							</Stack>
							<Box sx={{ width: '15%' }}>
								<Chip
									label={faq.faqStatus}
									size="small"
									className={`admin-chip ${faq.faqStatus === 'ACTIVE' ? 'type-agent' : 'type-user'}`}
									onClick={(e: any) => { e.stopPropagation(); onToggleStatus(faq); }}
								/>
							</Box>
							<Stack direction="row" justifyContent="flex-end" sx={{ width: '25%' }}>
								<IconButton size="small" onClick={(e: any) => { e.stopPropagation(); onEdit(faq); }}>
									<EditOutlinedIcon sx={{ fontSize: 18, color: '#666' }} />
								</IconButton>
								<IconButton size="small" onClick={(e: any) => { e.stopPropagation(); onDelete(faq._id); }}>
									<DeleteOutlineIcon sx={{ fontSize: 18, color: '#DC3545' }} />
								</IconButton>
							</Stack>
						</Stack>
						{isOpen && (
							<Box component="div" sx={{ padding: '0 20px 16px', background: '#FAFAFA' }}>
								<Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#555', lineHeight: 1.6 }}>
									{faq.faqAnswer}
								</Typography>
							</Box>
						)}
					</Box>
				);
			})}
		</Box>
	);
};