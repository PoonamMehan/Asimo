import { configureStore } from "@reduxjs/toolkit";
import filesAndFoldersSlice from './filesAndFoldersSlice';
import terminalReducer from './terminalSlice';

const store = configureStore({
    reducer: {
        filesAndFolders: filesAndFoldersSlice,
        terminalInstStore: terminalReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
})


export default store;