import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import http from 'http'

// Vite plugin: OAuth Port 3000 Redirect Bridge
// Listens on port 3000 during dev. When Supabase defaults/redirects to localhost:3000,
// this bridge catches the request and forwards the auth token to localhost:5173.
function oauthBridgePlugin() {
  let bridgeServer = null;
  return {
    name: 'oauth-port-3000-bridge',
    configureServer(server) {
      try {
        bridgeServer = http.createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting to KisanConnect (Port 5173)...</title>
    <script>
        var origin = localStorage.getItem('kisan_auth_origin') || 'http://localhost:5173';
        var target = origin + window.location.pathname + window.location.search + window.location.hash;
        window.location.replace(target);
    </script>
</head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: #050d09; color: #34d399;">
    <h3>Connecting to KisanConnect...</h3>
    <p style="color: #8ba699;">Forwarding authentication token to port 5173...</p>
</body>
</html>`);
        });

        bridgeServer.listen(3000, () => {
          console.log('\n  ➜  [KisanConnect OAuth Bridge] Listening on http://localhost:3000 -> Forwarding to http://localhost:5173\n');
        });

        bridgeServer.on('error', (err) => {
          if (err.code !== 'EADDRINUSE') {
            console.warn('[KisanConnect] Bridge notice:', err.message);
          }
        });
      } catch (e) {
        console.warn('OAuth bridge initialization notice:', e);
      }

      server.httpServer?.on('close', () => {
        bridgeServer?.close();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), oauthBridgePlugin()],
})
