import type { Ceems, LiquidTag } from '@nakedcreativity/cee-ms-node';

const WORDS_PER_MINUTE = 220;

/**
 * An example tag: `{% readingtime body %}` prints how long a value takes to read, such as `3 min read`.
 *
 * A tag has a `name` (what templates write after `{%`) and `register`, which is given the site's `Ceems`
 * instance and returns liquidjs's tag options: `parse` reads the tag's arguments once, when the template is
 * loaded, and `render` works out the output each time it renders. Keep per-render data off `this`: one
 * parsed tag serves every request.
 *
 * It isn't used yet. To use it, register it in src/server.ts:
 *
 *     import { readingTime } from './tags/reading-time';
 *
 *     const ceems = new Ceems({
 *         ...
 *         tags: [readingTime],
 *     });
 *
 * Then in a view: `<p>{% readingtime body %}</p>`.
 *
 * Cee.ms reads views to suggest module fields, but not your own tags' arguments. If a module's value is only
 * used by a tag like this, name it with an annotation so it still becomes a field:
 * `{% comment %}@field body RICH_TEXT Text{% endcomment %}`.
 */
export const readingTime: LiquidTag = {
    name: 'readingtime',
    register: (ceems: Ceems) => ({
        parse(token) {
            this.value = token.args.trim();
        },
        async render(context) {
            const html = String((await ceems.engine.evalValue(this.value, context)) ?? '');
            const words = html
                .replace(/<[^>]*>/g, ' ')
                .split(/\s+/)
                .filter(Boolean).length;
            if (!words) return '';
            return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min read`;
        },
    }),
};
