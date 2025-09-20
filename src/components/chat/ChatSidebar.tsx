import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setActiveChat } from '@/store/slices/chatSlice';
import { useGetChatsQuery } from '@/store/api/chatApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Plus, Settings, Hash, User } from 'lucide-react';

const ChatSidebar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const { activeChatId } = useSelector((state: RootState) => state.chat);
  const { data: chats = [], isLoading } = useGetChatsQuery();

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock data for demonstration
  const mockChats = [
    {
      id: '1',
      name: 'General',
      type: 'group' as const,
      participants: ['user1', 'user2', 'user3'],
      lastMessage: {
        id: '1',
        content: 'Hey everyone! How is everyone doing today?',
        senderId: 'user2',
        senderUsername: 'Alice',
        chatId: '1',
        timestamp: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Bob Smith',
      type: 'direct' as const,
      participants: ['user1', 'user4'],
      lastMessage: {
        id: '2',
        content: 'Thanks for the help earlier!',
        senderId: 'user4',
        senderUsername: 'Bob',
        chatId: '2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      name: 'Design Team',
      type: 'group' as const,
      participants: ['user1', 'user5', 'user6'],
      lastMessage: {
        id: '3',
        content: 'The new mockups look great!',
        senderId: 'user5',
        senderUsername: 'Emma',
        chatId: '3',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const displayChats = chats.length > 0 ? filteredChats : mockChats;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="w-80 bg-chat-sidebar border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-lg">Chat App</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-chat-input border-border"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">CONVERSATIONS</h2>
            <Button variant="ghost" size="sm" className="h-auto p-1 text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {displayChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => dispatch(setActiveChat(chat.id))}
                className={`w-full p-3 rounded-lg text-left transition-all hover:bg-chat-header group ${
                  activeChatId === chat.id ? 'bg-chat-header' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {chat.type === 'group' ? (
                          <Hash className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {chat.type === 'direct' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-online rounded-full border-2 border-chat-sidebar" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">{chat.name}</h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    {chat.lastMessage && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.type === 'group' && (
                            <span className="font-medium">
                              {chat.lastMessage.senderUsername}:{' '}
                            </span>
                          )}
                          {chat.lastMessage.content}
                        </p>
                        {/* Unread indicator */}
                        <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground text-xs">
                          3
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-primary text-white text-sm">
                J
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-online rounded-full border-2 border-chat-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">John Doe</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;