import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '../api/authApi';
import { Message } from '../api/chatApi';

// Types
export interface Chat {
  id: string;
  receiverId: string;
  receiver: User;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface TypingUser {
  userId: string;
  username: string;
  timeoutId?: NodeJS.Timeout;
}

export interface ChatError {
  message: string;
  details?: string;
}

export interface MessageStatus {
  messageId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  readAt?: string;
}

// State interface
interface ChatState {
  // Active chat
  activeChatId: string | null;
  activeReceiver: User | null;
  
  // Chats list
  chats: Chat[];
  chatIds: string[]; // For quick lookup
  
  // Messages
  messages: Record<string, Message[]>; // { receiverId: [messages...] }
  messageIds: Record<string, string[]>; // For quick lookup
  messageStatus: Record<string, MessageStatus>; // Message status tracking
  
  // Real-time features
  isTyping: boolean;
  typingUsers: TypingUser[];
  onlineUsers: string[];
  
  // UI state
  isChatListLoading: boolean;
  isMessagesLoading: Record<string, boolean>;
  isSendingMessage: boolean;
  
  // Search and filters
  searchTerm: string;
  filteredChats: Chat[];
  
  // Error handling
  error: ChatError | null;
}

const initialState: ChatState = {
  // Active chat
  activeChatId: null,
  activeReceiver: null,
  
  // Chats list
  chats: [],
  chatIds: [],
  
  // Messages
  messages: {},
  messageIds: {},
  messageStatus: {},
  
  // Real-time features
  isTyping: false,
  typingUsers: [],
  onlineUsers: [],
  
  // UI state
  isChatListLoading: false,
  isMessagesLoading: {},
  isSendingMessage: false,
  
  // Search and filters
  searchTerm: '',
  filteredChats: [],
  
  // Error handling
  error: null,
};

// Async thunks
export const fetchInitialChats = createAsyncThunk(
  'chat/fetchInitialChats',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState() as any;
    if (!auth.token) {
      return rejectWithValue('No authentication token');
    }
    // This would fetch initial chats data - you might implement this in backend later
    return { chats: [] };
  }
);

// Selectors
export const selectActiveChatMessages = (state: ChatState, receiverId: string) => {
  return state.messages[receiverId] || [];
};

export const selectActiveChat = (state: ChatState) => {
  if (!state.activeChatId || !state.activeReceiver) return null;
  
  const chat = state.chats.find(c => c.receiverId === state.activeChatId);
  return {
    ...chat,
    receiver: state.activeReceiver,
    messages: selectActiveChatMessages(state, state.activeChatId),
  };
};

export const selectFilteredChats = (state: ChatState) => {
  if (!state.searchTerm) return state.chats;
  
  return state.chats.filter(chat => 
    chat.receiver.firstName.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    chat.receiver.lastName.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    chat.receiver.email.toLowerCase().includes(state.searchTerm.toLowerCase())
  );
};

export const selectTypingUsersForActiveChat = (state: ChatState) => {
  if (!state.activeChatId) return [];
  return state.typingUsers.filter(user => user.userId === state.activeChatId);
};

export const selectIsUserOnline = (state: ChatState, userId: string) => {
  return state.onlineUsers.includes(userId);
};

export const selectUnreadCount = (state: ChatState) => {
  return state.chats.reduce((total, chat) => total + chat.unreadCount, 0);
};

