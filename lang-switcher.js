/* ════════════════════════════════════════════════════════════════
   Ask Mo — Universal Language Switcher
   ----------------------------------------------------------------
   A custom, searchable dropdown of 100+ languages that drives the
   Google Translate engine under the hood. One choice translates the
   ENTIRE site (chat, map, directory, dynamically-rendered cards) and
   persists across pages + sessions via a domain-wide cookie.

   Drop this on any page:
     <div id="langSwitcher"></div>
     <script src="lang-switcher.js"></script>
   The script self-mounts, injects its own CSS + the hidden Google
   gadget, and restores the saved language on load.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORE = 'askmo_google_lang';

  // [code, English name, native name]. Codes are Google Translate codes.
  var LANGS = [
    ['en', 'English', 'English'],
    ['es', 'Spanish', 'Español'],
    ['fr', 'French', 'Français'],
    ['de', 'German', 'Deutsch'],
    ['it', 'Italian', 'Italiano'],
    ['pt', 'Portuguese', 'Português'],
    ['zh-CN', 'Chinese (Simplified)', '简体中文'],
    ['zh-TW', 'Chinese (Traditional)', '繁體中文'],
    ['ja', 'Japanese', '日本語'],
    ['ko', 'Korean', '한국어'],
    ['ar', 'Arabic', 'العربية'],
    ['hi', 'Hindi', 'हिन्दी'],
    ['ru', 'Russian', 'Русский'],
    ['af', 'Afrikaans', 'Afrikaans'],
    ['sq', 'Albanian', 'Shqip'],
    ['am', 'Amharic', 'አማርኛ'],
    ['hy', 'Armenian', 'Հայերեն'],
    ['az', 'Azerbaijani', 'Azərbaycan'],
    ['eu', 'Basque', 'Euskara'],
    ['be', 'Belarusian', 'Беларуская'],
    ['bn', 'Bengali', 'বাংলা'],
    ['bs', 'Bosnian', 'Bosanski'],
    ['bg', 'Bulgarian', 'Български'],
    ['ca', 'Catalan', 'Català'],
    ['ceb', 'Cebuano', 'Cebuano'],
    ['ny', 'Chichewa', 'Chichewa'],
    ['co', 'Corsican', 'Corsu'],
    ['hr', 'Croatian', 'Hrvatski'],
    ['cs', 'Czech', 'Čeština'],
    ['da', 'Danish', 'Dansk'],
    ['nl', 'Dutch', 'Nederlands'],
    ['eo', 'Esperanto', 'Esperanto'],
    ['et', 'Estonian', 'Eesti'],
    ['tl', 'Filipino', 'Filipino'],
    ['fi', 'Finnish', 'Suomi'],
    ['fy', 'Frisian', 'Frysk'],
    ['gl', 'Galician', 'Galego'],
    ['ka', 'Georgian', 'ქართული'],
    ['el', 'Greek', 'Ελληνικά'],
    ['gu', 'Gujarati', 'ગુજરાતી'],
    ['ht', 'Haitian Creole', 'Kreyòl Ayisyen'],
    ['ha', 'Hausa', 'Hausa'],
    ['haw', 'Hawaiian', 'ʻŌlelo Hawaiʻi'],
    ['iw', 'Hebrew', 'עברית'],
    ['hmn', 'Hmong', 'Hmoob'],
    ['hu', 'Hungarian', 'Magyar'],
    ['is', 'Icelandic', 'Íslenska'],
    ['ig', 'Igbo', 'Igbo'],
    ['id', 'Indonesian', 'Bahasa Indonesia'],
    ['ga', 'Irish', 'Gaeilge'],
    ['jw', 'Javanese', 'Basa Jawa'],
    ['kn', 'Kannada', 'ಕನ್ನಡ'],
    ['kk', 'Kazakh', 'Қазақ'],
    ['km', 'Khmer', 'ខ្មែរ'],
    ['rw', 'Kinyarwanda', 'Kinyarwanda'],
    ['ku', 'Kurdish (Kurmanji)', 'Kurdî'],
    ['ky', 'Kyrgyz', 'Кыргызча'],
    ['lo', 'Lao', 'ລາວ'],
    ['la', 'Latin', 'Latina'],
    ['lv', 'Latvian', 'Latviešu'],
    ['lt', 'Lithuanian', 'Lietuvių'],
    ['lb', 'Luxembourgish', 'Lëtzebuergesch'],
    ['mk', 'Macedonian', 'Македонски'],
    ['mg', 'Malagasy', 'Malagasy'],
    ['ms', 'Malay', 'Bahasa Melayu'],
    ['ml', 'Malayalam', 'മലയാളം'],
    ['mt', 'Maltese', 'Malti'],
    ['mi', 'Maori', 'Māori'],
    ['mr', 'Marathi', 'मराठी'],
    ['mn', 'Mongolian', 'Монгол'],
    ['my', 'Myanmar (Burmese)', 'မြန်မာ'],
    ['ne', 'Nepali', 'नेपाली'],
    ['no', 'Norwegian', 'Norsk'],
    ['or', 'Odia (Oriya)', 'ଓଡ଼ିଆ'],
    ['ps', 'Pashto', 'پښتو'],
    ['fa', 'Persian', 'فارسی'],
    ['pl', 'Polish', 'Polski'],
    ['pa', 'Punjabi', 'ਪੰਜਾਬੀ'],
    ['ro', 'Romanian', 'Română'],
    ['sm', 'Samoan', 'Gagana Samoa'],
    ['gd', 'Scots Gaelic', 'Gàidhlig'],
    ['sr', 'Serbian', 'Српски'],
    ['st', 'Sesotho', 'Sesotho'],
    ['sn', 'Shona', 'Shona'],
    ['sd', 'Sindhi', 'سنڌي'],
    ['si', 'Sinhala', 'සිංහල'],
    ['sk', 'Slovak', 'Slovenčina'],
    ['sl', 'Slovenian', 'Slovenščina'],
    ['so', 'Somali', 'Soomaali'],
    ['su', 'Sundanese', 'Basa Sunda'],
    ['sw', 'Swahili', 'Kiswahili'],
    ['sv', 'Swedish', 'Svenska'],
    ['tg', 'Tajik', 'Тоҷикӣ'],
    ['ta', 'Tamil', 'தமிழ்'],
    ['tt', 'Tatar', 'Татар'],
    ['te', 'Telugu', 'తెలుగు'],
    ['th', 'Thai', 'ไทย'],
    ['tr', 'Turkish', 'Türkçe'],
    ['tk', 'Turkmen', 'Türkmen'],
    ['uk', 'Ukrainian', 'Українська'],
    ['ur', 'Urdu', 'اردو'],
    ['ug', 'Uyghur', 'ئۇيغۇرچە'],
    ['uz', 'Uzbek', 'Oʻzbek'],
    ['vi', 'Vietnamese', 'Tiếng Việt'],
    ['cy', 'Welsh', 'Cymraeg'],
    ['xh', 'Xhosa', 'isiXhosa'],
    ['yi', 'Yiddish', 'ייִדיש'],
    ['yo', 'Yoruba', 'Yorùbá'],
    ['zu', 'Zulu', 'isiZulu']
  ];

  // Languages written right-to-left — used to flip the page direction.
  var RTL = { ar: 1, iw: 1, fa: 1, ur: 1, ps: 1, sd: 1, ug: 1, yi: 1 };

  function byCode(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === code) return LANGS[i];
    return LANGS[0];
  }

  // ── cookie helpers ────────────────────────────────────────────
  function domainVariants() {
    var host = location.hostname, out = ['']; // '' = host-only cookie
    if (host && host.indexOf('.') > -1 && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      out.push(host);
      out.push('.' + host);
      var p = host.split('.');
      if (p.length > 2) out.push('.' + p.slice(-2).join('.'));
    }
    return out;
  }
  function setGoogTrans(code) {
    var pair = '/en/' + code;
    var exp = new Date(Date.now() + 365 * 864e5).toUTCString();
    domainVariants().forEach(function (d) {
      document.cookie = 'googtrans=' + pair + ';expires=' + exp + ';path=/' + (d ? ';domain=' + d : '');
    });
  }
  function clearGoogTrans() {
    var past = 'Thu, 01 Jan 1970 00:00:00 UTC';
    domainVariants().forEach(function (d) {
      document.cookie = 'googtrans=;expires=' + past + ';path=/' + (d ? ';domain=' + d : '');
    });
  }

  function savedLang() {
    try { return localStorage.getItem(STORE) || 'en'; } catch (e) { return 'en'; }
  }

  // ── restore saved language BEFORE the Google gadget initialises ──
  var current = savedLang();
  if (current && current !== 'en') setGoogTrans(current); else clearGoogTrans();

  // ── inject Google Translate gadget (hidden) ───────────────────
  function injectGoogle() {
    if (document.getElementById('google_translate_element')) return;
    var holder = document.createElement('div');
    holder.id = 'google_translate_element';
    holder.setAttribute('aria-hidden', 'true');
    document.body.appendChild(holder);
    window.googleTranslateElementInit = function () {
      try {
        new google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
      } catch (e) {}
    };
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.body.appendChild(s);
  }

  // ── CSS ───────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('langSwitcherCSS')) return;
    var css = document.createElement('style');
    css.id = 'langSwitcherCSS';
    css.textContent = [
      /* neutralise Google's injected chrome */
      '.skiptranslate{display:none!important}',
      'body{top:0!important;position:static!important}',
      '.goog-te-banner-frame,.goog-te-balloon-frame{display:none!important}',
      '#goog-gt-tt,.goog-tooltip,.goog-tooltip:hover{display:none!important}',
      'font[style]{background:none!important;box-shadow:none!important}',
      '#google_translate_element{position:absolute!important;left:-9999px!important;top:-9999px!important;height:0!important;width:0!important;overflow:hidden!important}',
      /* switcher button */
      '.lang-switch{position:relative;display:inline-block;font-family:inherit}',
      '.lang-switch-btn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px;border-radius:8px;background:var(--surface2,#f1f0ec);border:1.5px solid var(--border,#d9d6cf);color:var(--text,#2a2a28);font-size:12.5px;font-weight:700;cursor:pointer;transition:all .15s;line-height:1;max-width:170px}',
      '.lang-switch-btn:hover{background:var(--amber-bg,#fdf3e0);border-color:var(--amber-mid,#e0a44a);color:var(--amber,#c47d1a)}',
      '.lang-switch-btn .ls-globe{font-size:14px}',
      '.lang-switch-btn .ls-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:104px}',
      '.lang-switch-btn .ls-caret{font-size:10px;opacity:.6;transition:transform .18s}',
      '.lang-switch.open .ls-caret{transform:rotate(180deg)}',
      '.lang-switch.open .lang-switch-btn{background:var(--amber-bg,#fdf3e0);border-color:var(--amber-mid,#e0a44a);color:var(--amber,#c47d1a)}',
      /* panel */
      '.lang-switch-panel{position:absolute;top:calc(100% + 8px);right:0;width:300px;max-height:64vh;display:flex;flex-direction:column;background:var(--surface,#fff);border:1px solid var(--border,#d9d6cf);border-radius:14px;box-shadow:0 18px 50px rgba(20,20,30,.22);z-index:9999;overflow:hidden;opacity:0;transform:translateY(-6px) scale(.985);pointer-events:none;transition:opacity .16s,transform .16s}',
      '.lang-switch.open .lang-switch-panel{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}',
      '.ls-search-wrap{padding:10px 10px 8px;border-bottom:1px solid var(--border,#eee);position:sticky;top:0;background:var(--surface,#fff)}',
      '.ls-search{width:100%;box-sizing:border-box;height:36px;padding:0 12px;border-radius:9px;border:1.5px solid var(--border,#d9d6cf);background:var(--surface2,#f7f6f3);color:var(--text,#222);font-size:13px;outline:none}',
      '.ls-search:focus{border-color:var(--amber-mid,#e0a44a)}',
      '.ls-list{list-style:none;margin:0;padding:6px;overflow-y:auto;-webkit-overflow-scrolling:touch;flex:1}',
      '.ls-opt{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;cursor:pointer;color:var(--text,#2a2a28)}',
      '.ls-opt:hover,.ls-opt.kbd{background:var(--amber-bg,#fdf3e0)}',
      '.ls-opt .ls-native{font-weight:700;font-size:13.5px}',
      '.ls-opt .ls-en{font-size:11.5px;color:var(--text-muted,#8a8780);margin-left:auto}',
      '.ls-opt.sel{background:var(--amber,#c47d1a);color:#fff}',
      '.ls-opt.sel .ls-en{color:rgba(255,255,255,.8)}',
      '.ls-opt .ls-check{width:14px;font-size:12px;opacity:0}',
      '.ls-opt.sel .ls-check{opacity:1}',
      '.ls-empty{padding:18px;text-align:center;color:var(--text-muted,#8a8780);font-size:12.5px}',
      '.ls-foot{padding:8px 12px;border-top:1px solid var(--border,#eee);font-size:10.5px;color:var(--text-muted,#9a978f);text-align:center}',
      '.lang-switch-scrim{display:none}',
      /* mobile: bottom sheet */
      '@media (max-width:640px){',
      '.lang-switch-scrim{display:none;position:fixed;inset:0;background:rgba(15,18,28,.42);z-index:9998}',
      '.lang-switch.open .lang-switch-scrim{display:block}',
      '.lang-switch-panel{position:fixed;left:0;right:0;bottom:0;top:auto;width:100%;max-height:78vh;border-radius:18px 18px 0 0;transform:translateY(100%);transition:transform .26s cubic-bezier(.4,0,.2,1),opacity .2s}',
      '.lang-switch.open .lang-switch-panel{transform:translateY(0)}',
      '.ls-search-wrap{padding-top:14px}',
      '.lang-switch-btn .ls-name{max-width:70px}',
      '}'
    ].join('\n');
    document.head.appendChild(css);
  }

  // ── build the dropdown UI ─────────────────────────────────────
  function build(mount) {
    injectCSS();
    var cur = byCode(current);
    var wrap = document.createElement('div');
    wrap.className = 'lang-switch notranslate';
    wrap.setAttribute('translate', 'no');
    wrap.innerHTML =
      '<button type="button" class="lang-switch-btn" aria-haspopup="listbox" aria-expanded="false" title="Choose language">' +
        '<span class="ls-globe">🌐</span>' +
        '<span class="ls-name">' + cur[2] + '</span>' +
        '<span class="ls-caret">▾</span>' +
      '</button>' +
      '<div class="lang-switch-scrim"></div>' +
      '<div class="lang-switch-panel" role="dialog" aria-label="Language">' +
        '<div class="ls-search-wrap"><input type="text" class="ls-search" placeholder="Search 100+ languages…" autocomplete="off" aria-label="Search languages"></div>' +
        '<ul class="ls-list" role="listbox"></ul>' +
        '<div class="ls-foot">Translation by Google · 100+ languages</div>' +
      '</div>';
    mount.innerHTML = '';
    mount.appendChild(wrap);

    var btn = wrap.querySelector('.lang-switch-btn');
    var nameEl = wrap.querySelector('.ls-name');
    var panel = wrap.querySelector('.lang-switch-panel');
    var scrim = wrap.querySelector('.lang-switch-scrim');
    var search = wrap.querySelector('.ls-search');
    var list = wrap.querySelector('.ls-list');
    var kbdIdx = -1;

    function renderList(q) {
      q = (q || '').trim().toLowerCase();
      list.innerHTML = '';
      var shown = LANGS.filter(function (l) {
        return !q || l[1].toLowerCase().indexOf(q) > -1 || l[2].toLowerCase().indexOf(q) > -1 || l[0].toLowerCase().indexOf(q) > -1;
      });
      if (!shown.length) {
        list.innerHTML = '<li class="ls-empty">No languages match “' + q + '”</li>';
        return;
      }
      shown.forEach(function (l) {
        var li = document.createElement('li');
        li.className = 'ls-opt' + (l[0] === current ? ' sel' : '');
        li.setAttribute('role', 'option');
        li.dataset.code = l[0];
        li.innerHTML =
          '<span class="ls-check">✓</span>' +
          '<span class="ls-native">' + l[2] + '</span>' +
          '<span class="ls-en">' + l[1] + '</span>';
        li.addEventListener('click', function () { choose(l[0]); });
        list.appendChild(li);
      });
      kbdIdx = -1;
    }

    function open() {
      wrap.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      renderList('');
      search.value = '';
      setTimeout(function () { if (window.innerWidth > 640) search.focus(); }, 30);
      document.addEventListener('mousedown', outside, true);
      document.addEventListener('keydown', onKey, true);
    }
    function close() {
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', outside, true);
      document.removeEventListener('keydown', onKey, true);
    }
    function toggle() { wrap.classList.contains('open') ? close() : open(); }
    function outside(e) { if (!wrap.contains(e.target)) close(); }

    function onKey(e) {
      if (e.key === 'Escape') { close(); btn.focus(); return; }
      var opts = list.querySelectorAll('.ls-opt');
      if (!opts.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        kbdIdx += e.key === 'ArrowDown' ? 1 : -1;
        if (kbdIdx < 0) kbdIdx = opts.length - 1;
        if (kbdIdx >= opts.length) kbdIdx = 0;
        opts.forEach(function (o) { o.classList.remove('kbd'); });
        var el = opts[kbdIdx];
        el.classList.add('kbd');
        el.scrollTop; // reflow
        var pr = el.getBoundingClientRect(), lr = list.getBoundingClientRect();
        if (pr.bottom > lr.bottom) list.scrollTop += pr.bottom - lr.bottom;
        if (pr.top < lr.top) list.scrollTop -= lr.top - pr.top;
      } else if (e.key === 'Enter' && kbdIdx > -1) {
        e.preventDefault();
        choose(opts[kbdIdx].dataset.code);
      }
    }

    btn.addEventListener('click', toggle);
    scrim.addEventListener('click', close);
    search.addEventListener('input', function () { renderList(search.value); });

    nameEl.textContent = cur[2];
    return { renderList: renderList };
  }

  // ── apply a language choice ───────────────────────────────────
  function choose(code) {
    try { localStorage.setItem(STORE, code); } catch (e) {}
    if (code === 'en') clearGoogTrans(); else setGoogTrans(code);
    // reload so the Google engine re-walks the full (incl. dynamic) DOM
    location.reload();
  }

  // ── mount ─────────────────────────────────────────────────────
  function start() {
    var mount = document.getElementById('langSwitcher');
    if (mount) build(mount);
    injectGoogle();
    // reflect RTL languages
    if (RTL[current]) document.documentElement.setAttribute('dir', 'rtl');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // expose for debugging / programmatic use
  window.AskMoLang = { set: choose, current: function () { return current; }, list: LANGS };
})();
