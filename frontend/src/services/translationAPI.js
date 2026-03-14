const BASE_URL = 'https://api.mymemory.translated.net/get';
const inFlightRequests = new Map();

function decodeHtml(value) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

export async function translateText(text, targetLanguage) {
  if (!text || targetLanguage === 'en') {
    return text;
  }

  const cacheKey = `${text}_${targetLanguage}`;
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const request = fetch(`${BASE_URL}?${new URLSearchParams({
    q: text,
    langpair: `en|${targetLanguage}`
  })}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Translation request failed');
      }

      const payload = await response.json();
      const translated = payload?.responseData?.translatedText;
      return translated ? decodeHtml(translated) : text;
    })
    .catch(() => text)
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
}