/**
 * The site's renderer: serves pages published from Cee.ms, and the drafts the Cee.ms editor previews.
 * `npm run dev`, with the settings from Cee.ms in `.env` (see `.env.example`).
 */
import path from 'node:path';
import type { ErrorRequestHandler } from 'express';
import { CacheSource, Ceems, type CeemsRequest } from '@nakedcreativity/cee-ms-node';

const root = path.join(__dirname, '..');
const bucket = process.env.CEEMS_BUCKET;

const ceems = new Ceems({
    assets: path.join(root, 'public'),
    viewsPath: path.join(root, 'views'),
    // Published pages are read from the site's bucket once storage is set up in Cee.ms. Until then there is
    // nothing published, and the editor's previews (drafts) are all there is.
    cacheSource: bucket ? CacheSource.S3 : CacheSource.Local,
    cacheBucket: bucket,
    cacheFolder: path.join(root, 'published'),
    customHandler: true,
    // Your own Liquid tags, from src/tags/. See src/tags/reading-time.ts for one to start from:
    // tags: [readingTime],
});

ceems.app.get(/(.*)/, async (req, res, next) => {
    try {
        const page = await ceems.load(req as unknown as CeemsRequest, res, true);
        await ceems.render(page, req as unknown as CeemsRequest, res);
    } catch (error) {
        next(error);
    }
});

/** Nothing published yet (or not this page): say so rather than show an error. */
const notPublished: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const nothingPublished = error?.code === 'ENOENT' || /NoSuchKey|NoSuchBucket/.test(error?.name ?? '');
    if (!nothingPublished && error?.name !== 'NotFoundError') console.error(error);
    res.status(404).send(
        '<!doctype html><title>Not published yet</title><link rel="stylesheet" href="/site.css">' +
            '<main class="mx-auto max-w-2xl px-4 py-24"><h1 class="text-3xl font-bold">Nothing here yet</h1>' +
            `<p class="mt-4 text-slate-600">${
                nothingPublished
                    ? 'Nothing has been published yet. Edit and preview pages in Cee.ms, then publish them once storage is set up.'
                    : 'This page isn’t published.'
            }</p></main>`,
    );
};
ceems.app.use(notPublished);

const port = Number(process.env.PORT || 3000);
ceems.app.listen(port, () => {
    console.log(`Site running on http://localhost:${port}`);
    if (!process.env.CEEMS_PREVIEW_SECRET) {
        console.warn(
            'CEEMS_PREVIEW_SECRET isn’t set: Cee.ms can’t preview pages. Copy it from the site’s setup in Cee.ms into .env.',
        );
    }
});
