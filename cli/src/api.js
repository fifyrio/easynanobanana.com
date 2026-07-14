'use strict';

/**
 * Thin HTTP client for the Easy Nano Banana REST API. Uses the global fetch
 * available in Node >= 18. All calls authenticate with the X-API-Key header.
 */

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(cfg, method, pathname, body) {
  if (!cfg.apiKey) {
    throw new ApiError('Not authenticated. Run `easynanobanana auth login` first.', 401);
  }
  const res = await fetch(`${cfg.apiUrl}${pathname}`, {
    method,
    headers: {
      'X-API-Key': cfg.apiKey,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = {};
  try {
    json = await res.json();
  } catch {
    // non-JSON error body
  }

  if (!res.ok || json.success === false) {
    const msg = json.error || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return json.data;
}

/** @returns {Promise<{credits:number}>} */
function getCredits(cfg) {
  return request(cfg, 'GET', '/api/v1/credits');
}

/** @returns {Promise<{imageUrl:string,creditsCharged:number,creditsRemaining:number}>} */
function generateImage(cfg, prompt, aspectRatio) {
  return request(cfg, 'POST', '/api/v1/images', { prompt, aspectRatio: aspectRatio || '1:1' });
}

module.exports = { getCredits, generateImage, ApiError };
