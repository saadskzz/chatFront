import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderUsername: string;
  senderAvatar?: string;
  chatId: string;
  timestamp: string;
  edited?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/chat',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Chat', 'Message'],
  endpoints: (builder) => ({
    getChats: builder.query<Chat[], void>({
      query: () => '/chats',
      providesTags: ['Chat'],
    }),
    getMessages: builder.query<Message[], string>({
      query: (chatId) => `/chats/${chatId}/messages`,
      providesTags: (_result, _error, chatId) => [
        { type: 'Message', id: chatId },
      ],
    }),
    sendMessage: builder.mutation<Message, SendMessageRequest>({
      query: ({ chatId, content }) => ({
        url: `/chats/${chatId}/messages`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: 'Message', id: chatId },
        'Chat',
      ],
    }),
    createChat: builder.mutation<Chat, { name: string; participants: string[] }>({
      query: (chatData) => ({
        url: '/chats',
        method: 'POST',
        body: chatData,
      }),
      invalidatesTags: ['Chat'],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateChatMutation,
} = chatApi;