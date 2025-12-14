
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

export interface IStorageService {
    upload(file: Blob, filename: string): Promise<string>;
    getUrl(key: string): string;
}

export class LocalFileSystemAdapter implements IStorageService {
    private uploadDir: string;

    constructor() {
        this.uploadDir = path.join(process.cwd(), "public", "uploads");
        // Ensure directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async upload(file: Blob, filename: string): Promise<string> {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(this.uploadDir, filename);
        await writeFile(filePath, buffer);
        return `/uploads/${filename}`;
    }

    getUrl(key: string): string {
        return key.startsWith("/") ? key : `/${key}`;
    }
}

// Factory to get the appropriate storage service
export function getStorageService(): IStorageService {
    // Use Cloudflare R2 in production when configured
    if (process.env.NODE_ENV === 'production' && process.env.R2_ENDPOINT) {
        try {
            // Dynamic import to avoid loading R2 adapter in development
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { CloudflareR2Adapter } = require('./storage/r2');
            console.log('📦 Using Cloudflare R2 for video storage');
            return new CloudflareR2Adapter();
        } catch (error) {
            console.error('❌ Failed to load R2 adapter:', error);
            console.warn('⚠️  Falling back to local filesystem storage');
            return new LocalFileSystemAdapter();
        }
    }

    // Use local filesystem in development or when R2 is not configured
    console.log('💾 Using local filesystem for video storage (development mode)');
    return new LocalFileSystemAdapter();
}
