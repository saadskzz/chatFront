import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

const ChatLayout = () => {
  return (
    <div className="h-screen flex bg-chat-bg">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
};

export default ChatLayout;