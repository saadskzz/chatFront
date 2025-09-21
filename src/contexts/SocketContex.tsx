import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';

import io from 'socket.io-client';
type SocketType = ReturnType<typeof io>;
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { store } from '../store/store';
import { 
  addMessage, 
  addTypingUser, 
  removeTypingUser,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  updateMessage,
} from '../store/slices/chatSlice';
import { Message } from '@/store/api/chatApi';

interface SocketContextType {
    socket: SocketType | null;
  isConnected: boolean;
  sendMessage: (data: { receiverId: string; text?: string; image?: string }) => void;
  startTyping: (receiverId: string) => void;
  stopTyping: (receiverId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const socketRef = useRef<SocketType | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      reconnectAttempts.current = 0;
      return;
    }

    console.log('🔌 Attempting socket connection...');
    console.log('🔌 Auth token:', token);
    console.log('🔌 Is authenticated:', isAuthenticated);
    
    // Create socket connection
    socketRef.current = io('http://localhost:8000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      console.log('✅ Socket auth token:', token);
      console.log('✅ Current user:', store.getState().auth?.user);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('💥 Max reconnection attempts reached');
      }
    });

    // Message events
    socket.on('newPrivateMessage', (newMessage: Message) => {
      console.log('📨 New message received:', newMessage);
      console.log('📨 Current user ID:', store.getState().auth?.user?._id);
      console.log('📨 Message sender ID:', newMessage.senderId);
      console.log('📨 Message receiver ID:', newMessage.receiverId);
      
      // Determine the chat partner ID for storing the message
      // If I'm the receiver, store under sender's ID (they are my chat partner)
      // If I'm the sender, store under receiver's ID (they are my chat partner)
      const currentUserId = store.getState().auth?.user?._id;
      const chatPartnerId = newMessage.senderId === currentUserId ? newMessage.receiverId : newMessage.senderId;
      
      console.log('📨 Chat partner ID for storage:', chatPartnerId);
      
      // Add to Redux store for optimistic update
      console.log('📨 Dispatching addMessage action...');
      dispatch(addMessage({ 
        receiverId: chatPartnerId, 
        message: newMessage 
      }));
      
      console.log('📨 Redux state after adding message:', store.getState().chat.messages);
      console.log('📨 Messages for chat partner:', store.getState().chat.messages[chatPartnerId]);
    });

    // Handle message sent confirmation (replace optimistic message)
    socket.on('messageSent', (sentMessage: Message) => {
      console.log('✅ Message sent confirmation:', sentMessage);
      
      // Update the optimistic message with the real message data
      dispatch(updateMessage({
        receiverId: sentMessage.receiverId,
        messageId: `temp_${sentMessage.createdAt}`, // Match the optimistic message ID
        updates: sentMessage
      }));
    });

    // Typing events
    socket.on('userStartedTyping', ({ senderId, senderName, receiverId }) => {
      console.log(`⌨️ ${senderName} started typing`);
      dispatch(addTypingUser({ 
        userId: senderId, 
        username: senderName 
      }));
    });

    socket.on('userStoppedTyping', ({ senderId }) => {
      console.log(`⏹️ User stopped typing: ${senderId}`);
      dispatch(removeTypingUser(senderId));
    });

    // Online status events
    socket.on('userOnline', ({ userId, user }) => {
      console.log(`🟢 User online: ${user.firstName} ${user.lastName}`);
      dispatch(addOnlineUser(userId));
    });

    socket.on('userOffline', ({ userId }) => {
      console.log(`🔴 User offline: ${userId}`);
      dispatch(removeOnlineUser(userId));
    });

    socket.on('getOnlineUsers', (onlineUsersList) => {
      console.log(`👥 Online users updated: ${onlineUsersList.length}`);
      dispatch(setOnlineUsers(onlineUsersList.map(u => u._id)));
    });

    // User status events
    socket.on('userStatus', ({ userId, isOnline }) => {
      if (isOnline) {
        dispatch(addOnlineUser(userId));
      } else {
        dispatch(removeOnlineUser(userId));
      }
    });

    // Error handling
    socket.on('messageError', ({ error, details }) => {
      console.error('💥 Message error:', error, details);
      // You could dispatch an error action here
    });

    socket.on('connectionError', ({ error }) => {
      console.error('🔌 Connection error:', error);
    });

    // Test event to verify socket is working
    socket.on('test', (data) => {
      console.log('🧪 Test event received:', data);
    });

    // Log all socket events for debugging
    const originalEmit = socket.emit;
    socket.emit = function(event, ...args) {
      console.log('📤 Socket emit:', event, args);
      return originalEmit.call(this, event, ...args);
    };

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        console.log('🔌 Socket disconnected on cleanup');
      }
    };
  }, [token, isAuthenticated, dispatch]);

  // Socket action helpers
  const sendMessage = (data: { receiverId: string; text?: string; image?: string }) => {
    if (!socketRef.current || !isConnected) {
      console.warn('⚠️ Cannot send message: Socket not connected');
      return;
    }
    
    // Get current user ID from Redux store
    const currentUserId = store.getState().auth?.user?._id;
    
    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      _id: `temp_${Date.now()}`, // Temporary ID
      senderId: currentUserId || '', // Current user's ID
      receiverId: data.receiverId,
      text: data.text,
      image: data.image,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add optimistic message to Redux store
    // Store under receiverId (the chat partner we're sending to)
    console.log('📤 Adding optimistic message to Redux...');
    dispatch(addMessage({ 
      receiverId: data.receiverId, 
      message: optimisticMessage 
    }));
    console.log('📤 Redux state after optimistic message:', store.getState().chat.messages[data.receiverId]);
    
    socketRef.current.emit('sendPrivateMessage', data);
  };

  const startTyping = (receiverId: string) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('startTyping', { receiverId });
  };

  const stopTyping = (receiverId: string) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('stopTyping', { receiverId });
  };

  return (
    <SocketContext.Provider 
      value={{ 
        socket: socketRef.current, 
        isConnected,
        sendMessage,
        startTyping,
        stopTyping 
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};