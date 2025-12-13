# 🎥 MarvEdge - Screen Recording MVP

A modern, browser-based screen recording application built with Next.js, handling everything from capture to trimming and sharing.

## 🚀 Features

- **Browser-Native Recording**: Capture screen and audio using the MediaRecorder API.
- **Client-Side Editing**: Trim videos directly in the browser using `ffmpeg.wasm`.
- **Instant Sharing**: Upload records and generate public share links.
- **Analytics**: Track video views and watch completion rates.
- **Production-Ready UI**: Clean, aesthetic interface built with Tailwind CSS.

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Video Processing**: FFmpeg.wasm
- **Storage**: Local filesystem (Mocked S3 behavior via abstraction layer)
- **Database**: MongoDB (Mongoose)

## 📂 Project Structure

```bash
.
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # Backend API Routes (Uploads, Analytics)
│   │   ├── share/[id]/     # Public Video Player Page
│   │   └── page.tsx        # Main Recording Interface
│   ├── components/         # React Components
│   │   ├── recorder/       # Recording controls & preview
│   │   ├── editor/         # Video trimmer & FFmpeg logic
│   │   └── ui/             # Reusable UI elements
│   ├── lib/                # Utilities
│   │   ├── ffmpeg.ts       # FFmpeg Singleton & Helpers
│   │   └── db.ts           # Mock Database Logic
│   └── types/              # TS Interfaces
├── public/
│   └── uploads/            # Video storage location
└── README.md
```

## ⚡ Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Open Application**
    Visit `http://localhost:3000` to start recording.

## 📊 Architecture Deep Dive

### Video Pipeline
1.  **Capture**: `navigator.mediaDevices.getDisplayMedia` extracts the stream.
2.  **Container**: The stream is recorded into `Blob` chunks (preferred MIME: `video/webm; codecs=vp8`).
3.  **Processing**: The Blob is passed to `ffmpeg.wasm` for trimming (remuxing) without full re-encoding when possible, or minimal re-encoding for compatibility.
4.  **Upload**: The final `File` is sent via `POST /api/upload` as `multipart/form-data`.
5.  **Storage**: The backend saves the file to disk and records metadata (UUID, duration) to `db.json`.

### Analytics
- **Views**: Incremented on page load (`/share/[id]`). Uses `sessionStorage` to count unique session views.
- **Completion**: The player emits beacons at 25%, 50%, 75%, 100% video progress. The backend updates the average completion percentage.

## 🧠 Product Thinking

This MVP simulates a core Marvedge workflow:
1.  **Record**: User captures a product walkthrough.
2.  **Trim**: Removes unnecessary dead air or setup.
3.  **Share**: Instantly generates a public link for distribution.
4.  **Analyze**: Gains visibility via engagement metrics.

Design decisions were optimized for:
-   **Zero friction**: No signup required to test.
-   **Browser-first**: No heavy desktop software installation.
-   **Speed**: Immediate upload and share capabilities for fast feedback loops.

## 🏗 Architecture Notes

-   **MediaRecorder API**: chosen for native browser capture, reducing dependency overhead.
-   **ffmpeg.wasm**: handles video processing client-side to spare server CPU resources and lower costs.
-   **File-based DB**: selected for portability and simplicity in this MVP, but designed with a service layer that can easily swap to Postgres/SQL.
-   **Storage**: currently local, but the storage interface allows for easy migration to AWS S3 or Cloudflare R2.



---

Built for the MarvEdge Assignment.
