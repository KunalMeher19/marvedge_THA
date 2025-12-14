"use client";

import { useEffect, useRef } from "react";
import { Copy, Eye, CheckCircle, BarChart3, TrendingUp } from "lucide-react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVideo, incrementViewCount } from "@/store/slices/videoSlice";
import { trackProgressMilestone, addTrackedMilestone, selectAverageCompletion, selectCompletionStats } from "@/store/slices/analyticsSlice";
import { useState } from "react";

export default function VideoPage() {
    const params = useParams();
    const id = params?.id as string;
    const dispatch = useAppDispatch();

    // Redux state
    const { currentVideo, loading, error } = useAppSelector((state) => state.video);
    const averageCompletion = useAppSelector(selectAverageCompletion);
    const completionStats = useAppSelector(selectCompletionStats);
    const trackedMilestones = useAppSelector((state) => state.analytics.trackedMilestones);

    const [copied, setCopied] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!id) return;

        // Fetch video data into Redux store
        dispatch(fetchVideo(id));

        // Count view (once per session)
        const viewedKey = `viewed_${id}`;
        if (!sessionStorage.getItem(viewedKey)) {
            dispatch(incrementViewCount(id));
            sessionStorage.setItem(viewedKey, 'true');
        }

    }, [id, dispatch]);

    const handleTimeUpdate = () => {
        if (!videoRef.current || !id) return;

        const { currentTime, duration } = videoRef.current;
        if (!duration) return;

        const percent = (currentTime / duration) * 100;

        const milestones = [25, 50, 75, 100];

        milestones.forEach(m => {
            if (percent >= m && !trackedMilestones.has(m)) {
                dispatch(addTrackedMilestone(m));
                dispatch(trackProgressMilestone({ videoId: id, progress: m }));
            }
        });
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Error: {error}</div>;
    if (!currentVideo) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Video not found</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{currentVideo.title}</h1>
                        <p className="text-gray-400 text-sm">
                            Recorded on {new Date(currentVideo.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full text-sm">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span>{currentVideo.views} views</span>
                        </div>

                        <button
                            onClick={copyLink}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied!" : "Share Video"}
                        </button>
                    </div>
                </div>

                {/* Player */}
                <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
                    <video
                        ref={videoRef}
                        src={currentVideo.url}
                        controls
                        className="w-full h-full"
                        onTimeUpdate={handleTimeUpdate}
                    />
                </div>

                {/* Analytics Section */}
                {completionStats.totalCompletions > 0 && (
                    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 space-y-6">
                        <div className="flex items-center gap-2 text-lg font-bold">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            Watch Analytics
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    Average Completion
                                </div>
                                <div className="text-3xl font-bold text-blue-400">
                                    {averageCompletion}%
                                </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <div className="text-sm text-gray-400 mb-1">Total Watch Sessions</div>
                                <div className="text-3xl font-bold text-green-400">
                                    {completionStats.totalCompletions}
                                </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <div className="text-sm text-gray-400 mb-1">Completed Views (100%)</div>
                                <div className="text-3xl font-bold text-purple-400">
                                    {completionStats.completeViews}
                                </div>
                            </div>
                        </div>

                        {/* Completion Distribution */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-3">Completion Distribution</h3>
                            <div className="space-y-3">
                                {Object.entries(completionStats.distribution).map(([range, count]) => {
                                    const percentage = completionStats.totalCompletions > 0
                                        ? (count / completionStats.totalCompletions) * 100
                                        : 0;
                                    return (
                                        <div key={range}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-400">{range}</span>
                                                <span className="text-gray-300">{count} views ({percentage.toFixed(0)}%)</span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 border-t border-gray-800 pt-3">
                            💡 Analytics track viewer engagement at 25%, 50%, 75%, and 100% completion milestones.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
