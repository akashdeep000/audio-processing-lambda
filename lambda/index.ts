import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { uid } from 'uid';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough, Readable } from 'node:stream';
import { mkdir } from 'node:fs/promises';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from "@aws-sdk/lib-storage";
import { createWriteStream } from 'node:fs';

const app = new Hono()
ffmpeg.setFfmpegPath("/opt/bin/ffmpeg")

const s3Client = new S3Client({});
const bucketName = process.env.BUCKET_NAME;

const concatSchema = z.object({
    urls: z.array(z.string().url()).min(2),
    requestId: z.string().optional()
})

const transcodeSchema = z.object({
    url: z.string().url(),
    requestId: z.string().optional()
})


app.get('/', (c) => c.json({
    success: true,
    message: 'Service running'
}))

app.post('/concat', zValidator('json', concatSchema), async (c) => {
    const { urls: inputUrls, requestId = uid() } = c.req.valid("json");

    try {
        console.log({ inputUrls, requestId })
        const dir = `/tmp/${requestId + uid()}`;
        await mkdir(dir, { recursive: true });

        const outputPath = `ffmpeg/temp/${requestId}/${uid(16)}.ogg`

        const inputFiles = await Promise.all(inputUrls.map((url, index) => {
            return new Promise<string>(async (resolve, reject) => {
                const filePath = `${dir}/input_${index}`;
                const res = await fetch(url);
                if (!res.ok || !res.body) {
                    throw new Error('Failed to download input audio: ' + url);
                }
                //@ts-ignore
                const inputStream = Readable.from(res.body)
                const outputStream = createWriteStream(filePath);
                inputStream.pipe(outputStream);
                inputStream.on('end', () => {
                    resolve(filePath);
                });
                inputStream.on('error', reject);
            });
        }));

        const s3Res = await concatAudios(inputFiles, outputPath)
        return c.json({
            success: true,
            requestId: requestId,
            url: s3Res.Location 
        })
    } catch (error) {
        console.error(error)
        return c.json({
            success: false,
            requestId: requestId,
            message: 'Transcode failed',
            error: error
        }, {status: 400})
    }
})

app.post('/transcode', zValidator('json', transcodeSchema), async (c) => {
    const { url: inputUrl, requestId = uid(16) } = c.req.valid("json");
    try {
        console.log({ inputUrl, requestId })
        const outputPath = `ffmpeg/temp/${requestId}/${uid(16)}.ogg`
        const res = await fetch(inputUrl);
        if (!res.ok || !res.body) {
            return c.json({
                success: false,
                requestId: requestId,
                message: 'Failed to download input audio'
            }, {status: 400})
        }

        //@ts-ignore
        const inputStream = Readable.from(res.body)

        const s3Res = await transcodeToOgg(inputStream, outputPath)
        return c.json({
            success: true,
            requestId: requestId,
            url: s3Res.Location
        })
    } catch (error) {
        console.error(error)
        return c.json({
            success: false,
            requestId: requestId,
            message: 'Transcode failed',
            error: error
        }, {status: 400})
    }
})


const transcodeToOgg = async (inputStream: Readable, outputPath: string) => {
    try {
        const passThroughStream = new PassThrough();
        const uploadToS3 = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: outputPath,
                Body: passThroughStream,
            },
        });

        // Use fluent-ffmpeg to transcode the audio
        ffmpeg(inputStream)
            .audioCodec('libopus')
            .format('ogg')
            .withAudioCodec("libopus")
            .on('error', (err) => {
                console.error('An error occurred:', err.message);
            })
            .on('end', () => {
                console.log('Transcoding completed successfully!');
            })
            .pipe(passThroughStream);

        const s3Res = await uploadToS3.done();
        return s3Res;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const concatAudios = async (inputFiles: string[], outputPath: string) => {
    try {
        const passThroughStream = new PassThrough();
        const uploadToS3 = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: outputPath,
                Body: passThroughStream,
            },
        });

        // Use fluent-ffmpeg to concatenate the audio streams
        const command = ffmpeg()

        inputFiles.forEach((file) => {
            command.addInput(file);
        });

        command
            .audioCodec('libopus')
            .format('ogg')
            .withAudioCodec("libopus")
            .on('error', (err) => {
                console.error(err);
                throw err
            })
            .on('end', () => {
                console.log('Concatenation completed successfully!');
            })
            .concat(passThroughStream);
        const s3Res = await uploadToS3.done();
        return s3Res;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const handler = handle(app)