// Main slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Active chat management
    setActiveChat: (state, action: PayloadAction<{ receiverId: string; receiver: User }>) => {
      const { receiverId, receiver } = action.payload;
      state.activeChatId = receiverId;
      state.activeReceiver = receiver;
      state.isMessagesLoading[receiverId] = false;
      
      // Mark messages as read for active chat
      const chatIndex = state.chats.findIndex(chat => chat.receiverId === receiverId);
      if (chatIndex >= 0) {
        state.chats[chatIndex].unreadCount = 0;
      }
      
      // Clear typing indicators for previous chat
      state.typingUsers = state.typingUsers.filter(user => user.userId === receiverId);
    },
    
    clearActiveChat: (state) => {
      const previousChatId = state.activeChatId;
      state.activeChatId = null;
      state.activeReceiver = null;
      state.isTyping = false;
      
      // Clear typing indicators for the previous active chat
      if (previousChatId) {
        state.typingUsers = state.typingUsers.filter(
          user => user.userId !== previousChatId
        );
      }
    },
    
    // Chats list management
    setChatsList: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
      state.chatIds = action.payload.map(chat => chat.id);
      state.filteredChats = action.payload;
    },
    
    addOrUpdateChat: (state, action: PayloadAction<Chat>) => {
      const chatIndex = state.chats.findIndex(chat => chat.receiverId === action.payload.receiverId);
      
      if (chatIndex >= 0) {
        // Update existing chat
        state.chats[chatIndex] = { ...state.chats[chatIndex], ...action.payload };
      } else {
        // Add new chat
        state.chats.push(action.payload);
        state.chatIds.push(action.payload.id);
      }
      
      // Keep chats sorted by updatedAt
      state.chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      state.filteredChats = state.chats;
    },
    
    removeChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter(chat => chat.receiverId !== action.payload);
      state.chatIds = state.chatIds.filter(id => id !== action.payload);
      state.filteredChats = state.chats;
      
      // Clear messages for this chat
      delete state.messages[action.payload];
      delete state.messageIds[action.payload];
      delete state.isMessagesLoading[action.payload];
      
      // Clear active chat if it's being removed
      if (state.activeChatId === action.payload) {
        state.activeChatId = null;
        state.activeReceiver = null;
      }
    },
    
    // Messages management
    setMessages: (state, action: PayloadAction<{ receiverId: string; messages: Message[] }>) => {
      const { receiverId, messages } = action.payload;
      state.messages[receiverId] = messages;
      state.messageIds[receiverId] = messages.map(msg => msg._id);
      state.isMessagesLoading[receiverId] = false;
    },
    
    addMessage: (state, action: PayloadAction<{ receiverId: string; message: Message }>) => {
  const { receiverId, message } = action.payload;
  
  // Initialize messages array if it doesn't exist
  if (!state.messages[receiverId]) {
    state.messages[receiverId] = [];
    state.messageIds[receiverId] = [];
  }
  
  // Check if message already exists (prevent duplicates)
  const messageExists = state.messages[receiverId].some(msg => msg._id === message._id);
  if (messageExists) return;
  
  // Add message to the end (chronological order)
  state.messages[receiverId].push(message);
  state.messageIds[receiverId].push(message._id);
  
  // Update or create chat for this conversation
  const chatIndex = state.chats.findIndex(chat => chat.receiverId === receiverId);
  if (chatIndex >= 0) {
    state.chats[chatIndex].lastMessage = message;
    state.chats[chatIndex].updatedAt = message.createdAt;
    
    // Only increment unread count if it's not from the active chat
    if (state.activeChatId !== receiverId) {
      state.chats[chatIndex].unreadCount += 1;
    }
  } else {
    // Create new chat entry - FIXED: Always provide a User object
    const receiverUser: User = {
      _id: receiverId,
      firstName: 'Unknown', // You might want to fetch this from a users store
      lastName: 'User',
      email: '', // You might want to fetch this from a users store
    };
    
    const newChat: Chat = {
      id: receiverId,
      receiverId,
      receiver: receiverUser, // Now this is always a User object
      lastMessage: message,
      unreadCount: state.activeChatId === receiverId ? 0 : 1,
      updatedAt: message.createdAt,
    };
    state.chats.unshift(newChat);
    state.chatIds.unshift(receiverId);
  }
  
  // Re-sort chats by updatedAt
  state.chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  state.filteredChats = state.chats;
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
    
    removeMessage: (state, action: PayloadAction<{ receiverId: string; messageId: string }>) => {
      const { receiverId, messageId } = action.payload;
      
      if (state.messages[receiverId]) {
        state.messages[receiverId] = state.messages[receiverId].filter(msg => msg._id !== messageId);
        state.messageIds[receiverId] = state.messageIds[receiverId].filter(id => id !== messageId);
      }
      
      // Remove from message status tracking
      delete state.messageStatus[messageId];
    },
    
    // Message status management
    updateMessageStatus: (state, action: PayloadAction<MessageStatus>) => {
      const { messageId, status, readAt } = action.payload;
      state.messageStatus[messageId] = { messageId, status, readAt };
      
      // Also update the message in the messages array if needed
      Object.keys(state.messages).forEach(receiverId => {
        const messageIndex = state.messages[receiverId].findIndex(msg => msg._id === messageId);
        if (messageIndex >= 0) {
          state.messages[receiverId][messageIndex] = {
            ...state.messages[receiverId][messageIndex],
            read: status === 'read',
            // Add other status fields if your Message interface supports them
          };
        }
      });
    },
    
    // Typing indicators
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    
    addTypingUser: (state, action: PayloadAction<TypingUser>) => {
      // Remove existing entry for this user if it exists
      state.typingUsers = state.typingUsers.filter(
        user => user.userId !== action.payload.userId
      );
      
      // Add new typing user
      state.typingUsers.push(action.payload);
    },
    
    removeTypingUser: (state, action: PayloadAction<string>) => {
      const typingUser = state.typingUsers.find(user => user.userId === action.payload);
      
      // Clear timeout if it exists
      if (typingUser?.timeoutId) {
        clearTimeout(typingUser.timeoutId);
      }
      
      state.typingUsers = state.typingUsers.filter(
        user => user.userId !== action.payload
      );
    },
    
    clearAllTypingUsers: (state) => {
      // Clear all timeouts
      state.typingUsers.forEach(user => {
        if (user.timeoutId) {
          clearTimeout(user.timeoutId);
        }
      });
      state.typingUsers = [];
    },
    
    // Online users
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
    
    // UI state
    setChatListLoading: (state, action: PayloadAction<boolean>) => {
      state.isChatListLoading = action.payload;
    },
    
    setMessagesLoading: (state, action: PayloadAction<{ receiverId: string; isLoading: boolean }>) => {
      const { receiverId, isLoading } = action.payload;
      state.isMessagesLoading[receiverId] = isLoading;
    },
    
    setSendingMessage: (state, action: PayloadAction<boolean>) => {
      state.isSendingMessage = action.payload;
    },
    
    // Search
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.filteredChats = state.chats.filter(chat => 
        chat.receiver.firstName.toLowerCase().includes(action.payload.toLowerCase()) ||
        chat.receiver.lastName.toLowerCase().includes(action.payload.toLowerCase()) ||
        chat.receiver.email.toLowerCase().includes(action.payload.toLowerCase())
      );
    },
    
    clearSearch: (state) => {
      state.searchTerm = '';
      state.filteredChats = state.chats;
    },
    
    // Unread messages
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const chatIndex = state.chats.findIndex(chat => chat.receiverId === action.payload);
      if (chatIndex >= 0 && state.activeChatId !== action.payload) {
        state.chats[chatIndex].unreadCount += 1;
      }
    },
    
    resetUnreadCount: (state, action: PayloadAction<string>) => {
      const chatIndex = state.chats.findIndex(chat => chat.receiverId === action.payload);
      if (chatIndex >= 0) {
        state.chats[chatIndex].unreadCount = 0;
      }
    },
    
    markMessagesAsRead: (state, action: PayloadAction<{ receiverId: string; messageIds: string[] }>) => {
      const { receiverId, messageIds } = action.payload;
      
      if (state.messages[receiverId]) {
        state.messages[receiverId].forEach(message => {
          if (messageIds.includes(message._id)) {
            message.read = true;
          }
        });
      }
      
      // Update message status
      messageIds.forEach(messageId => {
        state.messageStatus[messageId] = {
          messageId,
          status: 'read',
          readAt: new Date().toISOString(),
        };
      });
      
      // Reset unread count
      const chatIndex = state.chats.findIndex(chat => chat.receiverId === receiverId);
      if (chatIndex >= 0) {
        state.chats[chatIndex].unreadCount = 0;
      }
    },
    
    // Chat list updates from socket
    updateChatLastMessage: (state, action: PayloadAction<{ chatId: string; lastMessage: Message; unreadCount?: number }>) => {
      const { chatId, lastMessage, unreadCount } = action.payload;
      const chatIndex = state.chats.findIndex(chat => chat.receiverId === chatId);
      
      if (chatIndex >= 0) {
        state.chats[chatIndex].lastMessage = lastMessage;
        state.chats[chatIndex].updatedAt = lastMessage.createdAt;
        
        if (unreadCount !== undefined) {
          state.chats[chatIndex].unreadCount = unreadCount;
        }
        
        // Re-sort chats
        state.chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        state.filteredChats = state.chats;
      }
    },
    
    // Error handling
    setError: (state, action: PayloadAction<ChatError>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Socket message handlers - comprehensive handler
    handleNewSocketMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const chatPartnerId = message.senderId; // The person we're chatting with
      
      // Add message to the appropriate chat
      chatSlice.caseReducers.addMessage(state, {
        type: 'chat/addMessage',
        payload: { receiverId: chatPartnerId, message },
      });
      
      // If it's not from the active chat, increment unread count
      if (state.activeChatId !== chatPartnerId) {
        chatSlice.caseReducers.incrementUnreadCount(state, {
          type: 'chat/incrementUnreadCount',
          payload: chatPartnerId,
        });
      }
    },
    
    // Bulk operations
    bulkMarkAsRead: (state, action: PayloadAction<{ receiverId: string }>) => {
      const { receiverId } = action.payload;
      
      if (state.messages[receiverId]) {
        state.messages[receiverId].forEach(message => {
          message.read = true;
          state.messageStatus[message._id] = {
            messageId: message._id,
            status: 'read',
            readAt: new Date().toISOString(),
          };
        });
      }
      
      // Reset unread count
      const chatIndex = state.chats.findIndex(chat => chat.receiverId === receiverId);
      if (chatIndex >= 0) {
        state.chats[chatIndex].unreadCount = 0;
      }
    },
    
    // Clear all chat data (for logout)
    clearAllChatData: (state) => {
      // Clear timeouts
      state.typingUsers.forEach(user => {
        if (user.timeoutId) {
          clearTimeout(user.timeoutId);
        }
      });
      
      // Reset to initial state
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialChats.pending, (state) => {
        state.isChatListLoading = true;
        state.error = null;
      })
      .addCase(fetchInitialChats.fulfilled, (state, action) => {
        state.isChatListLoading = false;
        state.chats = action.payload.chats;
        state.filteredChats = action.payload.chats;
      })
      .addCase(fetchInitialChats.rejected, (state, action) => {
        state.isChatListLoading = false;
        state.error = {
          message: 'Failed to load chats',
          details: action.payload as string,
        };
      });
  },
});

