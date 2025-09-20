import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Zap, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-chat">
      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Chat App</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-primary hover:opacity-90 transition-smooth">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-8">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Connect, Chat,{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Collaborate
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience seamless real-time messaging with our modern chat application. 
            Built for teams, designed for everyone.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 transition-smooth px-8 py-3 text-lg"
              >
                Start Chatting
              </Button>
            </Link>
            <Link to="/chat">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-glass bg-glass backdrop-blur-xl px-8 py-3 text-lg"
              >
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-2xl bg-glass backdrop-blur-xl border-glass">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Messaging</h3>
            <p className="text-muted-foreground">
              Instant message delivery with WebSocket technology for seamless communication.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-glass backdrop-blur-xl border-glass">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Group Chats</h3>
            <p className="text-muted-foreground">
              Create and manage group conversations with unlimited participants.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-glass backdrop-blur-xl border-glass">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-muted-foreground">
              End-to-end encryption ensures your conversations stay private and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
