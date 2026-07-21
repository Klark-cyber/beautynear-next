import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useReactiveVar, useQuery, useMutation } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { getJwtToken } from '../auth';
import { REACT_APP_API_URL } from '../config';
import { GET_UNREAD_NOTIFICATION_COUNT } from '../../apollo/user/query';
import { MARK_ALL_NOTIFICATIONS_AS_READ } from '../../apollo/user/mutation';

export interface ChatTarget {
    memberId: string;
    nick: string;
    image?: string;
}

interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    text: string;
    createdAt: string;
}

export interface Conversation {
    memberId: string;
    nick: string;
    image: string;
    memberType: string;
    lastText: string;
    lastAt: string;
    unreadCount: number;
}

interface ChatContextType {
    activeChat: ChatTarget | null;
    isOpen: boolean;
    openChatWith: (target: ChatTarget) => void;
    closeChat: () => void;
    unreadMessageCount: number;
    unreadCount: number;
    liveNotification: any;
    messages: Message[];
    sendMessage: (text: string) => void;
    markAllAsReadHandler: () => Promise<void>;
    conversations: Conversation[];
    deleteConversation: (memberId: string) => void;
    markConversationRead: (memberId: string) => void;
}

const ChatContext = createContext<ChatContextType>({
    activeChat: null,
    isOpen: false,
    openChatWith: () => { },
    closeChat: () => { },
    unreadMessageCount: 0,
    unreadCount: 0,
    liveNotification: null,
    messages: [],
    sendMessage: () => { },
    markAllAsReadHandler: async () => { },
    conversations: [],
    deleteConversation: () => { },
    markConversationRead: () => { },
});

