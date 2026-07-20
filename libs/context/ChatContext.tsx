import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ChatTarget {
    memberId: string;
    nick: string;
    image?: string;
}

interface ChatContextType {
    activeChat: ChatTarget | null;
    isOpen: boolean;
    openChatWith: (target: ChatTarget) => void;
    closeChat: () => void;
    // ⚠️ YANGI — avval Message ikonkasidagi hisob (Top.tsx, useNotificationSocket
    // orqali) va Chat.tsx'ning O'ZI ikkita ALOHIDA WebSocket ulanishida edi,
    // shuning uchun Chat oynasida xabar o'qilsa ham, badge YANGILANMASDI.
    // Endi bu hisob shu YERDA — butun ilova UCHUN YAGONA markazda saqlanadi.
    unreadMessageCount: number;
    setUnreadMessageCount: React.Dispatch<React.SetStateAction<number>>;
}

const ChatContext = createContext<ChatContextType>({
    activeChat: null,
    isOpen: false,
    openChatWith: () => { },
    closeChat: () => { },
    unreadMessageCount: 0,
    setUnreadMessageCount: () => { },
});

// ⚠️ Chat.tsx UMUMIY (hamma ko'radigan) ochiq xonaga ega edi. Endi bu
// kontekst orqali "kim bilan gaplashyapman" holati butun ilova bo'ylab
// boshqariladi — Salon/Specialist Detail sahifasidagi "Message" tugmasi
// shu yerdan `openChatWith(...)` ni chaqiradi.

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeChat, setActiveChat] = useState<ChatTarget | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    const openChatWith = useCallback((target: ChatTarget) => {
        setActiveChat(target);
        setIsOpen(true);
    }, []);

    const closeChat = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <ChatContext.Provider value={{ activeChat, isOpen, openChatWith, closeChat, unreadMessageCount, setUnreadMessageCount }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => useContext(ChatContext);