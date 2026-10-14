import { createSlice } from "@reduxjs/toolkit";
import type { CustomerData } from "src/providers/userProvider";

interface UserState {
    isLog: boolean;
    isAuthChecked: boolean;         // 👈
    user: CustomerData | null;      // 👈
    personal: {
        name: string;
        number: string;
        mail: string;
    };
    icon: {
        position: { x: number; y: number };
        imgWidth: number;
        size: number;
    };
    image: {
        src: string;
        size: { width: number; height: number };
    };
}

const initialState: UserState = {
    isLog: false,
    isAuthChecked: false,
    user: null,
    personal: {
        name: "",
        number: "",
        mail: "",
    },
    icon: {
        position: { x: 0, y: 0 },
        imgWidth: 100,
        size: 100,
    },
    image: {
        src: "./public/defLogo.png",
        size: { width: 0, height: 0 },
    },
};

type actionType<T> = { type: string; payload: T };

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setPersonal(state, action: actionType<UserState["personal"]>) {
            state.personal = action.payload;
        },
        setIcon(state, action: actionType<UserState["icon"]>) {
            state.icon = action.payload;
        },
        setImg(state, action: actionType<UserState["image"]>) {
            state.image = action.payload;
        },
        setLog(state, action: actionType<boolean>) {
            state.isLog = action.payload;
        },

        // 👇 новые
        setUser(state, action: actionType<CustomerData>) {
            state.user = action.payload;
            state.isLog = true;
            state.isAuthChecked = true;
        },
        clearUser(state) {
            state.user = null;
            state.isLog = false;
            state.isAuthChecked = true;
        },
    },
});

export const {
    setPersonal,
    setIcon,
    setImg,
    setLog,
    setUser,
    clearUser,
} = userSlice.actions;

export default userSlice.reducer;