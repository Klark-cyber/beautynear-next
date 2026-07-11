import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Stack, Box, Avatar, Typography, IconButton,
	TextField, Badge, Tooltip, Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { REACT_APP_API_URL } from '../config';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import ScrollableFeed from 'react-scrollable-feed';
import moment from 'moment';
import { getJwtToken } from '../auth';

interface Message {
	id: string;
	text: string;
	type: 'sent' | 'received';
	time: string;
	avatar?: string;
	nick?: string;
}

// ⚠️ TUZATILDI: Apollo'ning GraphQL subscription WebSocket'i bilan
// to'qnashmasligi uchun chat alohida, mustaqil portga (3008) ulanadi
// — backend'dagi socket.gateway.ts'dagi CHAT_PORT bilan bir xil bo'lishi shart.
const CHAT_WS_URL = REACT_APP_API_URL.replace(/^http/, 'ws').replace(/:\d+$/, ':3008');

const Chat = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [showButton, setShowButton] = useState(false);
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState<Message[]>([]);
	const [onlineCount, setOnlineCount] = useState(1);
	const inputRef = useRef<HTMLInputElement>(null);
	const wsRef = useRef<WebSocket | null>(null);

	/** LIFECYCLES **/
	useEffect(() => {
		const timer = setTimeout(() => setShowButton(true), 800);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		setShowButton(false);
		const timer = setTimeout(() => setShowButton(true), 800);
		return () => clearTimeout(timer);
	}, [router.pathname]);

	// ⚠️ TUZATILDI: avval Chat.tsx hech qanday haqiqiy WebSocket ulanishiga
	// ega emas edi — barcha xabarlar faqat lokal (soxta) edi. Endi
	// backend'dagi Nestar-uslubidagi jonli chat gateway'iga ulanadi.
	useEffect(() => {
		const token = getJwtToken();
		const ws = new WebSocket(`${CHAT_WS_URL}?token=${token}`);
		wsRef.current = ws;

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.event === 'info') {
					setOnlineCount(data.totalClients ?? 1);
				}

				if (data.event === 'getMessages' && Array.isArray(data.list)) {
					const history: Message[] = data.list.map((m: any, idx: number) => ({
						id: `history-${idx}-${Date.now()}`,
						text: m.text,
						type: m.memberData?._id === user?._id ? 'sent' : 'received',
						time: '',
						nick: m.memberData?.memberNick ?? 'Guest',
					}));
					setMessages((prev) => [...prev, ...history]);
				}

				if (data.event === 'message') {
					const incoming: Message = {
						id: Date.now().toString() + Math.random(),
						text: data.text,
						type: data.memberData?._id === user?._id ? 'sent' : 'received',
						time: moment().format('hh:mm A'),
						nick: data.memberData?.memberNick ?? 'Guest',
					};
					setMessages((prev) => [...prev, incoming]);
				}
			} catch (err) {
				console.log('Chat message parse error:', err);
			}
		};

		ws.onerror = (err) => console.log('Chat WebSocket error:', err);

		return () => ws.close();
	}, [user?._id]);

	/** HANDLERS **/
	const sendMessage = useCallback(() => {
		if (!message.trim()) return;
		if (wsRef.current?.readyState !== WebSocket.OPEN) return;

		// ⚠️ Lokal ravishda darhol qo'shmaymiz — server o'z xabarimizni ham
		// hamma bilan bir qatorda bizga qaytarib yuboradi (emitMessage
		// barcha clientlarga, jumladan yuboruvchining o'ziga ham yuboradi)
		wsRef.current.send(JSON.stringify({ event: 'message', data: message.trim() }));
		setMessage('');
	}, [message]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};


	return (
		<Stack className="chatting">
			{/* Toggle button */}
			{showButton && (
				<Box
					component="div"
					onClick={() => setOpen((prev) => !prev)}
					sx={{
						position: 'fixed',
						bottom: 24,
						right: 24,
						width: 56,
						height: 56,
						borderRadius: '50%',
						background: open
							? 'linear-gradient(135deg, #e53935, #ef9a9a)'
							: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						boxShadow: '0 6px 24px rgba(255,77,141,0.4)',
						zIndex: 300,
						transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
						animation: 'chatPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
						'&:hover': {
							transform: 'scale(1.1)',
							boxShadow: '0 8px 28px rgba(255,77,141,0.5)',
						},
						'&:active': { transform: 'scale(0.95)' },
						'@keyframes chatPop': {
							'0%': { transform: 'scale(0)', opacity: 0 },
							'100%': { transform: 'scale(1)', opacity: 1 },
						},
					}}
				>
					<Badge
						badgeContent={open ? 0 : messages.filter((m) => m.type === 'received').length}
						color="error"
						sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16, top: -2, right: -2 } }}
					>
						{open ? (
							<CloseIcon sx={{ color: '#fff', fontSize: 22, transition: 'all 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(90deg)' }} />
						) : (
							<ChatBubbleOutlineIcon sx={{ color: '#fff', fontSize: 22 }} />
						)}
					</Badge>
				</Box>
			)}

			{/* Chat window */}
			<Stack
				className={`chat-frame ${open ? 'open' : ''}`}
				sx={{
					position: 'fixed',
					bottom: 92,
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
					...(open
						? { transform: 'scale(1)', opacity: 1, pointerEvents: 'all' }
						: { transform: 'scale(0.85)', opacity: 0, pointerEvents: 'none' }),
				}}
			>
				{/* Header */}
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{
						px: 2,
						py: 1.5,
						background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
						flexShrink: 0,
					}}
				>
					<Stack direction="row" alignItems="center" gap={1.5}>
						<Box
							component="div"
							sx={{
								width: 36,
								height: 36,
								borderRadius: '50%',
								background: 'rgba(255,255,255,0.2)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 18,
							}}
						>
							💄
						</Box>
						<Box component="div">
							<Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>
								BeautyNear Chat
							</Typography>
							<Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.25 }}>
								<Box
									component="div"
									sx={{
										width: 6,
										height: 6,
										borderRadius: '50%',
										background: '#4cff9a',
										animation: 'pulse 2s infinite',
										'@keyframes pulse': {
											'0%,100%': { opacity: 1 },
											'50%': { opacity: 0.4 },
										},
									}}
								/>
								<Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
									{onlineCount} {t('online')}
								</Typography>
							</Stack>
						</Box>
					</Stack>
					<IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.15)' } }}>
						<CloseIcon fontSize="small" />
					</IconButton>
				</Stack>

				{/* Messages */}
				<Box
					component="div"
					sx={{
						flex: 1,
						overflow: 'hidden',
						background: '#F9F9FB',
						height: 'calc(100% - 130px)',
					}}
				>
					<ScrollableFeed>
						<Stack sx={{ p: 2, gap: 1.5 }}>
							{messages.map((msg) => (
								<Stack
									key={msg.id}
									direction={msg.type === 'sent' ? 'row-reverse' : 'row'}
									alignItems="flex-end"
									gap={1}
								>
									{msg.type === 'received' && (
										<Avatar
											sx={{
												width: 28,
												height: 28,
												background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
												fontSize: 14,
												flexShrink: 0,
											}}
										>
											💄
										</Avatar>
									)}
									{msg.type === 'sent' && (
										<Avatar
											src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
											sx={{ width: 28, height: 28, flexShrink: 0 }}
										/>
									)}
									<Stack alignItems={msg.type === 'sent' ? 'flex-end' : 'flex-start'} sx={{ maxWidth: '75%' }}>
										{msg.type === 'received' && msg.nick && (
											<Typography sx={{ fontSize: 10, color: '#999', mb: 0.25, ml: 0.5 }}>
												{msg.nick}
											</Typography>
										)}
										<Box
											component="div"
											sx={{
												px: 1.5,
												py: 1,
												borderRadius: msg.type === 'sent' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
												background: msg.type === 'sent'
													? 'linear-gradient(135deg, #FF4D8D, #FF85B3)'
													: '#fff',
												boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
												color: msg.type === 'sent' ? '#fff' : '#333',
												fontSize: 13,
												lineHeight: 1.5,
												animation: 'msgPop 0.2s ease',
												'@keyframes msgPop': {
													'0%': { transform: 'scale(0.8)', opacity: 0 },
													'100%': { transform: 'scale(1)', opacity: 1 },
												},
											}}
										>
											{msg.text}
										</Box>
										{msg.time && (
											<Typography sx={{ fontSize: 10, color: '#bbb', mt: 0.25, mx: 0.5 }}>
												{msg.time}
											</Typography>
										)}
									</Stack>
								</Stack>
							))}
						</Stack>
					</ScrollableFeed>
				</Box>

				{/* Input */}
				<Stack
					direction="row"
					alignItems="center"
					gap={1}
					sx={{
						px: 1.5,
						py: 1.25,
						borderTop: '1px solid rgba(0,0,0,0.06)',
						background: '#fff',
						flexShrink: 0,
					}}
				>
					<Tooltip title={t('Emoji')} placement="top">
						<IconButton size="small" sx={{ color: '#bbb', '&:hover': { color: '#FF4D8D' }, flexShrink: 0 }}>
							<EmojiEmotionsOutlinedIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<TextField
						inputRef={inputRef}
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
								borderRadius: 3,
								fontSize: 13,
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
							flexShrink: 0,
							width: 36,
							height: 36,
							background: message.trim()
								? 'linear-gradient(135deg, #FF4D8D, #FF85B3)'
								: 'rgba(0,0,0,0.06)',
							color: message.trim() ? '#fff' : '#bbb',
							transition: 'all 0.25s',
							'&:hover': {
								background: message.trim() ? 'linear-gradient(135deg, #e53578, #FF4D8D)' : undefined,
								transform: message.trim() ? 'scale(1.1)' : undefined,
							},
							'&:active': { transform: 'scale(0.95)' },
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