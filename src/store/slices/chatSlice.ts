import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  activeChatId: string | null;
  isTyping: boolean;
  typingUsers: string[];
}

const initialState: ChatState = {
  activeChatId: null,
  isTyping: false,
  typingUsers: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string>) => {
      state.activeChatId = action.payload;
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    addTypingUser: (state, action: PayloadAction<string>) => {
      if (!state.typingUsers.includes(action.payload)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action: PayloadAction<string>) => {
      state.typingUsers = state.typingUsers.filter(
        userId => userId !== action.payload
      );
    },
  },
});

export const { 
  setActiveChat, 
  setTyping, 
  addTypingUser, 
  removeTypingUser 
} = chatSlice.actions;
export default chatSlice.reducer;