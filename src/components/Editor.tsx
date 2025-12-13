"use client";

import { useEffect, useRef, useState } from "react";
import { FFmpegService } from "@/lib/ffmpeg";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { Loader2, Scissors, Save } from "lucide-react";

interface EditorProps {
    inputBlob: Blob;
    onSave?: (blob: Blob) => void;
    onCancel?: () => void;
}

export default function Editor({ inputBlob, onSave, onCancel }: EditorProps) {
    const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);

    // Video state
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        // ✅ CRITICAL FIX: Wait for BOTH inputBlob AND loaded state
        // The video element only renders after FFmpeg loads (loaded=true)
        // So videoRef.current will be null until FFmpeg is ready
        if (videoRef.current && inputBlob && loaded) {
            console.log("📹 Editor received blob:", {
                size: inputBlob.size,
                type: inputBlob.type,
                sizeInMB: (inputBlob.size / 1024 / 1024).toFixed(2) + " MB"
            });

            // ✅ FIX: Normalize MIME type - remove codec specification for video element
            // Some browsers can't play "video/webm; codecs=vp9,opus" in video element
            // but can play "video/webm"
            const normalizedBlob = inputBlob.type.includes("webm")
                ? new Blob([inputBlob], { type: "video/webm" })
                : inputBlob;

            console.log("🔄 Normalized blob type:", normalizedBlob.type);

            const url = URL.createObjectURL(normalizedBlob);

            console.log("🎬 Video src set to:", url);
            console.log("📺 Video element exists:", !!videoRef.current);
            console.log("📺 Video element state before:", {
                readyState: videoRef.current.readyState,
                networkState: videoRef.current.networkState,
                currentSrc: videoRef.current.currentSrc
            });

            videoRef.current.src = url;

            console.log("📺 Video element state after src set:", {
                src: videoRef.current.src,
                readyState: videoRef.current.readyState,
                networkState: videoRef.current.networkState
            });

            // Force load
            videoRef.current.load();

            console.log("🔄 Called video.load()");

            // Cleanup function for object URL
            return () => {
                console.log("🧹 Cleaning up blob URL:", url);
                URL.revokeObjectURL(url);
            };
        } else {
            console.warn("⚠️ videoRef or inputBlob or loaded missing:", {
                hasVideoRef: !!videoRef.current,
                hasBlob: !!inputBlob,
                isLoaded: loaded
            });
        }
    }, [inputBlob, loaded]); // ✅ Added 'loaded' dependency!

    const onLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            console.log("✅ Metadata loaded! Duration:", dur + "s");

            if (isFinite(dur) && dur > 0) {
                setVideoDuration(dur);
                setEndTime(dur);
                console.log("📊 Video is ready for editing!");
            } else {
                console.error("⚠️ Invalid duration:", dur);

                // ✅ WORKAROUND: For WebM videos with Infinity duration
                // Seek to end to force browser to calculate duration
                if (dur === Infinity || !isFinite(dur)) {
                    console.log("🔄 Attempting to fix Infinity duration by seeking...");

                    // Listen for seeked event
                    const handleSeeked = () => {
                        if (videoRef.current) {
                            const actualDuration = videoRef.current.currentTime;
                            console.log("✅ Found actual duration:", actualDuration + "s");

                            if (actualDuration > 0) {
                                setVideoDuration(actualDuration);
                                setEndTime(actualDuration);

                                // Reset to beginning
                                videoRef.current.currentTime = 0;
                                console.log("📊 Video is ready for editing!");
                            }

                            videoRef.current.removeEventListener('seeked', handleSeeked);
                        }
                    };

                    videoRef.current.addEventListener('seeked', handleSeeked);

                    // Seek to a very large time - browser will clamp to actual end
                    videoRef.current.currentTime = 1e10; // 10 billion seconds
                }
            }
        }
    };

    // Add error handler
    const onError = () => {
        const error = videoRef.current?.error;
        console.error("❌ Video player error:", {
            code: error?.code,
            message: error?.message,
            MEDIA_ERR_ABORTED: error?.code === 1,
            MEDIA_ERR_NETWORK: error?.code === 2,
            MEDIA_ERR_DECODE: error?.code === 3,
            MEDIA_ERR_SRC_NOT_SUPPORTED: error?.code === 4,
        });

        setErrorMsg(`Video Error Code ${error?.code}: ${error?.message || "Unknown error"}`);
    };

    const load = async () => {
        try {
            const ffmpegInstance = await FFmpegService.load();

            ffmpegInstance.on("log", ({ message }) => {
                console.log("[FFmpeg]", message);
            });

            setFFmpeg(ffmpegInstance);
            setLoaded(true);
        } catch (e) {
            console.error("Failed to load ffmpeg", e);
        }
    };

    const handleTrim = async () => {
        if (!ffmpeg || !loaded) return;

        // Validation
        if (endTime <= startTime || endTime === 0) {
            alert("Invalid trim duration. Please adjust the sliders.");
            return;
        }

        setProcessing(true);

        try {
            const inputName = "input.webm";
            await ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

            console.log("Starting trim with stream copy...", startTime, endTime);

            await ffmpeg.exec([
                "-i", inputName,
                "-ss", startTime.toString(),
                "-to", endTime.toString(),
                "-c", "copy",
                "output.webm"
            ]);

            const data = await ffmpeg.readFile("output.webm");
            const newBlob = new Blob([data as unknown as BlobPart], { type: "video/webm" });

            // ✅ DEBUG: Log trimmed blob properties
            console.log("✂️ Trimmed blob:", newBlob.size, newBlob.type);

            // Store trimmed blob for download test
            setTrimmedBlob(newBlob);

            if (onSave) onSave(newBlob);
        } catch (err) {
            console.error("Trim error:", err);
            // Fallback: If strict copy fails (rare keyframe issues), try re-encode with VP8 (supported)
            try {
                console.warn("Copy failed, attempting VP8 re-encode...");
                await ffmpeg.exec([
                    "-i", "input.webm",
                    "-ss", startTime.toString(),
                    "-to", endTime.toString(),
                    "-c:v", "libvpx",
                    "-c:a", "libvorbis",
                    "output.webm"
                ]);
                const data = await ffmpeg.readFile("output.webm");
                const newBlob = new Blob([data as unknown as BlobPart], { type: "video/webm" });

                // ✅ DEBUG: Log trimmed blob properties (retry path)
                console.log("✂️ Trimmed blob (retry):", newBlob.size, newBlob.type);

                // Store trimmed blob for download test
                setTrimmedBlob(newBlob);

                if (onSave) onSave(newBlob);
            } catch (retryErr) {
                console.error("Retry failed:", retryErr);
                alert("Could not trim video. Please try recording again.");
            }
        } finally {
            setProcessing(false);
        }
    };

    // Check for SharedArrayBuffer support (needed for FFmpeg)
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
            console.warn("SharedArrayBuffer is not available. COOP/COEP headers required.");
        }
    }, []);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 rounded-xl border border-gray-800">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-blue-400" />
                Edit Video
            </h3>

            {!loaded ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-gray-400">Loading Video Engine...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                            key={inputBlob.size} // Force re-render on new blob
                            ref={videoRef}
                            controls
                            playsInline
                            muted
                            preload="auto"
                            className="w-full h-full"
                            onLoadedMetadata={onLoadedMetadata}
                            onLoadStart={() => console.log("🎥 onLoadStart - Video started loading")}
                            onLoadedData={() => console.log("📦 onLoadedData - First frame loaded")}
                            onCanPlay={() => console.log("▶️ onCanPlay - Video can start playing")}
                            onCanPlayThrough={() => console.log("✨ onCanPlayThrough - Video can play without buffering")}
                            onError={() => {
                                onError();
                            }}
                            onWaiting={() => console.log("⏳ onWaiting - Waiting for data")}
                            onSuspend={() => console.log("⏸️ onSuspend - Loading suspended")}
                            onStalled={() => console.log("🛑 onStalled - Loading stalled")}
                        />
                        {errorMsg && (
                            <div className="absolute top-0 left-0 bg-red-600/90 text-white p-2 text-xs">
                                {errorMsg}
                            </div>
                        )}
                    </div>

                    {/* Timeline UI */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Start: {startTime.toFixed(1)}s</span>
                            <span>End: {endTime.toFixed(1)}s</span>
                        </div>

                        {/* Simple dual-range inputs mocking a timeline */}
                        <div className="relative h-2 bg-gray-700 rounded-full">
                            {/* This is a simplified visual. In production use a real dual-slider library or component. */}
                            <div
                                className="absolute h-full bg-blue-500 rounded-full"
                                style={{
                                    left: `${(startTime / videoDuration) * 100}%`,
                                    width: `${((endTime - startTime) / videoDuration) * 100}%`
                                }}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400">Trim Start</label>
                                <input
                                    type="range"
                                    min={0}
                                    max={videoDuration}
                                    step={0.1}
                                    value={startTime}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (val < endTime) setStartTime(val);
                                    }}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-400">Trim End</label>
                                <input
                                    type="range"
                                    min={0}
                                    max={videoDuration}
                                    step={0.1}
                                    value={endTime}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (val > startTime) setEndTime(val);
                                    }}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                        {/* DEBUG: Download trimmed blob before upload */}
                        <button
                            onClick={() => {
                                if (!trimmedBlob) {
                                    alert("Please trim the video first by clicking 'Save Changes'");
                                    return;
                                }
                                const a = document.createElement("a");
                                a.href = URL.createObjectURL(trimmedBlob);
                                a.download = "test-trimmed.webm";
                                a.click();
                                // Clean up URL after download
                                setTimeout(() => URL.revokeObjectURL(a.href), 100);
                            }}
                            disabled={!trimmedBlob}
                            className="text-xs text-yellow-500 hover:text-yellow-400 underline disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download the trimmed video to test it before upload"
                        >
                            🧪 Download Test Before Upload
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTrim}
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
