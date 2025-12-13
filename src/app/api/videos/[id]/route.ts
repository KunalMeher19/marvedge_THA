import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/models/Video";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();
        const video = await Video.findById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }
        return NextResponse.json({ video });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Function to handle completion Updates
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();
        const body = await req.json();

        if (body.type === 'view') {
            // Increment view
            await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });
            return NextResponse.json({ success: true });
        }

        if (body.type === 'progress') {
            const { progress } = body; // 25, 50, 75, 100
            // For MVP, just push to completionData
            // Ideally we optimize this write
            await Video.findByIdAndUpdate(id, {
                $push: { completionData: progress }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
