import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Stack, Box, Avatar, Typography, IconButton,
	TextField,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { REACT_APP_API_URL } from '../config';
import { useTranslation } from 'next-i18next';
import ScrollableFeed from 'react-scrollable-feed';
import moment from 'moment';
import { getJwtToken } from '../auth';
import { useChatContext } from '../context/ChatContext';

interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	text: string;
	createdAt: string;
}

// ⚠️ MUHIM: bu — avval UMUMIY (hamma ko'radigan) ochiq chat edi. Endi
// ChatContext orqali BELGILANGAN bitta odam bilan SHAXSIY (1-ga-1)
// xabarlashish. Oyna faqat "Message" tugmasi bosilganda (Salon/Specialist
// Detail sahifasida) ochiladi — hech kim tanlanmagan bo'lsa hech narsa
// ko'rsatilmaydi.
const CHAT_WS_URL = REACT_APP_API_URL.replace(/^http/, 'ws').replace(/:\d+$/, ':3008');

const imgUrl = (raw?: string): string => {
	if (!raw) return '/img/profile/defaultUser.svg';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const Chat = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { activeChat, isOpen, closeChat, setUnreadMessageCount } = useChatContext();
	// ⚠️ YANGI — WebSocket 'onmessage' funksiyasi FAQAT BIR MARTA
	// (komponent birinchi ulanganda) yaratiladi, shuning uchun ichidagi
	// `activeChat` state qiymati O'SHA paytdagi holatda (odatda `null`)
	// "muzlab qoladi" — bu ESKIRGAN CLOSURE muammosi. Shu sababli
	// yuborilgan xabarlar hech qachon ekranga chiqmasdi. `useRef` esa
	// har doim ENG SO'NGGI qiymatni saqlaydi, closure buzilmaydi.
	const activeChatRef = useRef(activeChat);
	useEffect(() => {
		activeChatRef.current = activeChat;
	}, [activeChat]);

	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<Message[]>([]);
	const wsRef = useRef<WebSocket | null>(null);

	/** WEBSOCKET ULANISH **/
	useEffect(() => {
		if (!user?._id) return;
		const token = getJwtToken();
		const ws = new WebSocket(`${CHAT_WS_URL}?token=${token}`);
		wsRef.current = ws;

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.event === 'conversationHistory' && Array.isArray(data.data)) {
					setMessages(data.data);
				}

				// ⚠️ YANGI — Chat oynasida xabar o'qilganda, Top.tsx'dagi Message
				// ikonkasi ustidagi umumiy hisobni ham DARHOL kamaytiradi
				// (avval bu ikkisi bir-biridan XABARSIZ edi)
				if (data.event === 'notification_removed' && data.data?.notificationType === 'NEW_MESSAGE') {
					setUnreadMessageCount((prev: number) => Math.max(0, prev - (data.data?.count ?? 1)));
				}

				if (data.event === 'message' && data.data) {
					const incoming: Message = data.data;
					setMessages((prev) => {
						const currentChat = activeChatRef.current; // ⚠️ TUZATILDI: activeChat oʻrniga
						const belongsToActiveChat =
							currentChat &&
							(incoming.senderId === currentChat.memberId || incoming.receiverId === currentChat.memberId);
						if (!belongsToActiveChat) return prev;
						if (prev.some((m) => m._id === incoming._id)) return prev;
						return [...prev, incoming];
					});
				}
			} catch (err) {
				console.log('Chat message parse error:', err);
			}
		};

		ws.onerror = (err) => console.log('Chat WebSocket error:', err);

		return () => ws.close();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?._id]);

	// Suhbat ochilganda (yoki almashtirilganda) — tarixni so'raymiz
	useEffect(() => {
		if (!activeChat || !isOpen) return;
		setMessages([]);
		const trySend = () => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify({ event: 'getConversation', data: { withMemberId: activeChat.memberId } }));
			} else {
				setTimeout(trySend, 300);
			}
		};
		trySend();
	}, [activeChat, isOpen]);

	/** HANDLERS **/
	const sendMessage = useCallback(() => {
		if (!message.trim() || !activeChat) return;
		if (wsRef.current?.readyState !== WebSocket.OPEN) return;

		wsRef.current.send(JSON.stringify({ event: 'message', data: { receiverId: activeChat.memberId, text: message.trim() } }));
		setMessage('');
	}, [message, activeChat]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	if (!activeChat) return null;

	return (
		<Stack className="chatting">
			<Box
				component="div"
				onClick={closeChat}
				sx={{
					position: 'fixed',
					bottom: 28,
					right: 28,
					width: 64,
					height: 64,
					borderRadius: '50%',
					background: isOpen
						? 'linear-gradient(135deg, #e53935, #ef9a9a)'
						: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
					display: isOpen ? 'none' : 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					cursor: 'pointer',
					boxShadow: '0 8px 28px rgba(255,77,141,0.5)',
					border: '3px solid #fff',
					zIndex: 300,
					transition: 'transform 0.2s ease',
					'&:hover': { transform: 'scale(1.08)' },
				}}
			>
				<ChatBubbleIcon sx={{ color: '#fff', fontSize: 30 }} />
			</Box>

			<Stack
				className={`chat-frame ${isOpen ? 'open' : ''}`}
				sx={{
					position: 'fixed',
					bottom: 24,
					right: 24,
					width: 340,
					height: 480,
					borderRadius: 4,
					overflow: 'hidden',
					boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
					zIndex: 299,
					background: '#fff',
					transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
					transformOrigin: 'bottom right',
					...(isOpen
						? { transform: 'scale(1)', opacity: 1, pointerEvents: 'all' }
						: { transform: 'scale(0.85)', opacity: 0, pointerEvents: 'none' }),
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{ px: 2, py: 1.5, background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)', flexShrink: 0 }}
				>
					<Stack direction="row" alignItems="center" gap={1.5}>
						<Avatar src={imgUrl(activeChat.image)} sx={{ width: 36, height: 36 }} />
						<Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
							{activeChat.nick}
						</Typography>
					</Stack>
					<IconButton size="small" onClick={closeChat} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.15)' } }}>
						<CloseIcon fontSize="small" />
					</IconButton>
				</Stack>

				<Box component="div" sx={{ flex: 1, overflow: 'hidden', background: '#F9F9FB', height: 'calc(100% - 130px)' }}>
					<ScrollableFeed>
						<Stack sx={{ p: 2, gap: 1.5 }}>
							{messages.length === 0 && (
								<Typography sx={{ textAlign: 'center', fontSize: 12, color: '#bbb', mt: 4 }}>
									{t('Start the conversation!')}
								</Typography>
							)}
							{messages.map((msg) => {
								const isSent = msg.senderId === user?._id;
								return (
									<Stack key={msg._id} direction={isSent ? 'row-reverse' : 'row'} alignItems="flex-end" gap={1}>
										<Avatar src={isSent ? imgUrl(user?.memberImage) : imgUrl(activeChat.image)} sx={{ width: 28, height: 28, flexShrink: 0 }} />
										<Stack alignItems={isSent ? 'flex-end' : 'flex-start'} sx={{ maxWidth: '75%' }}>
											<Box
												component="div"
												sx={{
													px: 1.5, py: 1,
													borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
													background: isSent ? 'linear-gradient(135deg, #FF4D8D, #FF85B3)' : '#fff',
													boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
													color: isSent ? '#fff' : '#333',
													fontSize: 13, lineHeight: 1.5,
												}}
											>
												{msg.text}
											</Box>
											<Typography sx={{ fontSize: 10, color: '#bbb', mt: 0.25, mx: 0.5 }}>
												{moment(msg.createdAt).format('hh:mm A')}
											</Typography>
										</Stack>
									</Stack>
								);
							})}
						</Stack>
					</ScrollableFeed>
				</Box>

				<Stack direction="row" alignItems="center" gap={1} sx={{ px: 1.5, py: 1.25, borderTop: '1px solid rgba(0,0,0,0.06)', background: '#fff', flexShrink: 0 }}>
					<TextField
						fullWidth
						size="small"
						placeholder={t('Type a message...')}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						multiline
						maxRows={3}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 3, fontSize: 13,
								'& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
								'&:hover fieldset': { borderColor: 'rgba(255,77,141,0.4)' },
								'&.Mui-focused fieldset': { borderColor: '#FF4D8D' },
							},
						}}
					/>
					<IconButton
						onClick={sendMessage}
						disabled={!message.trim()}
						sx={{
							flexShrink: 0, width: 36, height: 36,
							background: message.trim() ? 'linear-gradient(135deg, #FF4D8D, #FF85B3)' : 'rgba(0,0,0,0.06)',
							color: message.trim() ? '#fff' : '#bbb',
						}}
					>
						<SendIcon sx={{ fontSize: 18 }} />
					</IconButton>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default Chat;