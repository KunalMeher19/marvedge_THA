import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';

interface AnalyticsState {
    trackedMilestones: Set<number>;
    currentProgress: number;
}

const initialState: AnalyticsState = {
    trackedMilestones: new Set(),
    currentProgress: 0,
};

// Async thunk to track progress milestone
export const trackProgressMilestone = createAsyncThunk(
    'analytics/trackProgress',
    async ({ videoId, progress }: { videoId: string; progress: number }) => {
        await fetch(`/api/videos/${videoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'progress', progress }),
        });
        return progress;
    }
);

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        setProgress: (state, action: PayloadAction<number>) => {
            state.currentProgress = action.payload;
        },
        addTrackedMilestone: (state, action: PayloadAction<number>) => {
            state.trackedMilestones.add(action.payload);
        },
        resetAnalytics: (state) => {
            state.trackedMilestones = new Set();
            state.currentProgress = 0;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(trackProgressMilestone.fulfilled, (state, action) => {
            state.trackedMilestones.add(action.payload);
        });
    },
});

// Selectors
export const selectAverageCompletion = (state: RootState): number => {
    const completionData = state.video.currentVideo?.completionData || [];
    if (completionData.length === 0) return 0;

    const sum = completionData.reduce((acc: number, val: number) => acc + val, 0);
    return Math.round(sum / completionData.length);
};

export const selectCompletionStats = (state: RootState) => {
    const completionData = state.video.currentVideo?.completionData || [];

    return {
        totalCompletions: completionData.length,
        averageCompletion: selectAverageCompletion(state),
        completeViews: completionData.filter((val: number) => val === 100).length,
        distribution: {
            '0-25%': completionData.filter((val: number) => val > 0 && val <= 25).length,
            '25-50%': completionData.filter((val: number) => val > 25 && val <= 50).length,
            '50-75%': completionData.filter((val: number) => val > 50 && val <= 75).length,
            '75-100%': completionData.filter((val: number) => val > 75 && val <= 100).length,
        },
    };
};

export const { setProgress, addTrackedMilestone, resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
