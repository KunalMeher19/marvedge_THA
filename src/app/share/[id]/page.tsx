"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, Eye, CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";

interface IVideoData {
    _id: string;
    title: string;
    url: string;
    views: number;
    createdAt: string;
}

export default function VideoPage() {
    const params = useParams();
    const id = params?.id as string;
    const [video, setVideo] = useState<IVideoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef(new Set<number>()); // Track reported milestones

    useEffect(() => {
        if (!id) return;

        async function fetchVideo() {
            try {
                const res = await fetch(`/api/videos/${id}`);
                const data = await res.json();
                if (data.video) {
                    setVideo(data.video);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchVideo();

        // Count view (once per session)
        const viewedKey = `viewed_${id}`;
        if (!sessionStorage.getItem(viewedKey)) {
            fetch(`/api/videos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'view' })
            });
            sessionStorage.setItem(viewedKey, 'true');
        }

    }, [id]);

    const handleTimeUpdate = () => {
        if (!videoRef.current || !id) return;

        const { currentTime, duration } = videoRef.current;
        if (!duration) return;

        const percent = (currentTime / duration) * 100;

        const milestones = [25, 50, 75, 100];

        milestones.forEach(m => {
            if (percent >= m && !progressRef.current.has(m)) {
                progressRef.current.add(m);
                // Send Beacon
                fetch(`/api/videos/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'progress', progress: m })
                });
            }
        });
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
    if (!video) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Video not found</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{video.title}</h1>
                        <p className="text-gray-400 text-sm">
                            Recorded on {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full text-sm">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span>{video.views + (sessionStorage.getItem(`viewed_${id}`) ? 0 : 0)} views</span>
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
                        src={video.url}
                        controls
                        className="w-full h-full"
                        onTimeUpdate={handleTimeUpdate}
                    />
                </div>
            </div>
        </div>
    );
}
