/* ══════════════════════════════════════════════════════════════════
   Vercel Edge Middleware — mjerenje agentskog prometa

   GA4 u pregledniku vidi samo one koji izvršavaju JavaScript.
   Pravi AI pauci — GPTBot, ClaudeBot, PerplexityBot i ostali —
   povuku HTML i odu, pa ih gtag nikad ne zabilježi. Ovo ih hvata
   na rubu mreže, prije nego što stranica uopće krene, i šalje ih
   u isti GA4 preko Measurement Protocola.

   Da proradi, u Vercelu (Settings → Environment Variables) treba:
     GA4_ID          G-XXXXXXXXXX   (isti kao u index.html)
     GA4_API_SECRET  Admin → Data streams → Measurement Protocol
   Bez njih middleware samo propusti promet dalje i ništa ne šalje.

   Provjera: /?mw=test vrati klasifikaciju umjesto stranice.
   ══════════════════════════════════════════════════════════════════ */

export const config = {
  /* samo stranice — ne okviri i slike, kojih je nekoliko stotina
     po posjetu i koje nemaju što reći o tome tko nas gleda */
  matcher: ['/', '/index.html', '/v1']
};

/* Poznati AI pauci i pomoćnici. Prvo se gleda tko je točno,
   pa tek onda opća mreža za sve ostalo što se predstavlja kao bot. */
const AGENTI = [
  ['ChatGPT',     /ChatGPT-User/i,        'pomocnik'],
  ['ChatGPT',     /OAI-SearchBot/i,       'trazilica'],
  ['ChatGPT',     /GPTBot/i,              'trening'],
  ['Claude',      /Claude-User/i,         'pomocnik'],
  ['Claude',      /Claude-SearchBot/i,    'trazilica'],
  ['Claude',      /ClaudeBot|anthropic-ai/i, 'trening'],
  ['Perplexity',  /Perplexity-User/i,     'pomocnik'],
  ['Perplexity',  /PerplexityBot/i,       'trazilica'],
  ['Gemini',      /Google-Extended/i,     'trening'],
  ['Google',      /Googlebot/i,           'trazilica'],
  ['Bing',        /bingbot|BingPreview/i, 'trazilica'],
  ['Applebot',    /Applebot-Extended/i,   'trening'],
  ['Applebot',    /Applebot/i,            'trazilica'],
  ['Meta',        /meta-externalagent|FacebookBot/i, 'trening'],
  ['Amazonbot',   /Amazonbot/i,           'trening'],
  ['Bytespider',  /Bytespider/i,          'trening'],
  ['Mistral',     /MistralAI-User/i,      'pomocnik'],
  ['DuckDuckGo',  /DuckAssistBot|DuckDuckBot/i, 'trazilica'],
  ['Common Crawl',/CCBot/i,               'trening'],
  ['Automatizacija', /HeadlessChrome|Puppeteer|Playwright|Selenium|browser-use|Browserbase/i, 'alat'],
  ['Ostali',      /bot|crawler|spider|scraper|curl\/|wget|python-requests|Go-http/i, 'ostalo']
];

function prepoznaj(ua) {
  for (const [ime, uzorak, svrha] of AGENTI) {
    if (uzorak.test(ua)) return { ime, svrha };
  }
  return null;
}

/* Stabilan client_id po agentu i danu, da GA4 ne broji svaki
   dohvat kao novog korisnika. Obican FNV-1a, ne treba jace. */
function klijentId(sjeme) {
  let h = 0x811c9dc5;
  for (let i = 0; i < sjeme.length; i++) {
    h ^= sjeme.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h}.${Math.floor(Date.now() / 86400000)}`;
}

export default function middleware(request, context) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const agent = prepoznaj(ua);

  /* /?mw=test — provjera da middleware uopće radi na ovom deployu */
  if (url.searchParams.get('mw') === 'test') {
    return new Response(JSON.stringify({
      middleware: 'radi',
      user_agent: ua,
      prepoznato: agent || 'nije agent',
      ga4_spojen: Boolean(process.env.GA4_ID && process.env.GA4_API_SECRET)
    }, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }

  if (!agent) return;

  const id = process.env.GA4_ID;
  const tajna = process.env.GA4_API_SECRET;
  if (!id || !tajna) return;

  const tijelo = {
    client_id: klijentId(agent.ime + '|' + ua.slice(0, 80)),
    non_personalized_ads: true,
    events: [{
      name: 'agent_visit_server',
      params: {
        agent_ime: agent.ime,
        agent_svrha: agent.svrha,
        agent_signal: 'user-agent',
        promet_vrsta: 'agent',
        page_location: url.href,
        page_path: url.pathname,
        drzava: request.headers.get('x-vercel-ip-country') || '(nepoznato)',
        engagement_time_msec: 1
      }
    }]
  };

  const slanje = fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${id}&api_secret=${tajna}`,
    { method: 'POST', body: JSON.stringify(tijelo) }
  ).catch(() => {});

  /* ne držimo odgovor — stranica ide gostu odmah */
  if (context && typeof context.waitUntil === 'function') context.waitUntil(slanje);
}
