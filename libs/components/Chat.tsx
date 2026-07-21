import React, { useState } from 'react';
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
import { useChatContext } from '../context/ChatContext';
import useDeviceDetect from '../hooks/useDeviceDetect';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

// ⚠️ MUHIM: WebSocket ulanishi, xabarlar ro'yxati va yuborish mantig'i
// endi bu yerda EMAS — ChatContext.tsx'da (butun sessiya uchun YAGONA,
// doimiy ulanish sifatida). Bu komponent endi FAQAT UI: kontekstdan
// o'qiydi va foydalanuvchi harakatlarini kontekstga uzatadi. Shu tufayli
// bu komponent har safar sahifa almashtirilganda qayta mount bo'lsa ham
// (LayoutBasic/LayoutFull/LayoutHome ichida joylashgani uchun), bu endi
// muammo emas — chunki underlying WebSocket ulanishi ChatContext orqali
// _app.tsx darajasida barqaror qoladi.
const imgUrl = (raw?: string): string => {
	if (!raw) return '/img/profile/defaultUser.svg';
	return raw.startsWith('http') ? raw : `${REACT_APP_API_URL}/${raw}`;
};

const Chat = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { activeChat, isOpen, closeChat, messages, sendMessage } = useChatContext();
	const device = useDeviceDetect();
	const isMobile = device === 'mobile';

	const [message, setMessage] = useState('');

	/** HANDLERS **/
	const handleSend = () => {
		if (!message.trim()) return;
		sendMessage(message);
		setMessage('');
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	if (!activeChat) return null;

	// ⚠️ TUZATILDI: avval mobil va desktop uchun BITTA xil o'lcham (340×480px,
	// pastki-o'ngga yopishgan) ishlatilardi. Mobilda bu ekran chetiga "tiqilib
	// qolgan", pastdagi bottom-nav (Home/Explore/Favorites/My Page) bilan
	// ustma-ust tushib matnlarni buzib ko'rsatadigan holatga olib kelardi.
	// Endi mobilda chat butun ekranni qoplaydigan (fixed inset:0, zIndex juda
	// baland) to'liq ekran rejimida ochiladi — orqasida hech narsa bosilmaydi,
	// va "<" orqaga strelkasi bosilganda closeChat() chaqiriladi.
	if (isMobile) {
		return (
			<Stack className="chatting chatting--mobile">
				{/* Yopiq holatdagi kichik "bubble" tugma — pastki navbar (64px) ustiga chiqib ketmasligi uchun ko'tarilgan */}
				<Box
					component="div"
					onClick={closeChat}
					sx={{
						position: 'fixed',
						bottom: 88,
						right: 20,
						width: 56,
						height: 56,
						borderRadius: '50%',
						background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
						display: isOpen ? 'none' : 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						boxShadow: '0 8px 28px rgba(255,77,141,0.5)',
						border: '3px solid #fff',
						zIndex: 1900,
					}}
				>
					<ChatBubbleIcon sx={{ color: '#fff', fontSize: 26 }} />
				</Box>

				{isOpen && (
					<Stack
						className="chat-frame chat-frame--mobile open"
						sx={{
							position: 'fixed',
							inset: 0,
							width: '100%',
							height: '100dvh',
							zIndex: 2000,
							background: '#fff',
						}}
					>
						<Stack
							direction="row"
							alignItems="center"
							gap={1.25}
							sx={{
								px: 1.5, py: 1.5,
								pt: 'calc(env(safe-area-inset-top, 0px) + 12px)',
								background: 'linear-gradient(135deg, #FF4D8D, #FF85B3)',
								flexShrink: 0,
							}}
						>
							<IconButton size="small" onClick={closeChat} sx={{ color: '#fff' }}>
								<ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
							</IconButton>
							<Avatar src={imgUrl(activeChat.image)} sx={{ width: 34, height: 34 }} />
							<Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
								{activeChat.nick}
							</Typography>
						</Stack>

						<Box component="div" sx={{ flex: 1, minHeight: 0, position: 'relative', background: '#F9F9FB' }}>
							<Box component="div" sx={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
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
						</Box>

						<Stack
							direction="row"
							alignItems="center"
							gap={1}
							sx={{
								px: 1.5, py: 1.25,
								pb: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
								borderTop: '1px solid rgba(0,0,0,0.06)',
								background: '#fff',
								flexShrink: 0,
							}}
						>
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
								onClick={handleSend}
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
				)}
			</Stack>
		);
	}

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
						onClick={handleSend}
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