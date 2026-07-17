function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || 'https://chatbot-asfd.onrender.com';
}

function buildApiUrl(path) {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

module.exports = {
  getApiBaseUrl,
  buildApiUrl,
};
