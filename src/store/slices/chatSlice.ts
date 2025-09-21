import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../api/authApi';
import { Message } from '../api/chatApi';


export interface TypingUser {
  userId: string;
  username: string;
  timeoutId?: NodeJS.Timeout;
}


interface ChatState {
  
  activeChatId: string | null;
  activeReceiver: User | null;
  
  
  messages: Record<string, Message[]>; 
  
  
  isTyping: boolean;
  typingUsers: TypingUser[];
  onlineUsers: string[];
  
  
  isSendingMessage: boolean;
}

const initialState: ChatState = {
  
  activeChatId: null,
  activeReceiver: null,
  
  
  messages: {},
  
  
  isTyping: false,
  typingUsers: [],
  onlineUsers: [],
  
  
  isSendingMessage: false,
};


const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    
    setActiveChat: (state, action: PayloadAction<{ receiverId: string; receiver: User }>) => {
      const { receiverId, receiver } = action.payload;
      state.activeChatId = receiverId;
      state.activeReceiver = receiver;
      
      
      state.typingUsers = state.typingUsers.filter(user => user.userId === receiverId);
    },
    
    clearActiveChat: (state) => {
      const previousChatId = state.activeChatId;
      state.activeChatId = null;
      state.activeReceiver = null;
      state.isTyping = false;
      
      
      if (previousChatId) {
        state.typingUsers = state.typingUsers.filter(
          user => user.userId !== previousChatId
        );
      }
    },
    
    
    setMessages: (state, action: PayloadAction<{ receiverId: string; messages: Message[] }>) => {
      const { receiverId, messages } = action.payload;
      state.messages[receiverId] = messages;
    },
    
    addMessage: (state, action: PayloadAction<{ receiverId: string; message: Message }>) => {
      const { receiverId, message } = action.payload;
      
      
      if (!state.messages[receiverId]) {
        state.messages[receiverId] = [];
      }
      
      
      const messageExists = state.messages[receiverId].some(msg => msg._id === message._id);
      if (messageExists) return;
      
      
      state.messages[receiverId].push(message);
    },
    
    updateMessage: (state, action: PayloadAction<{ receiverId: string; messageId: string; updates: Partial<Message> }>) => {
      const { receiverId, messageId, updates } = action.payload;
      
      if (state.messages[receiverId]) {
        const messageIndex = state.messages[receiverId].findIndex(msg => msg._id === messageId);
        if (messageIndex >= 0) {
          state.messages[receiverId][messageIndex] = {
            ...state.messages[receiverId][messageIndex],
            ...updates,
          };
        }
      }
    },
    
    
    addTypingUser: (state, action: PayloadAction<TypingUser>) => {
      
      state.typingUsers = state.typingUsers.filter(
        user => user.userId !== action.payload.userId
      );
      
      
      state.typingUsers.push(action.payload);
    },
    
    removeTypingUser: (state, action: PayloadAction<string>) => {
      const typingUser = state.typingUsers.find(user => user.userId === action.payload);
      
      
      if (typingUser?.timeoutId) {
        clearTimeout(typingUser.timeoutId);
      }
      
      state.typingUsers = state.typingUsers.filter(
        user => user.userId !== action.payload
      );
    },
    
    
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    
    addOnlineUser: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    
    removeOnlineUser: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    },
    
    
    setSendingMessage: (state, action: PayloadAction<boolean>) => {
      state.isSendingMessage = action.payload;
    },
  },
});

export const { 
  
  setActiveChat,
  clearActiveChat,
  
  
  setMessages,
  addMessage,
  updateMessage,
  
  
  addTypingUser,
  removeTypingUser,
  
  
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  
  
  setSendingMessage,
} = chatSlice.actions;

export default chatSlice.reducer;