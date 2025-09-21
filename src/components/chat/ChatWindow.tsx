import { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { RootState } from '../../store/store';
import { useSocket } from '../../contexts/SocketContex';
import { 
  useGetMessagesQuery, 
  useSendMessageMutation,
  Message 
} from '@/store/api/chatApi';
import { setMessages } from '@/store/slices/chatSlice';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  User, 
  Phone, 
  Video, 
  Clock, 
  Image as ImageIcon, 
  Loader2
} from 'lucide-react';

const ChatWindow = () => {
  const [message, setMessage] = useState('');
  const [showFileInput, setShowFileInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get active chat info from Redux
  const { 
    activeChatId, 
    activeReceiver, 
    isSendingMessage,
    isTyping,
    onlineUsers
  } = useAppSelector((state: RootState) => state.chat);
  
  const { user: currentUser } = useAppSelector((state: RootState) => state.auth);
  const { socket, isConnected, startTyping, stopTyping, sendMessage: sendSocketMessage } = useSocket();
  
  // Get messages from Redux store instead of RTK Query for real-time updates
  const messages = useAppSelector((state: RootState) => 
    activeChatId ? state.chat.messages[activeChatId] || [] : []
  );
  
  // Get dispatch for Redux actions
  const dispatch = useAppDispatch();
  
  // Use RTK Query ONLY ONCE for initial loading and error handling
  const { 
    data: initialMessages = [],
    isLoading: isLoadingMessages, 
    error: messagesError 
  } = useGetMessagesQuery(activeChatId || '', {
    skip: !activeChatId,
  });
  
  const [sendMessage] = useSendMessageMutation();
  
  // Debug: Log messages and Redux state
  useEffect(() => {
    console.log('💬 ChatWindow - Active chat ID:', activeChatId);
    console.log('💬 ChatWindow - Messages for active chat:', messages);
    console.log('💬 ChatWindow - Current user ID:', currentUser?._id);
  }, [messages, activeChatId, currentUser]);
  
  // Load initial messages into Redux store when RTK Query data is available
  useEffect(() => {
    if (initialMessages.length > 0 && activeChatId) {
      // Set initial messages in Redux store
      dispatch(setMessages({ receiverId: activeChatId, messages: initialMessages }));
    }
  }, [initialMessages, activeChatId, dispatch]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing indicator (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (message.trim().length > 0) {
      // Emit typing event (implement socket connection later)
      console.log('User is typing...');
      
      // Clear previous timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Set new timeout to stop typing indicator
      timeoutId = setTimeout(() => {
        console.log('User stopped typing');
      }, 1000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [message]);

  // Handle file input trigger
  useEffect(() => {
    if (showFileInput && fileInputRef.current) {
      fileInputRef.current.click();
      setShowFileInput(false);
    }
  }, [showFileInput]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || !activeChatId || isSendingMessage) return;

    try {
      let imageBase64 = null;
      
      // Convert file to base64 if selected
      if (selectedFile) {
        imageBase64 = await convertToBase64(selectedFile);
      }

      // Use socket for real-time messaging
      sendSocketMessage({
        receiverId: activeChatId,
        text: message.trim(),
        image: imageBase64,
      });
      
      // Clear inputs
      setMessage('');
      setSelectedFile(null);
      setShowFileInput(false);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // You could add toast notification here
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isCurrentUser = (message: Message) => {
    return message.senderId === currentUser?._id;
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const grouped: { [key: string]: Message[] } = {};
    
    // Sort messages by timestamp to ensure chronological order
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    sortedMessages.forEach(msg => {
      const dateKey = formatDate(msg.createdAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });
    
    return grouped;
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    const firstInitial = (firstName?.[0] || 'U').toUpperCase();
    const lastInitial = (lastName?.[0] || '').toUpperCase();
    return lastInitial ? `${firstInitial}${lastInitial}` : firstInitial;
  };

  const renderMessage = (message: Message, index: number, messagesInGroup: Message[]) => {
    const prevMessage = index > 0 ? messagesInGroup[index - 1] : null;
    const nextMessage = index < messagesInGroup.length - 1 ? messagesInGroup[index + 1] : null;
    
    const isConsecutive = prevMessage && 
      prevMessage.senderId === message.senderId && 
      Math.abs(new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) < 300000; // 5 minutes
    
    const showAvatar = !isConsecutive || !prevMessage || prevMessage.senderId !== message.senderId;
    const showUsername = showAvatar && !isCurrentUser(message);
    const showTimestamp = !nextMessage || nextMessage.senderId !== message.senderId || isCurrentUser(message);

    return (
      <div 
        key={message._id}
        className={`flex ${isCurrentUser(message) ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div className={`max-w-[70%] ${isCurrentUser(message) ? 'order-2' : ''}`}>
          {/* Message bubble */}
          <div 
            className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
              isCurrentUser(message) 
                ? 'bg-gradient-primary text-white rounded-br-sm' 
                : 'bg-chat-message-received text-foreground rounded-bl-sm'
            }`}
          >
            {/* Message content */}
            {message.image ? (
              <div className="relative group">
                <img 
                  src={message.image} 
                  alt="Message image" 
                  className="max-w-full max-h-48 rounded-lg cursor-pointer"
                  onClick={() => window.open(message.image, '_blank')}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all"></div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            )}
            
            {/* Timestamp */}
            {showTimestamp && (
              <div className={`mt-1 flex ${isCurrentUser(message) ? 'justify-end' : 'justify-start'}`}>
                <span className={`text-xs ${
                  isCurrentUser(message) 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground'
                }`}>
                  {formatTime(message.createdAt)}
                </span>
              </div>
            )}
          </div>
          
          {/* Sender info (for received messages) */}
          {!isCurrentUser(message) && showAvatar && (
            <div className="flex items-center mt-1 space-x-2">
              {showUsername && (
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]">
                  {activeReceiver?.firstName} {activeReceiver?.lastName}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatTime(message.createdAt)}
              </span>
            </div>
          )}
        </div>
        
        {/* Avatar (only for received messages) */}
        {!isCurrentUser(message) && showAvatar && (
          <div className="flex-shrink-0 ml-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-secondary text-white text-xs font-medium">
                {getUserInitials(activeReceiver?.firstName, activeReceiver?.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    );
  };

  // No active chat state
  if (!activeChatId || !activeReceiver) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-chat-bg p-8 text-center">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-foreground">
          Select a conversation
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Choose a user from the sidebar to start messaging
        </p>
        {isLoadingMessages && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading messages...</span>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex flex-col bg-chat-bg">
        {/* Header */}
        <div className="p-4 border-b border-border bg-chat-header animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="space-y-1">
              <div className="h-5 bg-muted rounded w-24"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </div>
          </div>
        </div>
        
        {/* Loading messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full mt-1"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16 ml-auto"></div>
                </div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-border animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="flex-1 space-x-2">
              <div className="h-10 bg-muted rounded-full"></div>
            </div>
            <div className="w-10 h-10 bg-muted rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (messagesError) {
    return (
      <div className="flex-1 flex flex-col bg-chat-bg">
        {/* Header */}
        <div className="p-4 border-b border-border bg-chat-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-secondary text-white">
                  {getUserInitials(activeReceiver?.firstName, activeReceiver?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">
                  {activeReceiver?.firstName} {activeReceiver?.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentUser?._id === activeChatId ? 'You' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Error content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <Clock className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-sm font-medium text-destructive mb-1">
                Failed to load messages
              </h3>
              <p className="text-xs text-muted-foreground">
                {(messagesError as any)?.data?.message || 'Something went wrong with message loading.'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry Loading Messages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);
  
  return (
    <div className="flex-1 flex flex-col bg-chat-bg">
      {/* Header */}
      <div className="p-4 border-b border-border bg-chat-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-secondary text-white">
                {getUserInitials(activeReceiver?.firstName, activeReceiver?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">
                {activeReceiver?.firstName} {activeReceiver?.lastName}
              </h2>
              <div className="flex items-center space-x-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  onlineUsers.includes(activeReceiver?._id || '') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {onlineUsers.includes(activeReceiver?._id || '') ? 'Online' : 'Offline'}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {messages.length} messages
                </span>
                {isConnected && (
                  <span className="ml-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
              <Phone className="w-4 h-4" />
              <span className="sr-only">Call</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
              <Video className="w-4 h-4" />
              <span className="sr-only">Video call</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
              <span className="sr-only">More options</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([dateKey, messagesInGroup]) => (
          <div key={dateKey}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-6">
              <div className="px-3 py-1 bg-chat-date-separator rounded-full text-xs text-muted-foreground border border-border">
                {dateKey}
              </div>
            </div>
            
            {/* Messages in this date group */}
            {messagesInGroup.map((message, index) => 
              renderMessage(message, index, messagesInGroup)
            )}
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start space-x-3 py-2 opacity-75">
            <Avatar className="w-7 h-7 mt-1">
              <AvatarFallback className="bg-muted text-xs">
                {getUserInitials(activeReceiver?.firstName, activeReceiver?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-background">
        <div className="flex items-end space-x-2">
          {/* File upload */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-10 w-10 p-0"
            onClick={() => setShowFileInput(true)}
          >
            <Paperclip className="w-4 h-4" />
            <span className="sr-only">Attach file</span>
          </Button>
          
          {/* File preview (if selected) */}
          {selectedFile && (
            <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg max-w-xs">
              <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate flex-1">
                {selectedFile.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={() => {
                  setSelectedFile(null);
                  setShowFileInput(false);
                }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          )}
          
          {/* File input (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.type.startsWith('image/')) {
                setSelectedFile(file);
              }
              setShowFileInput(false);
            }}
            className="hidden"
          />
          
          {/* Message input */}
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={selectedFile ? "Add a message..." : "Type a message..."}
              className="pr-12 bg-chat-input border-border resize-none min-h-[40px] max-h-[120px]"
              disabled={isSendingMessage}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-6 w-6 p-0"
              onClick={() => console.log('Emoji picker')}
            >
              <Smile className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Send button */}
          <Button 
            type="submit" 
            disabled={(!message.trim() && !selectedFile) || isSendingMessage}
            className={`h-10 px-4 transition-all ${
              message.trim() || selectedFile 
                ? 'bg-gradient-primary hover:opacity-90' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isSendingMessage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send 
                className={`w-4 h-4 transition-transform ${
                  message.trim() || selectedFile ? 'rotate-45' : ''
                }`} 
              />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;