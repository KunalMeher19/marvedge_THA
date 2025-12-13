
import { NextRequest, NextResponse } from "next/server";
import { getStorageService } from "@/lib/storage";
import dbConnect from "@/lib/db";
import Video from "@/models/Video";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as Blob | null;
        const durationStr = formData.get("duration") as string; // in seconds

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Connect to DB
        await dbConnect();

        // Get Storage Service
        const storage = getStorageService();

        // Determine extension from original filename (if available) or default to webm
        let extension = "webm";
        if (file instanceof File && file.name) {
            const parts = file.name.split('.');
            if (parts.length > 1) {
                extension = parts.pop() || "webm";
            }
        }

        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        // Upload file
        const url = await storage.upload(file, filename);

        // Save to DB
        const newVideo = await Video.create({
            filename,
            url,
            duration: parseFloat(durationStr) || 0,
            title: "Screen Recording " + new Date().toLocaleString(),
        });

        return NextResponse.json({
            success: true,
            video: { id: newVideo._id, url: newVideo.url }
        });

    } catch (error: unknown) {
        console.error("Upload error:", error);
        // @ts-expect-error - Error is unknown
        return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
    }
}
