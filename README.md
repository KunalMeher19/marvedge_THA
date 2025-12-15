# 🎥 MarvEdge - Screen Recording MVP

A modern, browser-based screen recording application built with Next.js, handling everything from capture to trimming, sharing, and analytics.

**🌐 Live Demo:** [https://marvedge-tha.vercel.app/](https://marvedge-tha.vercel.app/)

## 🚀 Features

- **Browser-Native Recording**: Capture screen and audio using the MediaRecorder API
- **Client-Side Video Editing**: Trim videos directly in the browser using FFmpeg.wasm
- **Instant Sharing**: Upload recordings and generate public share links
- **Real-Time Analytics**: Track video views and watch completion rates with milestones (25%, 50%, 75%, 100%)
- **Production-Ready Storage**: Cloudflare R2 for scalable video hosting with zero egress fees
- **State Management**: Redux Toolkit for predictable state and data persistence
- **Modern UI**: Clean, aesthetic interface built with Tailwind CSS and Framer Motion

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Lucide React Icons, Framer Motion
- **Video Processing**: FFmpeg.wasm (client-side trimming)
- **Storage**: Cloudflare R2 (Production) / Local Filesystem (Development)
- **Database**: MongoDB Atlas (via Mongoose)
- **State Management**: Redux Toolkit
- **Cloud SDK**: AWS SDK for S3-compatible R2 API
- **Deployment**: Vercel

## 📂 Project Structure

```bash
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Backend API Routes
│   │   │   ├── upload/         # Video upload handler (R2 + MongoDB)
│   │   │   └── videos/
│   │   │       ├── [id]/       # Video metadata API
│   │   │       └── [id]/stream # Video streaming endpoint
│   │   ├── share/[id]/         # Public video player & analytics page
│   │   ├── layout.tsx          # Root layout with Redux provider
│   │   └── page.tsx            # Main recording interface
│   ├── components/
│   │   ├── Recorder.tsx        # Recording controls & preview
│   │   └── Editor.tsx          # Video trimmer & FFmpeg integration
│   ├── lib/
│   │   ├── db.ts               # MongoDB connection helper
│   │   ├── ffmpeg.ts           # FFmpeg singleton & utilities
│   │   ├── storage.ts          # R2/local storage abstraction
│   │   └── utils.ts            # Shared utilities
│   ├── models/
│   │   └── Video.ts            # Mongoose schema for videos
│   └── store/
│       ├── index.ts            # Redux store configuration
│       ├── provider.tsx        # Redux provider wrapper
│       ├── hooks.ts            # Typed Redux hooks
│       └── slices/
│           ├── videoSlice.ts   # Video state & API thunks
│           └── analyticsSlice.ts # Analytics state & tracking
├── public/
│   └── uploads/                # Local video storage (dev only)
├── .env.example                # Environment variables template
├── DEPLOY.md                   # Complete deployment guide
└── README.md                   # This file
```

---

## ⚡ Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB Atlas** account (free tier) - [Sign up here](https://www.mongodb.com/cloud/atlas/register)
- **Cloudflare R2** account (free tier, production only) - [Sign up here](https://dash.cloudflare.com/sign-up)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/KunalMeher19/marvedge_THA.git
   cd marvedge_THA
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   # MongoDB Connection (Required)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/marvedge_mvp

   # Cloudflare R2 (Optional for local dev, uses filesystem fallback)
   R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=your_access_key_here
   R2_SECRET_ACCESS_KEY=your_secret_key_here
   R2_BUCKET_NAME=marvedge-videos
   R2_PUBLIC_URL=https://pub-<bucket-id>.r2.dev

   # Environment
   NODE_ENV=development
   ```

   > **Note**: For local development, videos are stored in `public/uploads/` if R2 credentials are not provided.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Visit [http://localhost:3000](http://localhost:3000) to start recording!

### Production Deployment

For complete step-by-step deployment instructions to Vercel with MongoDB Atlas and Cloudflare R2, see **[DEPLOY.md](./DEPLOY.md)**.

**Deployment cost: $0/month** using free tiers! ✨

---

## 🏗 Architecture Decisions

### 1. **Client-Side Video Processing with FFmpeg.wasm**

**Decision**: Use FFmpeg.wasm for browser-based video trimming instead of server-side processing.

**Rationale**:
- **Cost reduction**: Eliminates need for expensive server CPU resources
- **Scalability**: Processing workload distributed across client devices
- **Speed**: No upload wait time for untrimmed video; trimming happens locally
- **Bandwidth savings**: Only final trimmed video is uploaded

**Trade-offs**:
- Initial FFmpeg.wasm load time (~30MB)
- Requires client with sufficient CPU (acceptable for 2024+ devices)
- Limited to browsers supporting WebAssembly

### 2. **Cloudflare R2 for Video Storage**

**Decision**: Use Cloudflare R2 instead of AWS S3 or other object storage.

**Rationale**:
- **Zero egress fees**: Unlimited free bandwidth for video delivery (AWS S3 charges $0.09/GB)
- **S3-compatible API**: Drop-in replacement using AWS SDK
- **Generous free tier**: 10GB storage + 1M writes + 10M reads/month
- **Global CDN**: Fast video delivery worldwide via Cloudflare's network

**Implementation**:
- Videos uploaded via `PutObjectCommand` (AWS SDK)
- Public bucket URLs served directly to `<video>` elements
- CORS configured for cross-origin streaming

### 3. **Redux Toolkit for State Management**

**Decision**: Implement Redux instead of React Context or server-only state.

**Rationale**:
- **Centralized Analytics**: Track view counts and completion milestones globally
- **Predictable State**: Single source of truth for video metadata
- **DevTools**: Time-travel debugging for complex user flows
- **Async Thunks**: Clean handling of API calls (`fetchVideo`, `incrementViewCount`)

**State Slices**:
- `videoSlice`: Current video, loading, error states
- `analyticsSlice`: Completion percentages, milestones tracking

### 4. **MongoDB Atlas (NoSQL) over SQL**

**Decision**: Use MongoDB instead of PostgreSQL or MySQL.

**Rationale**:
- **Schema flexibility**: Easy to add analytics fields without migrations
- **Free tier**: 512MB free cluster (sufficient for MVP)
- **JSON-native**: Natural fit for JavaScript/TypeScript stack
- **Fast prototyping**: Mongoose schemas iterate faster than SQL DDL

**Schema Design**:
```typescript
Video {
  _id: string (UUID)
  title: string
  url: string (R2 public URL or local path)
  duration: number
  views: number
  analytics: {
    totalCompletions: number
    averageCompletion: number
    milestones: { 25: number, 50: number, 75: number, 100: number }
  }
  createdAt: Date
}
```

### 5. **Streaming API Route Instead of Direct URLs**

**Decision**: Serve videos through `/api/videos/[id]/stream` instead of direct R2 URLs.

**Rationale**:
- **Access control**: Can add authentication/authorization later
- **Range requests**: Proper support for video seeking via `Accept-Ranges` headers
- **Analytics injection**: Track views/completions server-side
- **URL abstraction**: Hide R2 bucket URLs; easy to migrate storage providers

### 6. **Session-Based View Counting**

**Decision**: Use `sessionStorage` to deduplicate views per session.

**Rationale**:
- **Accurate engagement**: Prevents inflated view counts from page refreshes
- **No authentication required**: Works for anonymous users
- **Client-side check**: Reduces unnecessary API calls

---

## 🚀 What I'd Improve for Production

### Security & Authentication

- [ ] **User authentication**: Implement NextAuth.js for user accounts
- [ ] **Video ownership**: Store `userId` in video schema to restrict editing/deletion
- [ ] **Signed R2 URLs**: Replace public bucket URLs with pre-signed URLs (expiring tokens)
- [ ] **Rate limiting**: Add middleware to prevent spam uploads (e.g., `express-rate-limit`)
- [ ] **CSRF protection**: Implement tokens for state-changing API calls

### Performance Optimizations

- [ ] **Lazy-load FFmpeg.wasm**: Only download when user clicks "Trim" button
- [ ] **Video transcoding**: Add server-side transcoding to H.264 for better compatibility
- [ ] **Thumbnail generation**: Create video thumbnails on upload for preview images
- [ ] **CDN caching**: Add `Cache-Control` headers to R2 objects
- [ ] **Database indexing**: Index `createdAt` and `userId` fields in MongoDB

### Analytics Enhancements

- [ ] **Heatmap analytics**: Track which sections of videos are most watched/skipped
- [ ] **Viewer demographics**: IP-based location tracking (with privacy compliance)
- [ ] **A/B testing**: Test different player UIs for engagement
- [ ] **Export reports**: Allow users to download analytics as CSV/PDF

### User Experience

- [ ] **Video annotations**: Add text overlays, arrows, blur tools
- [ ] **Multiple formats**: Support exporting to MP4, GIF, MOV
- [ ] **Video collections**: Allow organizing videos into folders/playlists
- [ ] **Collaborative editing**: Share edit links for team feedback
- [ ] **Webcam overlay**: Picture-in-picture webcam recording

### Infrastructure & Monitoring

- [ ] **Error tracking**: Integrate Sentry for production error monitoring
- [ ] **Logging**: Add structured logging with Pino or Winston
- [ ] **Uptime monitoring**: Set up health check endpoints + alerts (e.g., Uptime Robot)
- [ ] **Load testing**: Simulate concurrent uploads/streams to identify bottlenecks
- [ ] **Backup strategy**: Automated MongoDB backups to S3/Glacier

### Scalability

- [ ] **Queue system**: Use BullMQ/Redis for async video processing jobs
- [ ] **Multi-region storage**: Replicate R2 buckets across regions for low latency
- [ ] **Database sharding**: Partition MongoDB by user ID for horizontal scaling
- [ ] **GraphQL API**: Replace REST with GraphQL for flexible client queries
- [ ] **WebSockets**: Real-time analytics updates for live viewers

### Code Quality

- [ ] **Unit tests**: Jest + React Testing Library for components
- [ ] **E2E tests**: Playwright for critical flows (record → upload → share)
- [ ] **Type safety**: Enable `strict` mode in `tsconfig.json`
- [ ] **API documentation**: Generate OpenAPI spec from Next.js routes
- [ ] **Storybook**: Isolated component development and visual testing

### Compliance & Legal

- [ ] **GDPR compliance**: Add cookie consent, data export/deletion APIs
- [ ] **Content moderation**: AI-based filtering for inappropriate uploads
- [ ] **Terms of Service**: Legal pages for acceptable use
- [ ] **Storage limits**: Enforce per-user quotas to prevent abuse

---

## 📊 Architecture Deep Dive

### Video Pipeline

```mermaid
graph LR
    A[User Browser] -->|getDisplayMedia| B[MediaRecorder API]
    B -->|Blob Chunks| C[WebM Container]
    C -->|User Trims| D[FFmpeg.wasm]
    D -->|Trimmed Blob| E[Upload API]
    E -->|PutObject| F[Cloudflare R2]
    E -->|Save Metadata| G[MongoDB Atlas]
    F -->|Public URL| H[Share Page]
    G -->|Video Info| H
```

**Flow Breakdown**:

1. **Capture**: `navigator.mediaDevices.getDisplayMedia()` streams screen + audio
2. **Record**: `MediaRecorder` API writes stream to Blob chunks (MIME: `video/webm; codecs=vp8`)
3. **Preview**: Blob URL shown in Editor component for scrubbing
4. **Trim** (Optional): FFmpeg.wasm remuxes video without re-encoding (`-c copy` when possible)
5. **Upload**: 
   - `POST /api/upload` receives `multipart/form-data`
   - Server uploads to R2 via AWS SDK `PutObjectCommand`
   - Metadata saved to MongoDB (ID, URL, duration, views=0)
6. **Share**: Redirect to `/share/[id]` with public R2 URL

### Analytics System

**View Tracking**:
- Incremented on page load of `/share/[id]`
- `sessionStorage` key `viewed_{id}` prevents double-counting

**Completion Tracking**:
```typescript
// Client-side (share page)
video.addEventListener('timeupdate', () => {
  const progress = (currentTime / duration) * 100;
  if (progress >= 25 && !tracked[25]) {
    dispatch(trackProgressMilestone({ videoId, progress: 25 }));
  }
  // Repeat for 50, 75, 100...
});
```

- Milestones stored in Redux `analyticsSlice`
- `POST /api/analytics` updates MongoDB aggregates
- Share page displays:
  - **Average Completion**: Mean of all sessions' max progress
  - **Completion Distribution**: Histogram (0-25%, 25-50%, etc.)

---

## 🧠 Product Thinking

This MVP simulates a core MarvEdge workflow optimized for **zero-friction product demos**:

1. **Record**: User captures a product walkthrough (no setup, no desktop app)
2. **Trim**: Removes awkward pauses or mistakes (instant feedback loop)
3. **Share**: Generate a link in <10 seconds (faster than uploading to YouTube/Loom)
4. **Analyze**: See which parts viewers engage with (validate messaging effectiveness)

### Design Decisions

- **No signup required**: Reduces friction for first-time users (can add auth later)
- **Browser-first**: Works on any device with Chrome/Edge (no macOS/Windows lock-in)
- **Instant uploads**: Trimmed WebM format maximizes speed over universal compatibility
- **Public by default**: Share links work immediately (private links = future feature)

---

## 🎯 Assignment Requirements Met

✅ **Screen recording functionality** (MediaRecorder API)  
✅ **Video editing/trimming** (FFmpeg.wasm)  
✅ **Upload and storage** (Cloudflare R2 + MongoDB)  
✅ **Share links** (Dynamic routes `/share/[id]`)  
✅ **Analytics** (View counts + completion tracking)  
✅ **State management** (Redux Toolkit)  
✅ **Production deployment** (Vercel + free tier services)

---

## 📚 Additional Resources

- **[Complete Deployment Guide](./DEPLOY.md)** - Step-by-step production setup
- **[Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)** - Object storage API reference
- **[FFmpeg.wasm Guide](https://ffmpegwasm.netlify.app/)** - Browser video processing
- **[MongoDB Atlas Free Tier](https://www.mongodb.com/docs/atlas/billing/free-tier/)** - Database limits

---

## 🤝 Contributing

This is an assignment project, but feel free to:
- Report bugs via GitHub Issues
- Suggest features in Discussions
- Fork and experiment!

---

## 📜 License

MIT License - Built for the MarvEdge Technical Assignment

---

**Built with ❤️ by Kunal Meher**  
**Live Demo**: [https://marvedge-tha.vercel.app/](https://marvedge-tha.vercel.app/)
