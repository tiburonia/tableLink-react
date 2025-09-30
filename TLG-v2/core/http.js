const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function http(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`${res.status} ${res.statusText} :: ${msg}`);
  }
  return safeJson(res);
}

function safeJson(res) {
  return res.headers.get('content-type')?.includes('application/json')
    ? res.json()
    : Promise.resolve(null);
}

function safeText(res) { 
  return res.text().catch(() => ''); 
}

export const get = (url) => http(url);
export const post = (url, body) => http(url, { 
  method: 'POST', 
  headers: JSON_HEADERS, 
  body: JSON.stringify(body) 
});
export const put = (url, body) => http(url, { 
  method: 'PUT', 
  headers: JSON_HEADERS, 
  body: JSON.stringify(body) 
});
export const del = (url) => http(url, { method: 'DELETE' });
