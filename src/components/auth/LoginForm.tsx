import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoginMutation } from '../../store/api/authApi';
import { useAppDispatch } from '../../store/hooks'; // Use typed dispatch
import { loginSuccess } from '../../store/slices/authSlice'; // Use specific login action
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Mail, LogIn, AlertCircle } from 'lucide-react';

interface LoginFormData {
  email: string;
  // Removed password since backend doesn't require it
}

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<LoginFormData>({
    mode: 'onChange',
  });
  
  const [login, { isLoading, error }] = useLoginMutation();

  const onSubmit = async (data: LoginFormData) => {
    console.log('🔑 Attempting login with email:', data.email);
    
    try {
      const result = await login({ email: data.email }).unwrap();
      
      console.log('✅ Login successful:', result);
      
      // Use the specific loginSuccess action that handles the response structure
      dispatch(loginSuccess(result));
      
      toast({
        title: "Welcome back! 👋",
        description: `Logged in as ${result.data.firstName} ${result.data.lastName}`,
        className: "border-blue-500 bg-blue-50 text-blue-700",
      });
      
      // Redirect to chat dashboard
      setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      toast({
        title: "Login failed",
        description: error?.data?.message || "Unable to log in. Please check your email and try again.",
        variant: "destructive",
      });
    }
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-chat p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-primary-foreground animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Signing In...
          </h1>
          <p className="text-muted-foreground">
            Please wait while we authenticate your account.
          </p>
          <div className="mt-4 inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-chat p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-2">Sign in with your email to continue</p>
        </div>

        <Card className="bg-glass backdrop-blur-xl border-glass">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your registered email address
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className={`bg-chat-input border-border transition-smooth pl-10 ${
                      errors.email ? 'border-destructive' : ''
                    }`}
                    disabled={isLoading}
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: 'Please enter a valid email address'
                      }
                    })}
                  />
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email.message}</span>
                  </div>
                )}
              </div>

              {/* Email-only auth info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Email-only login:</span> Just enter your registered email. 
                    No password required for this demo.
                  </span>
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                disabled={isLoading || !isValid}
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-primary hover:underline transition-smooth font-medium"
                  >
                    Create one here
                  </Link>
                </p>
                
                {/* {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                    <p>API: {process.env.REACT_APP_API_URL || 'http://localhost:8000'}</p>
                    <p>Form Valid: {isValid ? '✅' : '❌'}</p>
                  </div>
                )} */}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;