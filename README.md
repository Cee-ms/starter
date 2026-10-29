# Cee.ms starter site

A small website to start from, edited in [Cee.ms](https://cee.ms) and rendered by
[`@nakedcreativity/cee-ms-node`](https://www.npmjs.com/package/@nakedcreativity/cee-ms-node). It has one page
layout and four modules (hero, text, image and cards) to build pages from, ready to make your own. It's
written in TypeScript and styled with [Tailwind CSS](https://tailwindcss.com).

## Getting started

Create the site in Cee.ms first (**New site** on the sites screen): its setup checklist has the preview secret
this needs.

```sh
git clone https://github.com/Cee-ms/starter.git my-site
cd my-site
npm install
cp .env.example .env    # then paste in CEEMS_PREVIEW_SECRET from the checklist
npm run dev
```

The site runs on <http://localhost:3000>, rebuilding the CSS and restarting as you change things. Back in Cee.ms, **Connect and read the views**: Cee.ms reads the views
below and adds a template for the layout and a module type for each module. Then make the first page (Home,
with the handle `home`) and edit it: the editor previews it from your computer.

## Views

```
views/
  layouts/default.liquid   templates: where modules go, with {% region main %}
  modules/hero.liquid      module types: the values a module prints are its fields
  modules/text.liquid
  modules/image.liquid
  modules/cards.liquid
  partials/nav.liquid      everything else: the menu, includes
src/
  server.ts                the renderer
  styles.css               Tailwind: theme and plugins; built to public/site.css
  tags/                    your own Liquid tags
public/                    static files, served as they are
```

Style views with Tailwind classes: `src/styles.css` finds them in `views/`. Rich text from Cee.ms is HTML, so
the Text module wraps it in `prose` ([typography plugin](https://github.com/tailwindlabs/tailwindcss-typography)).
`{% image %}` prints a plain `<img>`, styled from its wrapper with arbitrary variants such as `[&_img]:w-full`.

A module's file name is its type in Cee.ms, and a layout's is the template's layout, so rename them before
connecting Cee.ms, not after.

Cee.ms works out each field from how the view uses it: `{% image photo %}` is an image, `href="{{ link }}"` a link,
`{% for card in cards %}` a repeating group, `{% if wide %}` alone a checkbox. Where it would guess wrong, say
so in a comment at the top of the view:

```liquid
{% comment %}
@name Hero
@field intro TEXTBOX Introduction
@field cards.link LINK Link
{% endcomment %}
```

When you add a layout or module, or a module starts to show something new, read the views again in Cee.ms
(Settings → Renderer). That only adds: it never removes fields or changes ones that exist.

Templates and modules can use the site's data too: `page`, `site`, `settings`, `{% navigation %}`,
`{% structureddata %}` and more. See the package's README.

## Your own tags

Put tags in `src/tags/` and register them on the `Ceems` instance in `src/server.ts`.
[`reading-time.ts`](src/tags/reading-time.ts) is one to start from, `{% readingtime body %}`, not yet registered:

```ts
import { readingTime } from './tags/reading-time';

const ceems = new Ceems({
    // ...
    tags: [readingTime],
});
```

## Publishing

Until the site's storage is set up in Cee.ms (Settings → Storage), pages can be edited and previewed, but not
published. Once it is, set `CEEMS_BUCKET` (and AWS credentials that can read it) in `.env`, or in your host's
environment, and the published site is served from the bucket.

`npm run build` compiles to `dist/` and builds the CSS; `npm start` runs it. Deploy it anywhere Node 22 runs: a
container, a server, or AWS Lambda.
