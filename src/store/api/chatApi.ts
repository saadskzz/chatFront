// chatApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Updated Message interface to include read status
export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  read?: boolean; // Add this field
  readAt?: string; // Add this field
}

// User interface for sidebar (matching your user model)
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  // Add other user fields as needed
}

// Send message request - matches backend expectations
export interface SendMessageRequest {
  text?: string;
  image?: string;
}

// Get messages request (handled via route params)
export interface GetMessagesRequest {
  receiverId: string;
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8000/messages', // Updated to match your route mounting
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Messages', 'Users'],
  endpoints: (builder) => ({
    // Get users for sidebar (replaces getChats)
    getUsersForSidebar: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['Users'],
    }),
    
    // Get messages between current user and specific receiver
    getMessages: builder.query<Message[], string>({
      query: (receiverId) => `/${receiverId}`,
      providesTags: (_result, _error, receiverId) => [
        { type: 'Messages', id: receiverId },
      ],
    }),
    
    // Send message to specific receiver
    sendMessage: builder.mutation<Message, { receiverId: string; messageData: SendMessageRequest }>({
      query: ({ receiverId, messageData }) => ({
        url: `/send/${receiverId}`,
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: (_result, _error, { receiverId }) => [
        { type: 'Messages', id: receiverId },
        'Users',
      ],
    }),
  }),
});

export const {
  useGetUsersForSidebarQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;