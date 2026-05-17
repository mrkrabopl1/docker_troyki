// store/reducers/authSlice.ts
import { createSlice } from "@reduxjs/toolkit";

interface AdminUser {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'superadmin';
    permissions: string[];
}

interface AuthState {
    user: AdminUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    error: null
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setLoading(state, action) {
            state.isLoading = action.payload;
        },
        setAuthenticated(state, action) {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.isInitialized = true;
            state.error = null;
        },
        setAuthError(state, action) {
            state.error = action.payload;
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
        },
        logout(state) {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        setInitialized(state) {
            state.isLoading = false;
            state.isInitialized = true;
            state.isAuthenticated = false;
        },
        clearError(state) {
            state.error = null;
        }
    }
});

export const { 
    setLoading, 
    setAuthenticated, 
    setAuthError, 
    logout, 
    setInitialized,
    clearError 
} = authSlice.actions;

export default authSlice.reducer;