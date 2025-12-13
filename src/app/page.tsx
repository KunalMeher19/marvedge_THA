"use client";

import { useState } from "react";
import Recorder from "@/components/Recorder";
import { Film } from "lucide-react";

export default function Home() {
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlob(blob);
    // Switch to editing view (TODO)
    console.log("Recording complete, blob size:", blob.size);
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MarvEdge Recorder</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Placeholder for auth/profile if needed */}
          <div className="text-sm text-gray-400">Assignment MVP</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4">
        {!recordedBlob ? (
          <div className="flex flex-col items-center">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Capture Your Screen
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Record high-quality video with system audio. No installation required.
              </p>
            </div>

            <Recorder onComplete={handleRecordingComplete} />
            {/* Note: Recorder component needs to be updated to accept onRecordingComplete prop 
                or I'll move the state up in the next step. for now, just rendering it.
            */}
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Video Captured!</h2>
            <p className="text-gray-400">Editor coming next...</p>
            {/* Temporary reset for dev */}
            <button
              onClick={() => setRecordedBlob(null)}
              className="mt-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Record Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