export const { 
  // Active chat
  setActiveChat,
  clearActiveChat,
  
  // Chats list
  setChatsList,
  addOrUpdateChat,
  removeChat,
  
  // Messages
  setMessages,
  addMessage,
  updateMessage,
  removeMessage,
  
  // Message status
  updateMessageStatus,
  
  // Typing
  setIsTyping,
  addTypingUser,
  removeTypingUser,
  clearAllTypingUsers,
  
  // Online users
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  
  // UI state
  setChatListLoading,
  setMessagesLoading,
  setSendingMessage,
  
  // Search
  setSearchTerm,
  clearSearch,
  
  // Unread messages
  incrementUnreadCount,
  resetUnreadCount,
  markMessagesAsRead,
  bulkMarkAsRead,
  
  // Chat updates
  updateChatLastMessage,
  
  // Error handling
  setError,
  clearError,
  
  // Socket handlers
  handleNewSocketMessage,
  
  // Bulk operations
  clearAllChatData,
} = chatSlice.actions;

export default chatSlice.reducer;

// Helper functions
export const createTypingTimeout = (dispatch: any, userId: string, timeout: number = 3000) => {
  return setTimeout(() => {
    dispatch(removeTypingUser(userId));
  }, timeout);
};

// Additional selectors for better performance
export const selectChatByReceiverId = (state: ChatState, receiverId: string) => {
  return state.chats.find(chat => chat.receiverId === receiverId);
};

export const selectMessagesByReceiverId = (state: ChatState, receiverId: string) => {
  return state.messages[receiverId] || [];
};

export const selectIsMessagesLoading = (state: ChatState, receiverId: string) => {
  return state.isMessagesLoading[receiverId] || false;
};

export const selectMessageStatus = (state: ChatState, messageId: string) => {
  return state.messageStatus[messageId];
};