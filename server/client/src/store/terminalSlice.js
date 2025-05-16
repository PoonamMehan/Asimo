import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    terminalInst: null
}

const terminalSlice = createSlice({
    name: "terminalSlice",
    initialState: initialState,
    reducers: {
        setTerminalInst: (state, action) => {
            state.terminalInst = action.payload
        }
    }
})

export default terminalSlice.reducer;
export const {setTerminalInst} = terminalSlice.actions;