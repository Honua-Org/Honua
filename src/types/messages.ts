export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  media?: {
    type: 'image' | 'video' | 'file';
    url: string;
    preview?: string;
  }[];
}

export interface ChatListProps {
  selectedChat: string | null;
  onSelectChat: (chatId: string) => void;
  users: User[];
  messages: Message[];
}

export interface MessageThreadProps {
  selectedChatId: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  users: User[];
}