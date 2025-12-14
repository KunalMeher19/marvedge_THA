import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/models/Video";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Connect to DB and get video
        await dbConnect();
        const video = await Video.findById(id);

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Get the video URL (could be R2 or local)
        const videoUrl = video.url;

        // If it's a local URL, serve it directly
        if (videoUrl.startsWith('/')) {
            return NextResponse.redirect(new URL(videoUrl, req.url));
        }

        // If it's an R2 URL, proxy it to avoid CORS issues
        console.log("🎬 Proxying video from:", videoUrl);

        const response = await fetch(videoUrl, {
            headers: {
                'Range': req.headers.get('range') || 'bytes=0-',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
        }

        // Get the response headers
        const contentType = response.headers.get('content-type') || 'video/webm';
        const contentLength = response.headers.get('content-length');
        const contentRange = response.headers.get('content-range');
        const acceptRanges = response.headers.get('accept-ranges') || 'bytes';

        // Create headers for the proxied response
        const headers = new Headers({
            'Content-Type': contentType,
            'Accept-Ranges': acceptRanges,
            'Cache-Control': 'public, max-age=3600',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Resource-Policy': 'cross-origin',
        });

        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        if (contentRange) {
            headers.set('Content-Range', contentRange);
        }

        // Stream the video data
        const videoData = await response.arrayBuffer();

        return new NextResponse(videoData, {
            status: response.status,
            headers,
        });

    } catch (error) {
        console.error("Video proxy error:", error);
        return NextResponse.json(
            { error: "Failed to stream video" },
            { status: 500 }
        );
    }
}
