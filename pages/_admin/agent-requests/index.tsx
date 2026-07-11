import React, { useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { Box, Stack, Typography, Button, Pagination as MuiPagination } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import moment from 'moment';
import { useMutation, useQuery } from '@apollo/client';
import { GET_AGENT_REQUESTS } from '../../../apollo/admin/query';
import { PROCESS_AGENT_REQUEST } from '../../../apollo/admin/mutation';
import { Member } from '../../../libs/types/member/member';
import { T } from '../../../libs/types/common';
import { REACT_APP_API_URL } from '../../../libs/config';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

const imgUrl = (raw?: string, fallback = '/img/profile/defaultUser.svg'): string => {
    if (!raw) return fallback;
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const limit = 10;

const AdminAgentRequests: NextPage = ({
    initialInquiry = { page: 1, limit, sort: 'createdAt', direction: 'DESC', search: {} },
    ...props
}: any) => {
    const [inquiry, setInquiry] = useState<any>(initialInquiry);
    const [requests, setRequests] = useState<Member[]>([]);
    const [total, setTotal] = useState<number>(0);

    /** APOLLO REQUESTS **/
    const [processAgentRequest] = useMutation(PROCESS_AGENT_REQUEST);

    const { refetch } = useQuery(GET_AGENT_REQUESTS, {
        fetchPolicy: 'network-only',
        variables: { input: inquiry },
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: T) => {
            setRequests(data?.getAgentRequests?.list ?? []);
            setTotal(data?.getAgentRequests?.metaCounter?.[0]?.total ?? 0);
        },
    });

    /** HANDLERS **/
    const paginationHandler = (_e: any, value: number) => setInquiry({ ...inquiry, page: value });

    const processHandler = async (memberId: string, approve: boolean) => {
        try {
            const confirmMsg = approve ? 'Approve this agent application?' : 'Reject this agent application?';
            if (await sweetConfirmAlert(confirmMsg)) {
                await processAgentRequest({ variables: { memberId, approve } });
                await refetch({ input: inquiry });
            }
        } catch (err: any) {
            await sweetErrorHandling(err);
        }
    };

    return (
        <Box component="div" className="admin-content">
            <Typography className="admin-page-title">Agent Requests</Typography>
            <Typography className="admin-page-subtitle">Review and approve pending agent applications.</Typography>

            <Box component="div" className="admin-table-frame">
                <Stack className="admin-member-table">
                    <Stack direction="row" alignItems="center" className="admin-table-head">
                        <Typography className="th" sx={{ flex: '0 0 60px' }}>#</Typography>
                        <Typography className="th" sx={{ flex: 1 }}>Applicant</Typography>
                        <Typography className="th" sx={{ flex: '0 0 140px' }}>Phone</Typography>
                        <Typography className="th" sx={{ flex: '0 0 120px' }}>Applied</Typography>
                        <Typography className="th" sx={{ flex: '0 0 200px' }} align="center">Action</Typography>
                    </Stack>

                    {requests.length === 0 && (
                        <Stack alignItems="center" className="admin-no-data">
                            <Typography>No pending agent requests 🎉</Typography>
                        </Stack>
                    )}

                    {requests.map((m, i) => (
                        <Stack key={m._id} direction="row" alignItems="center" className="admin-table-row">
                            <Typography className="td" sx={{ flex: '0 0 60px' }}>{(inquiry.page - 1) * inquiry.limit + i + 1}</Typography>
                            <Stack direction="row" alignItems="center" gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                <Box
                                    component="div"
                                    sx={{
                                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                                        backgroundImage: `url(${imgUrl(m.memberImage)})`,
                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                    }}
                                />
                                <Box component="div" sx={{ minWidth: 0 }}>
                                    <Typography className="member-nick" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {m.memberNick}
                                    </Typography>
                                    <Typography className="member-fullname">{m.memberFullName}</Typography>
                                </Box>
                            </Stack>
                            <Typography className="td" sx={{ flex: '0 0 140px' }}>{m.memberPhone}</Typography>
                            <Typography className="td" sx={{ flex: '0 0 120px' }}>{moment(m.createdAt).format('MMM DD, YYYY')}</Typography>
                            <Stack direction="row" gap={1} sx={{ flex: '0 0 200px' }} justifyContent="center">
                                <Button
                                    size="small"
                                    startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => processHandler(m._id as any, true)}
                                    sx={{ background: '#3EA043', color: '#fff', fontSize: 11.5, textTransform: 'none', '&:hover': { background: '#358f3b' } }}
                                >
                                    Approve
                                </Button>
                                <Button
                                    size="small"
                                    startIcon={<CancelOutlinedIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => processHandler(m._id as any, false)}
                                    sx={{ background: '#eee', color: '#666', fontSize: 11.5, textTransform: 'none', '&:hover': { background: '#e0e0e0' } }}
                                >
                                    Reject
                                </Button>
                            </Stack>
                        </Stack>
                    ))}
                </Stack>

                {requests.length !== 0 && (
                    <Stack alignItems="center" sx={{ mt: 3 }}>
                        <MuiPagination
                            page={inquiry.page}
                            count={Math.ceil(total / inquiry.limit) || 1}
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

AdminAgentRequests.defaultProps = {
    initialInquiry: { page: 1, limit, sort: 'createdAt', direction: 'DESC', search: {} },
};

export default withAdminLayout(AdminAgentRequests);