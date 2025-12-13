
import mongoose, { Schema, Document } from "mongoose";

export interface IVideo extends Document {
    title: string;
    filename: string;
    url: string;
    duration: number; // in seconds
    views: number;
    // Store unique sessions if needed, or just a counter
    // For "Unique view per session", we can't easily store all sessions in valid document if too many.
    // Better: store completion stats separately or simple array if small scale.
    // Or just a view counter, and handle uniqueness in API logic (cookie).
    completionData: number[]; // Array of completion percentages (0-100) or aggregated stats
    createdAt: Date;
}

const VideoSchema: Schema = new Schema({
    title: { type: String, required: false, default: "Untitled Recording" },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    duration: { type: Number, required: true },
    views: { type: Number, default: 0 },
    completionData: { type: [Number], default: [] }, // Store raw % for now to calculate avg
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema);
