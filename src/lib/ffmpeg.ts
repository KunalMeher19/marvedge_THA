
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export class FFmpegService {
    private static instance: FFmpeg;
    private static loaded = false;

    static async getInstance(): Promise<FFmpeg> {
        if (!FFmpegService.instance) {
            FFmpegService.instance = new FFmpeg();
        }
        return FFmpegService.instance;
    }

    static async load() {
        const ffmpeg = await FFmpegService.getInstance();

        if (FFmpegService.loaded) return ffmpeg;

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        FFmpegService.loaded = true;
        return ffmpeg;
    }
}
