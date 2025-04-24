import { supabase } from '../lib/supabase';

export interface Chat {
  chat_id: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  participants: string[];
}

export interface Message {
  message_id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

const messagesApi = {
  // Start or get existing chat with a user
  startChat: async (currentUserId: string, targetUserId: string): Promise<Chat> => {
    try {
      // Check for existing chat between users
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [currentUserId, targetUserId])
        .single();

      if (existingChat) {
        return existingChat;
      }

      // Create new chat if none exists
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert([{
          participants: [currentUserId, targetUserId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return newChat;
    } catch (error) {
      console.error('Error starting chat:', error);
      throw error instanceof Error ? error : new Error('Failed to start chat');
    }
  },

  // Get all chats for a user
  getUserChats: async (userId: string): Promise<Chat[]> => {
    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select(`
          *,
          messages!inner (content, created_at)
        `)
        .contains('participants', [userId])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return chats || [];
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch user chats');
    }
  },

  // Send a message in a chat
  sendMessage: async (chatId: string, senderId: string, content: string): Promise<Message> => {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          sender_id: senderId,
          content,
          created_at: new Date().toISOString(),
          read: false
        }])
        .select()
        .single();

      if (error) throw error;

      // Update chat's last_message and updated_at
      await supabase
        .from('chats')
        .update({
          last_message: content,
          updated_at: new Date().toISOString()
        })
        .eq('chat_id', chatId);

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error instanceof Error ? error : new Error('Failed to send message');
    }
  },

  // Get messages for a specific chat
  getChatMessages: async (chatId: string): Promise<Message[]> => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return messages || [];
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch chat messages');
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (chatId: string, userId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error instanceof Error ? error : new Error('Failed to mark messages as read');
    }
  }
};

export default messagesApi;