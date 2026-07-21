import { useChatContext } from '../context/ChatContext';

// ⚠️ TUZATILDI — avval bu hook O'ZINING alohida WebSocket ulanishini
// ochardi (Chat.tsx'nikidan MUSTAQIL) — bitta foydalanuvchi uchun bir
// vaqtning o'zida IKKITA ulanish, ikkalasi ham har sahifada qayta mount
// bo'lib turardi. Endi yagona, doimiy ulanish ChatContext (_app.tsx
// darajasida) orqali boshqariladi — bu hook shunchaki o'sha kontekstdan
// o'qiydi. Top.tsx, MobileMyPage.tsx, MobileHome.tsx kabi iste'molchilar
// hech qanday o'zgarishsiz ishlashda davom etadi (qaytariladigan shakl
// bir xil saqlangan).
export const useNotificationSocket = () => {
    const { unreadCount, unreadMessageCount, liveNotification, markAllAsReadHandler } = useChatContext();
    return {
        unreadCount,
        unreadMessageCount,
        liveNotification,
        markAllAsReadHandler,
    };
};