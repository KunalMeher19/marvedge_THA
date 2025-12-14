import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IStorageService } from "../storage";

export class CloudflareR2Adapter implements IStorageService {
    private client: S3Client;
    private bucketName: string;
    private publicUrl: string;

    constructor() {
        this.bucketName = process.env.R2_BUCKET_NAME || "";
        this.publicUrl = process.env.R2_PUBLIC_URL || "";

        const endpoint = process.env.R2_ENDPOINT || "";
        const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

        if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucketName || !this.publicUrl) {
            throw new Error("Missing R2 configuration. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL");
        }

        this.client = new S3Client({
            region: "auto",
            endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async upload(file: Blob, filename: string): Promise<string> {
        const buffer = Buffer.from(await file.arrayBuffer());

        // Detect content type based on file extension
        const contentType = this.getContentType(filename);

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: filename,
                Body: buffer,
                ContentType: contentType,
            })
        );

        return `${this.publicUrl}/${filename}`;
    }

    private getContentType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const contentTypes: Record<string, string> = {
            'webm': 'video/webm',
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
            'flv': 'video/x-flv',
        };
        return contentTypes[ext] || 'video/webm';
    }

    getUrl(key: string): string {
        return key.startsWith("http") ? key : `${this.publicUrl}/${key}`;
    }
}
