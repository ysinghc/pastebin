/**
 * Search metadata for whichever page the browser is showing.
 *
 * index.html carries the home page's tags, which is what crawlers that do not
 * run JavaScript read. Once the app takes over, this keeps the tags right for
 * each route. Only the home page is for search engines: pastes belong to whoever
 * holds the link, and an unknown address is not worth finding.
 */

import { useEffect } from 'react';

export const SITE_URL = 'https://pastebin.ysinghc.in';
export const HOME_TITLE = 'Temporary Pastebin: text and code that deletes itself';

const ROBOTS_INDEX = 'index, follow, max-image-preview:large';
const ROBOTS_PRIVATE = 'noindex, nofollow';

// `title: null` means the page sets its own title (a paste shows its language).
const PAGES = {
  new: { title: HOME_TITLE, indexable: true },
  view: { title: null, indexable: false },
  unknown: { title: 'Nothing at this address | Pastebin', indexable: false },
};

function setRobots(content) {
  let tag = document.querySelector('meta[name="robots"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'robots';
    document.head.append(tag);
  }
  tag.content = content;
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }
  link.href = href;
}

/** Keeps the title, robots directive and canonical link in step with the route. */
export function usePageSeo(kind) {
  useEffect(() => {
    const page = PAGES[kind];
    if (!page) return;
    if (page.title) document.title = page.title;
    setRobots(page.indexable ? ROBOTS_INDEX : ROBOTS_PRIVATE);
    setCanonical(page.indexable ? `${SITE_URL}/` : null);
  }, [kind]);
}
