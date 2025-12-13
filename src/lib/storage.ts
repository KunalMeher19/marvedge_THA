
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

// Factory or Singleton to get the service
// Allows easy swap to S3Adapter later
export function getStorageService(): IStorageService {
    return new LocalFileSystemAdapter();
}
