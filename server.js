/**
 * The site's renderer: serves pages published from Cee.ms, and the drafts the Cee.ms editor previews.
 * `npm run dev`, with the settings from Cee.ms in `.env` (see `.env.example`).
 */
const path = require('path');
const { CacheSource, Ceems } = require('@nakedcreativity/cee-ms-node');

const bucket = process.env.CEEMS_BUCKET;

const ceems = new Ceems({
    assets: path.join(__dirname, 'public'),
    viewsPath: path.join(__dirname, 'views'),
    // Published pages are read from the site's bucket once storage is set up in Cee.ms. Until then there is
    // nothing published, and the editor's previews (drafts) are all there is.
    cacheSource: bucket ? CacheSource.S3 : CacheSource.Local,
    cacheBucket: bucket,
    cacheFolder: path.join(__dirname, 'published'),
    customHandler: true,
});

ceems.app.get(/(.*)/, async (req, res, next) => {
    try {
        const page = await ceems.load(req, res, true);
        await ceems.render(page, req, res);
    } catch (error) {
        next(error);
    }
});

// Nothing published yet (or the page isn't): say so rather than show an error.
ceems.app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const nothingPublished = error && error.code === 'ENOENT' || /NoSuchKey|NoSuchBucket/.test(error && error.name);
    if (!nothingPublished && !(error && error.name === 'NotFoundError')) console.error(error);
    res.status(404).send(
        `<!doctype html><title>Not published yet</title><link rel="stylesheet" href="/site.css">` +
            `<main class="container section"><h1>Nothing here yet</h1>` +
            `<p>${nothingPublished ? 'Nothing has been published yet. Edit and preview pages in Cee.ms, then publish them once storage is set up.' : 'This page isn’t published.'}</p></main>`,
    );
});

const port = Number(process.env.PORT || 3000);
ceems.app.listen(port, () => {
    console.log(`Site running on http://localhost:${port}`);
    if (!process.env.CEEMS_PREVIEW_SECRET) {
        console.warn('CEEMS_PREVIEW_SECRET isn’t set: Cee.ms can’t preview pages. Copy it from the site’s setup in Cee.ms into .env.');
    }
});
