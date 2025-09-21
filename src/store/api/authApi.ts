  import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

  // Updated User interface to match backend model
  export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt?: string; // Optional, not in your current model but might be added
  }

  // Updated LoginRequest to match backend expectations
  export interface LoginRequest {
    email: string;
    // Removed password as backend login doesn't require it
  }

  // Updated SignupRequest to match backend expectations
  export interface SignupRequest {
    firstName: string;
    lastName: string;
    email: string;
    // Removed password as backend signup doesn't require it
  }

  // Updated AuthResponse to match backend response structure
  export interface AuthResponse {
    message: string;
    data: User; // Backend returns user in 'data' field
    token?: string; // Only present in login response
  }

  export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
      baseUrl: 'http://localhost:8000/auth', // Updated to match your route mounting
      prepareHeaders: (headers, { getState }) => {
        // Updated to get token from auth slice state
        const token = (getState() as any).auth?.token;
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    }),
    tagTypes: ['User'],
    endpoints: (builder) => ({
      // Updated login mutation
      login: builder.mutation<AuthResponse, LoginRequest>({
        query: (credentials) => ({
          url: '/login',
          method: 'POST',
          body: credentials,
        }),
        invalidatesTags: ['User'],
      }),
      // Updated signup mutation
      signup: builder.mutation<AuthResponse, SignupRequest>({
        query: (credentials) => ({
          url: '/signup',
          method: 'POST',
          body: credentials,
        }),
        invalidatesTags: ['User'],
      }),
      // Updated logout mutation (if you implement it in backend)
      logout: builder.mutation<void, void>({
        query: () => ({
          url: '/logout',
          method: 'POST',
        }),
        invalidatesTags: ['User'],
      }),
      // Updated getCurrentUser query
      getCurrentUser: builder.query<User, void>({
        query: () => ({
          url: '/me', // You'll need to add this route to backend
          method: 'GET',
        }),
        providesTags: ['User'],
      }),
    }),
  });

  export const {
    useLoginMutation,
    useSignupMutation,
    useLogoutMutation,
    useGetCurrentUserQuery,
  } = authApi;