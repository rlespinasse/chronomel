// Helper HTTP partagé : récupère une URL JSON en retentant sur les erreurs
// serveur passagères (502/503/504), utilisé par tous les scripts `refresh-*.mjs`.

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Récupère et parse une URL JSON, en retentant jusqu'à MAX_RETRIES fois avec
 * un délai croissant si le serveur répond en erreur.
 *
 * @param {string} url
 * @param {(status: number) => string} onFail Message d'erreur final, reçoit le code HTTP.
 * @returns {Promise<any>}
 */
export async function fetchJsonWithRetry(url, onFail) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (attempt >= MAX_RETRIES) {
      throw new Error(onFail(res.status));
    }
    await sleep(RETRY_DELAY_MS * attempt);
  }
}
