import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface IVideoData {
    _id: string;
    title: string;
    url: string;
    filename: string;
    duration: number;
    views: number;
    completionData: number[];
    createdAt: string;
}

interface VideoState {
    currentVideo: IVideoData | null;
    loading: boolean;
    error: string | null;
}

const initialState: VideoState = {
    currentVideo: null,
    loading: false,
    error: null,
};

// Async thunk to fetch video data
export const fetchVideo = createAsyncThunk(
    'video/fetchVideo',
    async (videoId: string) => {
        const response = await fetch(`/api/videos/${videoId}`);
        const data = await response.json();
        if (!data.video) {
            throw new Error('Video not found');
        }
        return data.video as IVideoData;
    }
);

// Async thunk to increment view count
export const incrementViewCount = createAsyncThunk(
    'video/incrementView',
    async (videoId: string) => {
        await fetch(`/api/videos/${videoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'view' }),
        });
    }
);

const videoSlice = createSlice({
    name: 'video',
    initialState,
    reducers: {
        setCurrentVideo: (state, action: PayloadAction<IVideoData>) => {
            state.currentVideo = action.payload;
        },
        updateViews: (state, action: PayloadAction<number>) => {
            if (state.currentVideo) {
                state.currentVideo.views = action.payload;
            }
        },
        updateCompletionData: (state, action: PayloadAction<number[]>) => {
            if (state.currentVideo) {
                state.currentVideo.completionData = action.payload;
            }
        },
        clearCurrentVideo: (state) => {
            state.currentVideo = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVideo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVideo.fulfilled, (state, action) => {
                state.loading = false;
                state.currentVideo = action.payload;
            })
            .addCase(fetchVideo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch video';
            });
    },
});

export const { setCurrentVideo, updateViews, updateCompletionData, clearCurrentVideo } = videoSlice.actions;
export default videoSlice.reducer;
