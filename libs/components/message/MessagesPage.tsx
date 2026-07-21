import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Stack, Typography, IconButton, Badge } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import moment from 'moment';
import { REACT_APP_API_URL } from '../../config';
import { useChatContext, Conversation } from '../../context/ChatContext';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { sweetConfirmAlert } from '../../sweetAlert';

const imgUrl = (raw?: string): string => {
    if (!raw) return '/img/profile/defaultUser.svg';
    return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

// ⚠️ MUHIM: xabarlar endi MongoDB'da DOIMIY saqlanadi (Telegram kabi) —
// server qayta ishga tushsa ham, foydalanuvchi qayta kirsa ham
// suhbatlar YO'QOLMAYDI. Faqat ANIQ "o'chirish" tugmasi bosilsagina
// o'chadi (xabar o'qilgani uchun emas).
//
// ⚠️ TUZATILDI: bu sahifa avval O'ZINING alohida WebSocket ulanishini
// ochardi (ChatContext'nikidan MUSTAQIL) — /messages'ga har kirib-
// chiqishda yana bir ulanish ochilib-yopilib turardi, bu esa backend'dagi
// "kim onlayn" xaritasida beqarorlik keltirib chiqarardi. Endi suhbatlar
// ro'yxati va o'chirish amali ChatContext'dagi YAGONA, doimiy ulanish
// orqali ishlaydi.
const MessagesPage = () => {
    const { t } = useTranslation('common');
    const router = useRouter();
    const device = useDeviceDetect();
    const { openChatWith, conversations, deleteConversation: deleteConversationCtx, markConversationRead } = useChatContext();

    const openConversation = (conv: Conversation) => {
        openChatWith({ memberId: conv.memberId, nick: conv.nick, image: conv.image });
        markConversationRead(conv.memberId);
    };

    // ⚠️ suhbatni butunlay o'chirish (foydalanuvchi ANIQ so'rasa)
    const deleteConversation = async (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation();
        if (await sweetConfirmAlert(t('Delete this conversation? This cannot be undone.'))) {
            deleteConversationCtx(conv.memberId);
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