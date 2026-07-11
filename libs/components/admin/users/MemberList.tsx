import React from 'react';
import Link from 'next/link';
import { Menu, MenuItem, Avatar, Chip, IconButton, Stack, Typography, Box } from '@mui/material';
import { Member } from '../../../types/member/member';
import { REACT_APP_API_URL } from '../../../config';
import { MemberStatus, MemberType } from '../../../enums/member.enum';

interface MemberListProps {
	members: Member[];
	anchorEl: any[];
	menuIconClickHandler: (e: any, index: number) => void;
	menuIconCloseHandler: () => void;
	updateMemberHandler: (data: { _id: string; memberType?: MemberType; memberStatus?: MemberStatus }) => void;
}

const TYPE_COLOR: Record<string, string> = {
	USER: 'user',
	AGENT: 'agent',
	ADMIN: 'admin',
};

const STATUS_COLOR: Record<string, string> = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	PAUSE: 'paused',
	DELETE: 'deleted',
};

const MemberList = (props: MemberListProps) => {
	const { members, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateMemberHandler } = props;

	return (
		<Stack className="admin-member-table">
			{/* Sarlavha qatori */}
			<Stack direction="row" alignItems="center" className="admin-table-head">
				<Typography className="th" sx={{ flex: '0 0 240px' }}>Member</Typography>
				<Typography className="th" sx={{ flex: '0 0 150px' }}>Phone</Typography>
				<Typography className="th" sx={{ flex: '0 0 110px' }}>Type</Typography>
				<Typography className="th" sx={{ flex: '0 0 90px' }} align="center">Salons</Typography>
				<Typography className="th" sx={{ flex: '0 0 90px' }} align="center">Warnings</Typography>
				<Typography className="th" sx={{ flex: '0 0 90px' }} align="center">Blocks</Typography>
				<Typography className="th" sx={{ flex: '0 0 130px' }} align="center">Status</Typography>
			</Stack>

			{members.length === 0 && (
				<Stack alignItems="center" className="admin-no-data">
					<Typography>No members found</Typography>
				</Stack>
			)}

			{members.map((member, index) => {
				const memberImg = !member.memberImage
					? '/img/profile/defaultUser.svg'
					: member.memberImage.startsWith('http')
						? member.memberImage
						: `${REACT_APP_API_URL}/${member.memberImage}`;

				return (
					<Stack key={member._id} direction="row" alignItems="center" className="admin-table-row">
						{/* Member */}
						<Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: '0 0 240px' }}>
							<Link href={`/member?memberId=${member._id}`}>
								<Avatar src={memberImg} sx={{ width: 46, height: 46, cursor: 'pointer' }} />
							</Link>
							<Box component="div">
								<Link href={`/member?memberId=${member._id}`}>
									<Typography className="member-nick">{member.memberNick}</Typography>
								</Link>
								<Typography className="member-fullname">{member.memberFullName ?? '-'}</Typography>
							</Box>
						</Stack>

						{/* Phone */}
						<Typography className="td" sx={{ flex: '0 0 150px' }}>{member.memberPhone}</Typography>

						{/* Type */}
						<Box sx={{ flex: '0 0 110px' }}>
							<Chip
								label={member.memberType}
								size="small"
								className={`admin-chip type-${TYPE_COLOR[member.memberType]}`}
								onClick={(e) => menuIconClickHandler(e, index)}
							/>
							<Menu
								anchorEl={anchorEl[index]}
								open={Boolean(anchorEl[index])}
								onClose={menuIconCloseHandler}
								PaperProps={{ sx: { borderRadius: 2, mt: 0.5 } }}
							>
								{Object.values(MemberType)
									.filter((v) => v !== member.memberType)
									.map((type) => (
										<MenuItem key={type} onClick={() => updateMemberHandler({ _id: member._id, memberType: type })}>
											{type}
										</MenuItem>
									))}
							</Menu>
						</Box>

						{/* Salons */}
						<Typography className="td" sx={{ flex: '0 0 90px' }} align="center">
							{member.memberSalons ?? 0}
						</Typography>

						{/* Warnings */}
						<Typography className="td" sx={{ flex: '0 0 90px' }} align="center">
							{member.memberWarnings ?? 0}
						</Typography>

						{/* Blocks */}
						<Typography className="td" sx={{ flex: '0 0 90px' }} align="center">
							{member.memberBlocks ?? 0}
						</Typography>

						{/* Status */}
						<Box sx={{ flex: '0 0 130px', textAlign: 'center' }}>
							<Chip
								label={member.memberStatus}
								size="small"
								className={`admin-chip status-${STATUS_COLOR[member.memberStatus]}`}
								onClick={(e) => menuIconClickHandler(e, index + 1000)}
							/>
							<Menu
								anchorEl={anchorEl[index + 1000]}
								open={Boolean(anchorEl[index + 1000])}
								onClose={menuIconCloseHandler}
								PaperProps={{ sx: { borderRadius: 2, mt: 0.5 } }}
							>
								{Object.values(MemberStatus)
									.filter((v) => v !== member.memberStatus)
									.map((status) => (
										<MenuItem key={status} onClick={() => updateMemberHandler({ _id: member._id, memberStatus: status })}>
											{status}
										</MenuItem>
									))}
							</Menu>
						</Box>
					</Stack>
				);
			})}
		</Stack>
	);
};

export default MemberList;