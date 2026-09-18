import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.error = null
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const { setUser, setTokens, logout, setError, clearError } = authSlice.actions
export default authSlice.reducer
