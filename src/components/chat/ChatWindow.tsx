import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetMessagesQuery, useSendMessageMutation } from '@/store/api/chatApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Smile, Paperclip, MoreVertical, Hash, User, Phone, Video } from 'lucide-react';

const ChatWindow = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeChatId } = useSelector((state: RootState) => state.chat);
  const { data: messages = [], isLoading } = useGetMessagesQuery(activeChatId || '', {
    skip: !activeChatId,
  });
  const [sendMessage] = useSendMessageMutation();

  // Mock data for demonstration
  const mockMessages = [
    {
      id: '1',
      content: 'Hey everyone! How is everyone doing today?',
      senderId: 'user2',
      senderUsername: 'Alice',
      senderAvatar: '',
      chatId: activeChatId || '1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      content: 'I am doing great! Just finished a big project at work.',
      senderId: 'user1',
      senderUsername: 'You',
      senderAvatar: '',
      chatId: activeChatId || '1',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: '3',
      content: 'That\'s awesome! Congratulations on finishing your project. What was it about?',
      senderId: 'user3',
      senderUsername: 'Bob',
      senderAvatar: '',
      chatId: activeChatId || '1',
      timestamp: new Date(Date.now() - 3400000).toISOString(),
    },
    {
      id: '4',
      content: 'It was a new chat application with real-time messaging. Pretty excited about how it turned out!',
      senderId: 'user1',
      senderUsername: 'You',
      senderAvatar: '',
      chatId: activeChatId || '1',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
    },
    {
      id: '5',
      content: 'Sounds really cool! I\'d love to see it sometime.',
      senderId: 'user2',
      senderUsername: 'Alice',
      senderAvatar: '',
      chatId: activeChatId || '1',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const displayMessages = messages.length > 0 ? messages : mockMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChatId) return;

    try {
      await sendMessage({
        chatId: activeChatId,
        content: message,
      }).unwrap();
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
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

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!activeChatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-bg">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Hash className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Chat App</h2>
          <p className="text-muted-foreground">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-chat-bg">
      {/* Chat Header */}
      <div className="p-4 border-b border-border bg-chat-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-primary text-white">
                <Hash className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">General</h2>
              <p className="text-sm text-muted-foreground">3 members online</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((msg, index) => {
          const prevMessage = displayMessages[index - 1];
          const showDateSeparator = !prevMessage || 
            formatDate(msg.timestamp) !== formatDate(prevMessage.timestamp);
          const isConsecutive = prevMessage && 
            prevMessage.senderId === msg.senderId && 
            formatDate(msg.timestamp) === formatDate(prevMessage.timestamp);

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-chat-header rounded-full text-xs text-muted-foreground">
                    {formatDate(msg.timestamp)}
                  </div>
                </div>
              )}
              
              <div 
                className={`group hover:bg-chat-message-hover transition-smooth rounded-lg p-2 ${
                  isConsecutive ? 'mt-1' : 'mt-4'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {!isConsecutive && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-gradient-primary text-white text-xs">
                        {msg.senderUsername.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {isConsecutive && <div className="w-8" />}
                  
                  <div className="flex-1 min-w-0">
                    {!isConsecutive && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm">{msg.senderUsername}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex items-center space-x-3 text-muted-foreground">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="bg-muted text-xs">A</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <span className="font-medium">Alice</span> is typing...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1 bg-chat-input rounded-lg border border-border overflow-hidden">
            <div className="flex items-center px-3 py-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={!message.trim()}
            className="bg-gradient-primary hover:opacity-90 transition-smooth"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;