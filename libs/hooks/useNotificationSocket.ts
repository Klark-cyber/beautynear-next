import { useEffect, useRef, useState, useCallback } from 'react';
import { useReactiveVar, useQuery, useMutation } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { getJwtToken } from '../auth';
import { REACT_APP_API_URL } from '../config';
import { GET_UNREAD_NOTIFICATION_COUNT } from '../../apollo/user/query';
import { MARK_ALL_NOTIFICATIONS_AS_READ } from '../../apollo/user/mutation';
import { useChatContext } from '../context/ChatContext';

// ⚠️ Chat.tsx bilan BIR XIL WebSocket portiga ulanadi (backend'dagi
// socket.gateway.ts ikkalasini ham shu yerda boshqaradi)
const NOTIFICATION_WS_URL = REACT_APP_API_URL.replace(/^http/, 'ws').replace(/:\d+$/, ':3008');

/**
 * Homepage/Top'dagi qo'ng'iroqcha, Message ikonkasi va Notification
 * ro'yxati sahifasi o'rtasida umumiy foydalaniladigan hook.
 */
export const useNotificationSocket = () => {
    const user = useReactiveVar(userVar);
    // ⚠️ YANGI — ws.onmessage faqat BIR MARTA (ulanish ochilganda)
    // yaratiladi, shuning uchun ichidagi `user` o'zgaruvchisi ESKI
    // qiymatda "muzlab qolishi" mumkin edi (xuddi Chat.tsx'dagi kabi
    // eskirgan closure muammosi). `userRef` esa har doim ENG SO'NGGI
    // qiymatni saqlaydi.
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const [unreadCount, setUnreadCount] = useState(0);
    const { unreadMessageCount, setUnreadMessageCount } = useChatContext();
    const [liveNotification, setLiveNotification] = useState<any>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const { refetch: refetchUnread } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
        fetchPolicy: 'network-only',
        skip: !user?._id,
        onCompleted: (data: any) => setUnreadCount(data?.getUnreadNotificationCount ?? 0),
    });

    const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ);

    useEffect(() => {
        if (!user?._id) return;
        const token = getJwtToken();
        const ws = new WebSocket(`${NOTIFICATION_WS_URL}?token=${token}`);
        wsRef.current = ws;

        // Boshlang'ich xabar-maxsus hisobni ham olamiz (suhbatlar royxatidan)
        ws.onopen = () => {
            ws.send(JSON.stringify({ event: 'getMyConversations', data: {} }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'notification') {
                    setUnreadCount((prev) => prev + 1);
                    setLiveNotification(data.data);
                    if (data.data?.notificationType === 'NEW_MESSAGE') {
                        setUnreadMessageCount((prev) => prev + 1);
                    }
                    // ⚠️ YANGI — avval admin tasdiqlagach, foydalanuvchining
                    // o'z sahifasidagi holati (masalan "Become an Agent"
                    // tugmasi) FAQAT sahifa yangilansa/qayta kirilsa
                    // yo'qolardi. Endi bildirishnoma real-time kelishi
                    // bilanoq userVar DARHOL yangilanadi — userRef orqali
                    // (eskirgan closure muammosisiz).
                    if (data.data?.notificationType === 'AGENT_APPROVED' && userRef.current) {
                        userVar({ ...userRef.current, memberType: 'AGENT', agentRequestStatus: 'APPROVED' });
                    }
                } else if (data.event === 'notification_removed') {
                    // ⚠️ avval bu signal umuman yuborilmasdi
                    setUnreadCount((prev) => Math.max(0, prev - (data.data?.count ?? 1)));
                    if (data.data?.notificationType === 'NEW_MESSAGE') {
                        setUnreadMessageCount((prev) => Math.max(0, prev - (data.data?.count ?? 1)));
                    }
                } else if (data.event === 'myConversations' && Array.isArray(data.data)) {
                    // Boshlang'ich xabar-maxsus hisob — barcha suhbatlardagi o'qilmaganlar yig'indisi
                    const total = data.data.reduce((sum: number, c: any) => sum + (c.unreadCount ?? 0), 0);
                    setUnreadMessageCount(total);
                }
            } catch (err) {
                console.log('ERROR, notification ws onmessage:', err);
            }
        };
        ws.onerror = (err) => console.log('Notification WebSocket error:', err);

        return () => ws.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id]);

    const markAllAsReadHandler = useCallback(async () => {
        try {
            await markAllRead();
            setUnreadCount(0);
        } catch (err) {
            console.log('ERROR, markAllAsReadHandler:', err);
        }
    }, [markAllRead]);

    return { unreadCount, unreadMessageCount, liveNotification, refetchUnread, markAllAsReadHandler };
};