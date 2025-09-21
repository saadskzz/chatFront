import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { RootState } from '../../store/store';
import { setActiveChat } from '../../store/slices/chatSlice';
import { useGetUsersForSidebarQuery } from '../../store/api/chatApi';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Plus, Settings, User, Mail, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { User as UserType } from '@/store/api/chatApi';

interface UserChatPreview {
  user: UserType;
  lastMessage?: {
    _id: string;
    text?: string;
    image?: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
  isOnline: boolean;
}

// Move all hook calls to the TOP of the component
const ChatSidebar = () => {
  // ALL HOOKS MUST BE AT THE TOP - NO CONDITIONALS!
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useAppDispatch();
  const { activeChatId, onlineUsers } = useAppSelector((state: RootState) => state.chat);
  const { user: currentUser, isAuthenticated } = useAppSelector((state: RootState) => state.auth);
  
  // All API calls at the top
  const { 
    data: users = [], 
    isLoading: isLoadingUsers, 
    error: usersError,
    isError: isUsersError
  } = useGetUsersForSidebarQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Safe data processing with useMemo to avoid re-renders
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    return users
      .filter((user): user is UserType => {
        if (!user || typeof user !== 'object') return false;
        
        const firstName = (user.firstName || '').toString().toLowerCase();
        const lastName = (user.lastName || '').toString().toLowerCase();
        const email = (user.email || '').toString().toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return (
          firstName.includes(query) ||
          lastName.includes(query) ||
          email.includes(query)
        );
      })
      .sort((a, b) => {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [users, searchQuery]);

  // Safe mock chat previews with useMemo
  const userChatPreviews = useMemo(() => {
    return filteredUsers.map(user => ({
      user,
      lastMessage: {
        _id: `msg-${user._id}`,
        text: `Say hello to ${user.firstName || 'User'}! 👋`,
        senderId: user._id,
        createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      },
      unreadCount: Math.floor(Math.random() * 3),
      isOnline: onlineUsers.includes(user._id),
    }));
  }, [filteredUsers, onlineUsers]);

  // Helper functions (no hooks here)
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    const firstInitial = (firstName?.[0] || 'U').toUpperCase();
    const lastInitial = (lastName?.[0] || '').toUpperCase();
    return lastInitial ? `${firstInitial}${lastInitial}` : firstInitial;
  };

  const handleUserSelect = (userId: string, user: UserType) => {
    if (!userId || !user) return;
    dispatch(setActiveChat({ receiverId: userId, receiver: user }));
  };

  // Content rendering (NO HOOKS BELOW THIS LINE!)
  const renderContent = () => {
    // Loading state
    if (isLoadingUsers) {
      return (
        <div className="flex-1 p-4 space-y-3">
          <div className="animate-pulse space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="w-5 h-5 bg-muted rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Error state
    if (isUsersError || usersError) {
      return (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-sm font-medium text-destructive mb-1">
                Failed to load conversations
              </h3>
              <p className="text-xs text-muted-foreground">
                {(usersError as any)?.data?.message || 'Something went wrong. Please try again.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // No users state
    if (users.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Mail className="w-16 h-16 text-muted-foreground mb-4 opacity-60" />
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            No users available
          </h3>
          <p className="text-xs text-muted-foreground mb-6 max-w-sm">
            No other users have joined yet. Be the first to start a conversation when others sign up!
          </p>
          <Button 
            variant="outline" 
            size="sm"
            disabled
            className="opacity-50 cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Friends
          </Button>
        </div>
      );
    }

    // Normal user list
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {userChatPreviews.length > 0 ? (
            <div className="space-y-1">
              {userChatPreviews.map((preview) => {
                const isActive = activeChatId === preview.user._id;
                const hasUnread = preview.unreadCount > 0;
                
                return (
                  <button
                    key={preview.user._id}
                    onClick={() => handleUserSelect(preview.user._id, preview.user)}
                    className={`w-full p-3 rounded-lg text-left transition-all hover:bg-chat-header group relative ${
                      isActive 
                        ? 'bg-chat-header border-l-2 border-primary' 
                        : 'hover:border-transparent'
                    }`}
                    aria-label={`Chat with ${preview.user.firstName} ${preview.user.lastName}`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* User Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-primary text-white text-sm font-medium border border-border">
                            {getUserInitials(preview.user.firstName, preview.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        {preview.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">
                            {preview.user.firstName} {preview.user.lastName}
                          </h3>
                          {preview.lastMessage && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(preview.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {preview.lastMessage ? (
                            <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                             
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic text-xs">
                              No messages yet
                            </p>
                          )}
                          
                          {/* Unread badge */}
                          {hasUnread && (
                            <Badge 
                              variant="destructive" 
                              className="ml-2 text-xs h-4 min-w-[18px] flex items-center justify-center px-1"
                            >
                              {preview.unreadCount > 99 ? '99+' : preview.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Active indicator line */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            // No search results
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                No users found for "{searchQuery}"
              </p>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 h-6 px-3 text-xs"
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the main layout
  return (
    <div className="w-80 bg-chat-sidebar border-r border-border flex flex-col h-full">
      {/* Header - Always renders */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-lg">Messages</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            onClick={() => console.log('New chat clicked')}
            aria-label="Start new message"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-chat-input border-border"
            disabled={isLoadingUsers}
          />
        </div>
      </div>

      {/* Online Status Indicator */}
      {onlineUsers.length > 0 && !isLoadingUsers && (
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Online ({onlineUsers.length})
            </span>
            <div className="flex space-x-1">
              {onlineUsers.slice(0, 3).map((_, index) => (
                <div 
                  key={index}
                  className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${index * 0.2}s` }}
                />
              ))}
              {onlineUsers.length > 3 && (
                <span className="text-xs text-muted-foreground">+{onlineUsers.length - 3}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Content */}
      {renderContent()}

      {/* User Profile Footer - Always renders */}
      <div className="p-4 border-t border-border bg-muted/30">
        <button 
          className="flex items-center space-x-3 w-full text-left group" 
          onClick={() => console.log('User profile clicked')}
          role="button"
          tabIndex={0}
          aria-label="Open user profile"
        >
          <div className="relative flex-shrink-0">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-primary text-white text-xs font-medium">
                {getUserInitials(currentUser?.firstName, currentUser?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'You'}
            </p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
            <Settings className="w-3 h-3" />
            <span className="sr-only">Settings</span>
          </Button>
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;