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

    // Video state
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        // Set initial end time when video metadata is loaded
        if (videoRef.current) {
            const url = URL.createObjectURL(inputBlob);
            videoRef.current.src = url;
        }
    }, [inputBlob]);

    const onLoadedMetadata = () => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
            setEndTime(videoRef.current.duration);
        }
    };

    const load = async () => {
        try {
            const ffmpegInstance = await FFmpegService.load();
            setFFmpeg(ffmpegInstance);
            setLoaded(true);
        } catch (e) {
            console.error("Failed to load ffmpeg", e);
        }
    };

    const handleTrim = async () => {
        if (!ffmpeg || !loaded) return;
        setProcessing(true);

        try {
            const inputName = "input.webm";
            const outputName = "output.webm";

            await ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

            // ffmpeg -i input.webm -ss <start> -to <end> -c copy output.webm
            // Note: -c copy is fast but inaccurate for start times (keyframes).
            // For browser MVP, we might re-encode or use fast seek.
            // Trying re-encoding for precision: -c:v libvpx-vp9

            const duration = endTime - startTime;

            await ffmpeg.exec([
                "-i", inputName,
                "-ss", startTime.toString(),
                "-t", duration.toString(),
                "-c", "copy", // Fast, might handle keyframes poorly.
                outputName
            ]);

            const data = await ffmpeg.readFile(outputName);
            const newBlob = new Blob([data as unknown as BlobPart], { type: "video/webm" });

            if (onSave) onSave(newBlob);

        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

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
                            ref={videoRef}
                            controls
                            className="w-full h-full"
                            onLoadedMetadata={onLoadedMetadata}
                        />
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

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
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
            )}
        </div>
    );
}
