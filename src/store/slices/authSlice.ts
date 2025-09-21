import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../api/authApi'; // Import User from your updated authApi

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'), // Check if token exists
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Updated to handle both LoginResponse and SignupResponse structures
    setCredentials: (
      state, 
      action: PayloadAction<{ 
        user: User; 
        token?: string; 
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token || localStorage.getItem('token') || null;
      state.isAuthenticated = true;
      
      if (state.token) {
        localStorage.setItem('token', state.token);
      }
    },
    
    // Handle successful login - extract user and token from response
    loginSuccess: (
      state, 
      action: PayloadAction<{ 
        message: string; 
        data: User; 
        token: string 
      }>
    ) => {
      const { data: user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
    },
    
    // Handle successful signup - extract user from response (no token)
    signupSuccess: (
      state, 
      action: PayloadAction<{ 
        message: string; 
        data: User 
      }>
    ) => {
      state.user = action.payload.data;
      state.isAuthenticated = false; // Still need to login after signup
      // Don't store token since signup doesn't return one
    },
    
    // Set user from local storage (for persistence)
    setUserFromStorage: (
      state, 
      action: PayloadAction<User>
    ) => {
      state.user = action.payload;
      state.isAuthenticated = !!state.token;
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    
    // Clear auth state (for error cases)
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { 
  setCredentials, 
  loginSuccess, 
  signupSuccess, 
  setUserFromStorage, 
  logout, 
  clearAuth 
} = authSlice.actions;

export default authSlice.reducer;