"use client";

import { useState } from "react";
import Recorder from "@/components/Recorder";
import { Film } from "lucide-react";
import Editor from "@/components/Editor";

export default function Home() {
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlob(blob);
    // Switch to editing view (TODO)
    console.log("Recording complete, blob size:", blob.size);
  };

  const [uploading, setUploading] = useState(false);
  // const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleSave = async (blob: Blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const ext = blob.type.includes("webm") ? "webm" : "mp4";
      const filename = `recording.${ext}`;
      // Explicitly create file to guarantee type and name props
      const file = new File([blob], filename, { type: blob.type });

      console.log("Uploading file:", file.name, file.type, file.size);
      formData.append("file", file);
      // Estimate duration or pass it if Editor provides it
      // For now, simple blob size approximation or we update Editor to pass duration.
      // Let's just send 0 or calculated in backend if possible (backend doesn't fully parse yet).
      // Ideally Editor props should include duration.

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        // setUploadSuccess(data.video.id);
        // Maybe redirect to share page?
        window.location.href = `/share/${data.video.id}`;
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
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
          <div className="flex flex-col items-center w-full relative">
            {uploading && (
              <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-xl font-bold">Uploading...</p>
              </div>
            )}

            <div className="w-full flex justify-center mb-4">
              <a
                href={URL.createObjectURL(recordedBlob)}
                download="raw_recording_debug.webm"
                className="bg-yellow-600 px-4 py-2 rounded text-white text-sm hover:bg-yellow-700"
              >
                DEBUG: Download Raw Recording
              </a>
            </div>

            <Editor
              inputBlob={recordedBlob}
              onSave={handleSave}
              onCancel={() => setRecordedBlob(null)}
            />
          </div>
        )}
      </div>
    </main>
  );
}
