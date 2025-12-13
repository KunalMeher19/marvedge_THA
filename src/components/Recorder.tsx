"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Pause, Play, Square, Video, Mic } from "lucide-react";

export default function Recorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [duration, setDuration] = useState(0);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [stream]);

    const startRecording = async () => {
        try {
            setPermissionError(null);

            const videoStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true, // Capture system audio
            });

            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true, // Capture microphone
            });

            // Combine streams
            const tracks = [
                ...videoStream.getVideoTracks(),
                ...audioStream.getAudioTracks(),
            ];

            const combinedStream = new MediaStream(tracks);
            setStream(combinedStream);

            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = combinedStream;
            }

            const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: "video/webm; codecs=vp8,opus",
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks((prev) => [...prev, event.data]);
                }
            };

            mediaRecorder.onstop = () => {
                // Cleanup logic will go here (handle stopping tracks)
            };

            mediaRecorder.start(1000); // Collect 1s chunks
            setIsRecording(true);
            setIsPaused(false);

            // Start Timer
            timerIntervalRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);

            // Handle stream stop (user clicks "Stop sharing" native browser UI)
            videoStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

        } catch (err: any) {
            console.error("Error starting recording:", err);
            if (err.name === "NotAllowedError") {
                setPermissionError("Screen recording permission denied. Please allow access to record.");
            } else {
                setPermissionError("Could not start recording. " + err.message);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            setIsRecording(false);
            setIsPaused(false);
            setStream(null);
            // Trigger completion logic (pass blob to parent or state)
        }
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;

        if (isPaused) {
            mediaRecorderRef.current.resume();
            timerIntervalRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
            setIsPaused(false);
        } else {
            mediaRecorderRef.current.pause();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setIsPaused(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-6 w-full max-w-4xl mx-auto">
            {/* ERROR MESSAGE */}
            {permissionError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full text-center">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{permissionError}</span>
                </div>
            )}

            {/* PREVIEW AREA */}
            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-800 group">
                {!isRecording && !recordedChunks.length && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                        <Video className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">Ready to Record</p>
                    </div>
                )}
                <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className={cn("w-full h-full object-cover", !isRecording && "hidden")}
                />

                {/* OVERLAY TIMER */}
                {isRecording && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-mono animate-pulse">
                        🔴 {formatTime(duration)}
                    </div>
                )}
            </div>

            {/* CONTROLS */}
            <div className="flex items-center space-x-6">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        className="flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                        <div className="w-4 h-4 bg-red-white rounded-full mr-2" />
                        Start Recording
                    </button>
                ) : (
                    <>
                        <button
                            onClick={togglePause}
                            className="p-4 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg transition-all"
                            title={isPaused ? "Resume" : "Pause"}
                        >
                            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                        </button>

                        <button
                            onClick={stopRecording}
                            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                            title="Stop Recording"
                        >
                            <Square className="w-6 h-6 fill-current" />
                        </button>
                    </>
                )}
            </div>

            {/* Hints */}
            {!isRecording && (
                <p className="text-sm text-gray-400">
                    Make sure to allow screen and microphone permissions when prompted.
                </p>
            )}
        </div>
    );
}
