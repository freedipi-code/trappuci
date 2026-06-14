const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'node-fetch' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function getCryptoPrice(cryptoCode) {
  try {
    const url = `https://api.coinbase.com/v2/prices/${cryptoCode}-GBP/spot`;
    const res = await fetchJson(url);
    if (res && res.data && res.data.amount) {
      return parseFloat(res.data.amount);
    }
    throw new Error('Format de réponse invalide');
  } catch (err) {
    console.error(`Échec de récupération du cours pour ${cryptoCode}:`, err.message);
    // Fallbacks si l'API de Coinbase est indisponible
    if (cryptoCode === 'BTC') return 77000;
    if (cryptoCode === 'LTC') return 60;
    throw err;
  }
}

async function convertGbpToCrypto(amountInGbp, cryptoCode) {
  const rate = await getCryptoPrice(cryptoCode);
  if (!rate || rate <= 0) {
    throw new Error(`Cours invalide pour ${cryptoCode}`);
  }
  return amountInGbp / rate;
}

module.exports = {
  getCryptoPrice,
  convertGbpToCrypto,
};
