import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSignupMutation } from '../../store/api/authApi';
import { useAppDispatch } from '../../store/hooks'; // Use typed dispatch
import { signupSuccess } from '../../store/slices/authSlice'; // Use specific action for signup
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, User, Mail, UserPlus } from 'lucide-react';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
}

const SignupForm = () => {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<SignupFormData>({
    mode: 'onChange',
    criteriaMode: 'all',
  });
  
  const [signup, { isLoading }] = useSignupMutation();

  const onSubmit = async (data: SignupFormData) => {
    try {
      // Call signup API with correct data structure
      const result = await signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      }).unwrap();
      
      // Dispatch signup success - this sets user but not token (matches backend)
      dispatch(signupSuccess(result));
      
      // Show success toast
      toast({
        title: "Account created successfully!",
        description: "Please log in to start chatting.",
        className: "border-green-500 bg-green-50 text-green-700",
      });
      
      // Mark form as submitted and redirect to login
      setIsFormSubmitted(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error?.data?.message || "Failed to create account. Please try again.";
      
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Show success message while redirecting
  if (isFormSubmitted && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-chat p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Account Created!
          </h1>
          <p className="text-muted-foreground mb-6">
            Redirecting you to login...
          </p>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
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
            Join the Conversation
          </h1>
          <p className="text-muted-foreground mt-2">Create your account to start chatting</p>
        </div>

        <Card className="bg-glass backdrop-blur-xl border-glass">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to join the chat
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    className="bg-chat-input border-border transition-smooth pl-10"
                    disabled={isLoading}
                    {...register('firstName', { 
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      },
                      maxLength: {
                        value: 30,
                        message: 'First name cannot exceed 30 characters'
                      },
                      pattern: {
                        value: /^[a-zA-Z\s]+$/,
                        message: 'First name can only contain letters and spaces'
                      }
                    })}
                  />
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    className="bg-chat-input border-border transition-smooth pl-10"
                    disabled={isLoading}
                    {...register('lastName', { 
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      },
                      maxLength: {
                        value: 30,
                        message: 'Last name cannot exceed 30 characters'
                      },
                      pattern: {
                        value: /^[a-zA-Z\s]+$/,
                        message: 'Last name can only contain letters and spaces'
                      }
                    })}
                  />
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-chat-input border-border transition-smooth pl-10"
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
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Info about email-only auth */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Note:</span> This chat app uses email-based authentication. 
                  After creating your account, you'll receive a login link to your email to access the chat.
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-primary hover:underline transition-smooth font-medium"
                  >
                    Sign in instead
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" className="text-primary hover:underline text-xs">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:underline text-xs">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Optional: Add a simple name preview */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            You'll appear as: <span className="font-medium text-foreground">"First Last"</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;