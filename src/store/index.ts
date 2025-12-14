import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import videoReducer from './slices/videoSlice';
import analyticsReducer from './slices/analyticsSlice';

// Enable Immer support for Map and Set
enableMapSet();

export const store = configureStore({
    reducer: {
        video: videoReducer,
        analytics: analyticsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these paths in the state for serializability checks
                ignoredActions: ['analytics/resetAnalytics'],
                ignoredPaths: ['analytics.trackedMilestones'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
