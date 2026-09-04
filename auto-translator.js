// ==================== Automatische vertaler voor algemene communicatie ====================
// Alleen gebruiken voor algemene communicatie zoals berichten, announcements,
// feedback en waarschuwingen. Productnamen, productbeschrijvingen en opmerkingen
// worden bewust niet automatisch vertaald.
(function () {
  const CACHE_PREFIX = 'bestelsysteem_auto_translation_v1:';
  const API_URL = 'https://api.mymemory.translated.net/get';

  function cleanLang(lang) { return lang === 'en' ? 'en' : 'nl'; }
  function escKey(value) { return encodeURIComponent(String(value || '')); }

  function currentLanguage() {
    return cleanLang(localStorage.getItem('appLanguage') || 'nl');
  }

  function getCached(text, from, to) {
    try {
      const key = CACHE_PREFIX + from + ':' + to + ':' + escKey(text);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function setCached(text, from, to, value) {
    try {
      const key = CACHE_PREFIX + from + ':' + to + ':' + escKey(text);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  async function translateText(text, fromLang, toLang) {
    const source = String(text == null ? '' : text).trim();
    const from = cleanLang(fromLang);
    const to = cleanLang(toLang);
    if (!source || from === to) return source;

    const cached = getCached(source, from, to);
    if (cached && cached.text) return cached.text;

    const params = new URLSearchParams({
      q: source,
      langpair: from + '|' + to,
      de: 'bestelsysteem-web'
    });

    const response = await fetch(API_URL + '?' + params.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Translation request failed: ' + response.status);
    const data = await response.json();
    const translated = data && data.responseData && data.responseData.translatedText
      ? String(data.responseData.translatedText).trim()
      : '';
    if (!translated) throw new Error('No translation returned');
    setCached(source, from, to, { text: translated, at: Date.now() });
    return translated;
  }

  async function buildBilingual(text, sourceLang) {
    const source = String(text == null ? '' : text).trim();
    const sourceCode = cleanLang(sourceLang || currentLanguage());
    if (!source) return { nl: '', en: '', sourceLang: sourceCode };

    if (sourceCode === 'nl') {
      let en = source;
      try { en = await translateText(source, 'nl', 'en'); } catch (e) { console.warn('EN translation failed:', e); }
      return { nl: source, en, sourceLang: 'nl' };
    }

    let nl = source;
    try { nl = await translateText(source, 'en', 'nl'); } catch (e) { console.warn('NL translation failed:', e); }
    return { nl, en: source, sourceLang: 'en' };
  }

  async function translateFieldSet(fields, sourceLang) {
    const out = {};
    const entries = Object.entries(fields || {});
    await Promise.all(entries.map(async ([key, value]) => {
      out[key] = await buildBilingual(value, sourceLang);
    }));
    return out;
  }

  function pickBilingual(field, lang) {
    const wanted = cleanLang(lang || currentLanguage());
    if (!field) return '';
    if (typeof field === 'string') return field;
    return String(field[wanted] || field[currentLanguage()] || field.en || field.nl || field.original || '');
  }

  async function translateLegacy(text, sourceLang, targetLang) {
    const source = String(text == null ? '' : text).trim();
    if (!source) return '';
    const from = cleanLang(sourceLang || 'nl');
    const to = cleanLang(targetLang || currentLanguage());
    if (from === to) return source;
    try { return await translateText(source, from, to); }
    catch (_) { return source; }
  }

  window.AutoTranslator = {
    currentLanguage,
    translateText,
    buildBilingual,
    translateFieldSet,
    pickBilingual,
    translateLegacy
  };
})();
