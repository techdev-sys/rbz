const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    createProxyMiddleware({
      pathFilter: '/api',
      target: 'http://localhost:8080',
      changeOrigin: true,
      proxyTimeout: 60000,
      timeout: 60000,
      on: {
        proxyReq: (proxyReq) => {
          // Bypass localtunnel reminder page for API calls
          proxyReq.setHeader('bypass-tunnel-reminder', 'true');
        },
      },
    })
  );
  app.use(
    createProxyMiddleware({
      pathFilter: ['/chat', '/reference-documents'],
      target: 'http://localhost:8000',
      changeOrigin: true,
      proxyTimeout: 60000,
      timeout: 60000,
      on: {
        proxyReq: (proxyReq) => {
          proxyReq.setHeader('bypass-tunnel-reminder', 'true');
        },
      },
    })
  );
};