// ⚠️ TUZATILDI — MUHIM ARXITEKTURA O'ZGARISHI:
//
// Avval bu WebSocket ulanishi (chat + bildirishnoma uchun) Chat.tsx va
// useNotificationSocket.ts ICHIDA, ikkita ALOHIDA joyda ochilardi — va
// ikkalasi ham har bir SAHIFA komponentining Layout'i (LayoutBasic/
// LayoutFull/LayoutHome) ICHIDA joylashgan edi. Bu Layout'lar esa HAR BIR
// sahifaga o'tishda (masalan bildirishnoma bosilib /messages'ga o'tilganda)
// QAYTA MOUNT bo'ladi — demak ulanish HAR SAFAR uziladi va qaytadan
// ochiladi.
//
// Bu — bir nechta jiddiy bug'larning ILDIZI edi:
//  - Backend'dagi "kim onlayn" xaritasida (connectedClients) qisqa
//    bo'shliqlar hosil bo'lardi, va aynan shu bo'shliqqa to'g'ri kelgan
//    xabar/bildirishnoma boshqa foydalanuvchiga UMUMAN yetib bormasdi —
//    faqat sahifa yangilansa (yangi ulanish ro'yxatdan o'tsa) ko'rinardi.
//  - Bitta foydalanuvchi uchun bir vaqtning o'zida IKKITA (Chat.tsx +
//    useNotificationSocket) mustaqil ulanish ochilardi — bu ham keraksiz
//    ortiqchalik, ham qo'shimcha beqarorlik manbai edi.
//
// Endi bu YAGONA ulanish shu yerda — <ChatProvider> ichida — saqlanadi va
// _app.tsx darajasida BIR MARTA ochiladi (pages/_app.tsx'da <Component/>ni
// o'rab turadi, u sahifadan sahifaga o'tishda QAYTA MOUNT BO'LMAYDI).
// Butun sessiya davomida TIRIK qoladi, xabar ham, bildirishnoma ham shu
// bitta ulanish orqali ishlaydi.
const CHAT_WS_URL = REACT_APP_API_URL.replace(/^http/, 'ws').replace(/:\d+$/, ':3008');

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const user = useReactiveVar(userVar);
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const [activeChat, setActiveChat] = useState<ChatTarget | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const activeChatRef = useRef(activeChat);
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [liveNotification, setLiveNotification] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const unmountedRef = useRef(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { refetch: refetchUnread } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
        fetchPolicy: 'network-only',
        skip: !user?._id,
        onCompleted: (data: any) => setUnreadCount(data?.getUnreadNotificationCount ?? 0),
    });

    const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ);

    /** WEBSOCKET ULANISH — butun sessiya uchun YAGONA, doimiy **/
    useEffect(() => {
        if (!user?._id) return;
        unmountedRef.current = false;

        const connect = () => {
            if (unmountedRef.current) return;
            const token = getJwtToken();
            const ws = new WebSocket(`${CHAT_WS_URL}?token=${token}`);
            wsRef.current = ws;

            ws.onopen = () => {
                ws.send(JSON.stringify({ event: 'getMyConversations', data: {} }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.event === 'conversationHistory' && Array.isArray(data.data)) {
                        setMessages(data.data);
                    }

                    if (data.event === 'myConversations' && Array.isArray(data.data)) {
                        const total = data.data.reduce((sum: number, c: any) => sum + (c.unreadCount ?? 0), 0);
                        setUnreadMessageCount(total);
                        setConversations(data.data);
                    }

                    // ⚠️ YANGI — avval bu /messages sahifasining O'ZINING alohida
                    // ulanishida ishlanardi. Endi shu YAGONA, doimiy ulanishda —
                    // suhbat qaysi sahifada o'chirilgan bo'lishidan qat'i nazar
                    // ro'yxat darhol yangilanadi.
                    if (data.event === 'conversationDeleted') {
                        setConversations((prev) => prev.filter((c) => c.memberId !== data.data?.withMemberId));
                    }

                    if (data.event === 'notification') {
                        setUnreadCount((prev) => prev + 1);
                        setLiveNotification(data.data);
                        if (data.data?.notificationType === 'NEW_MESSAGE') {
                            setUnreadMessageCount((prev) => prev + 1);
                        }
                        if (data.data?.notificationType === 'AGENT_APPROVED' && userRef.current) {
                            userVar({ ...userRef.current, memberType: 'AGENT', agentRequestStatus: 'APPROVED' });
                        }
                    }

                    if (data.event === 'notification_removed') {
                        setUnreadCount((prev) => Math.max(0, prev - (data.data?.count ?? 1)));
                        if (data.data?.notificationType === 'NEW_MESSAGE') {
                            setUnreadMessageCount((prev) => Math.max(0, prev - (data.data?.count ?? 1)));
                        }
                    }

                    if (data.event === 'message' && data.data) {
                        const incoming: Message = data.data;
                        setMessages((prev) => {
                            const currentChat = activeChatRef.current;
                            const belongsToActiveChat =
                                currentChat &&
                                (incoming.senderId === currentChat.memberId || incoming.receiverId === currentChat.memberId);
                            if (!belongsToActiveChat) return prev;
                            if (prev.some((m) => m._id === incoming._id)) return prev;
                            return [...prev, incoming];
                        });
                        // Suhbatlar ro'yxatidagi oxirgi xabar/vaqt ham yangilansin
                        wsRef.current?.send(JSON.stringify({ event: 'getMyConversations', data: {} }));
                    }
                } catch (err) {
                    console.log('Chat message parse error:', err);
                }
            };

            ws.onerror = (err) => console.log('Chat WebSocket error:', err);

            ws.onclose = () => {
                if (unmountedRef.current) return;
                reconnectTimerRef.current = setTimeout(connect, 1500);
            };
        };

        connect();

        return () => {
            unmountedRef.current = true;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id]);

    const openChatWith = useCallback((target: ChatTarget) => {
        setActiveChat(target);
        setIsOpen(true);
    }, []);

    const closeChat = useCallback(() => {
        setIsOpen(false);
    }, []);

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

    const sendMessage = useCallback((text: string) => {
        const trimmed = text.trim();
        const currentChat = activeChatRef.current;
        if (!trimmed || !currentChat) return;
        const receiverId = currentChat.memberId;

        let attempts = 0;
        const trySend = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ event: 'message', data: { receiverId, text: trimmed } }));
            } else if (attempts < 20) {
                attempts += 1;
                setTimeout(trySend, 300);
            } else {
                console.log('Chat: message could not be sent — WebSocket never reached OPEN state');
            }
        };
        trySend();
    }, []);

    const markAllAsReadHandler = useCallback(async () => {
        try {
            await markAllRead();
            setUnreadCount(0);
        } catch (err) {
            console.log('ERROR, markAllAsReadHandler:', err);
        }
    }, [markAllRead]);

    // ⚠️ YANGI — avval /messages sahifasining o'ZINING alohida ulanishi
    // orqali yuborilardi. Endi shu YAGONA ulanish orqali ishlaydi.
    const deleteConversation = useCallback((memberId: string) => {
        wsRef.current?.send(JSON.stringify({ event: 'deleteConversation', data: { withMemberId: memberId } }));
    }, []);

    // /messages ro'yxatida suhbat bosilganda, o'sha suhbatning "o'qilmagan"
    // belgisini ro'yxat darajasida ham darhol tozalab qo'yamiz (server
    // tomonidan getConversation chaqirilganda haqiqiy hisob ham keladi)
    const markConversationRead = useCallback((memberId: string) => {
        setConversations((prev) => prev.map((c) => (c.memberId === memberId ? { ...c, unreadCount: 0 } : c)));
    }, []);

    return (
        <ChatContext.Provider
            value={{
                activeChat,
                isOpen,
                openChatWith,
                closeChat,
                unreadMessageCount,
                unreadCount,
                liveNotification,
                messages,
                sendMessage,
                markAllAsReadHandler,
                conversations,
                deleteConversation,
                markConversationRead,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => useContext(ChatContext);