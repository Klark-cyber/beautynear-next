import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, Badge } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useReactiveVar } from '@apollo/client';
import moment from 'moment';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { getJwtToken } from '../../auth';
import { useChatContext } from '../../context/ChatContext';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { sweetConfirmAlert } from '../../sweetAlert';

const CHAT_WS_URL = REACT_APP_API_URL.replace(/^http/, 'ws').replace(/:\d+$/, ':3008');

const imgUrl = (raw?: string): string => {
    if (!raw) return '/img/profile/defaultUser.svg';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

interface Conversation {
    memberId: string;
    nick: string;
    image: string;
    memberType: string;
    lastText: string;
    lastAt: string;
    unreadCount: number;
}

// ⚠️ MUHIM: xabarlar endi MongoDB'da DOIMIY saqlanadi (Telegram kabi) —
// server qayta ishga tushsa ham, foydalanuvchi qayta kirsa ham
// suhbatlar YO'QOLMAYDI. Faqat ANIQ "o'chirish" tugmasi bosilsagina
// o'chadi (xabar o'qilgani uchun emas).

const MessagesPage = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const user = useReactiveVar(userVar);
    const { openChatWith } = useChatContext();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!user?._id) return;
        const token = getJwtToken();
        const ws = new WebSocket(`${CHAT_WS_URL}?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ event: 'getMyConversations', data: {} }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'myConversations') {
                    setConversations(data.data ?? []);
                }
                // ⚠️ YANGI — suhbat o'chirilgandan keyin ro'yxatdan darhol olib tashlanadi
                if (data.event === 'conversationDeleted') {
                    setConversations((prev) => prev.filter((c) => c.memberId !== data.data?.withMemberId));
                }
            } catch (err) {
                console.log('Messages page ws error:', err);
            }
        };

        return () => ws.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id]);

    const openConversation = (conv: Conversation) => {
        openChatWith({ memberId: conv.memberId, nick: conv.nick, image: conv.image });
        setConversations((prev) => prev.map((c) => (c.memberId === conv.memberId ? { ...c, unreadCount: 0 } : c)));
    };

    // ⚠️ YANGI — suhbatni butunlay o'chirish (foydalanuvchi ANIQ so'rasa)
    const deleteConversation = async (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation();
        if (await sweetConfirmAlert(t('Delete this conversation? This cannot be undone.'))) {
            wsRef.current?.send(JSON.stringify({ event: 'deleteConversation', data: { withMemberId: conv.memberId } }));
        }
    };

    return (
        <Box component="div" id={device === 'mobile' ? 'mobile-messages' : 'desktop-messages'}>
            <Stack direction="row" alignItems="center" gap={1.5} className="msg-header">
                <IconButton className="msg-icon-btn" onClick={() => router.push('/')}>
                    <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
                </IconButton>
                <Typography className="msg-header-title">{t('Messages')}</Typography>
            </Stack>

            <Stack className="msg-list">
                {conversations.length === 0 && (
                    <Stack alignItems="center" className="msg-empty">
                        <Typography className="msg-empty-emoji">💬</Typography>
                        <Typography className="msg-empty-title">{t('No conversations yet')}</Typography>
                    </Stack>
                )}

                {conversations.map((conv) => (
                    <Stack
                        key={conv.memberId}
                        direction="row"
                        alignItems="center"
                        gap={1.5}
                        className="msg-conv-row"
                        onClick={() => openConversation(conv)}
                    >
                        <Badge
                            overlap="circular"
                            badgeContent={conv.unreadCount > 0 ? conv.unreadCount : undefined}
                            color="error"
                        >
                            <Box component="div" className="msg-conv-avatar" style={{ backgroundImage: `url(${imgUrl(conv.image)})` }} />
                        </Badge>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography className={`msg-conv-name ${conv.unreadCount > 0 ? 'unread' : ''}`}>{conv.nick}</Typography>
                                <Typography className="msg-conv-time">{moment(conv.lastAt).fromNow()}</Typography>
                            </Stack>
                            <Typography className={`msg-conv-preview ${conv.unreadCount > 0 ? 'unread' : ''}`}>{conv.lastText}</Typography>
                        </Box>
                        <IconButton className="msg-delete-btn" onClick={(e) => deleteConversation(e, conv)}>
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Stack>
                ))}
            </Stack>
        </Box>
    );
};

export default MessagesPage;