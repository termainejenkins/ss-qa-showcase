export type HtmlRoute = {
  /** URL path, always with a trailing slash except the home page, which is "/". */
  path: string;
  /** Short name used in test titles. */
  name: string;
  /** Visible h1 text. */
  h1: string;
};

/** HTML routes that return 200 on the live site. `/404` is not one of them. */
export const HTML_ROUTES: HtmlRoute[] = [
  { path: '/', name: 'home', h1: 'Autonomous software, games & automation.' },
  { path: '/games/', name: 'games', h1: 'Games' },
  { path: '/games/the-great-circle/', name: 'the great circle', h1: 'The Great Circle' },
  { path: '/games/the-great-circle/presskit/', name: 'game press kit', h1: 'The Great Circle' },
  { path: '/games/the-great-circle/devlog/', name: 'devlog', h1: 'Devlog' },
  { path: '/games/launcher/', name: 'launcher', h1: 'SS Game Launcher' },
  { path: '/products/', name: 'products', h1: 'Products' },
  { path: '/products/autonote/', name: 'autonote', h1: 'AutoNote' },
  { path: '/products/timekeeper/', name: 'time keeper', h1: 'Time Keeper' },
  { path: '/services/', name: 'services', h1: 'Services' },
  { path: '/work/', name: 'work', h1: 'Work' },
  { path: '/blog/', name: 'blog', h1: 'Blog' },
  { path: '/about/', name: 'about', h1: 'About' },
  { path: '/presskit/', name: 'press', h1: 'Press' },
  { path: '/contact/', name: 'contact', h1: 'Contact' },
  { path: '/support/', name: 'support', h1: 'Support' },
  { path: '/privacy/', name: 'privacy', h1: 'Privacy' },
  { path: '/terms/', name: 'terms', h1: 'Terms' },
];

export const FILE_ROUTES: { path: string; contentType: RegExp }[] = [
  { path: '/rss.xml', contentType: /xml/ },
  { path: '/sitemap.xml', contentType: /xml/ },
  { path: '/robots.txt', contentType: /text\/plain/ },
];

/** Internal hrefs rendered in the site footer. */
export const FOOTER_INTERNAL_PATHS = [
  '/games/',
  '/games/the-great-circle/',
  '/games/the-great-circle/presskit/',
  '/games/the-great-circle/devlog/',
  '/games/launcher/',
  '/products/',
  '/products/autonote/',
  '/products/timekeeper/',
  '/about/',
  '/services/',
  '/work/',
  '/support/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/presskit/',
];

/** Public outbound hrefs in the footer. The link crawl checks that they resolve. */
export const FOOTER_EXTERNAL_URLS = [
  'https://discord.gg/9h35M5mhBd',
  'https://store.steampowered.com/app/1751950/',
  'https://www.youtube.com/channel/UCLF-4x7d3YRvF54TdOwpW0A',
  'https://x.com/TheGreatCircle3',
  'https://www.instagram.com/thegreatcirclegame/',
  'https://www.twitch.tv/thegreatcircle_game',
  'https://www.facebook.com/thegreatcirclegame/',
];

export const HEADER_LINKS: { name: string; path: string }[] = [
  { name: 'Games', path: '/games/' },
  { name: 'Products', path: '/products/' },
  { name: 'Services', path: '/services/' },
  { name: 'Work', path: '/work/' },
  { name: 'About', path: '/about/' },
  { name: 'Contact', path: '/contact/' },
];
