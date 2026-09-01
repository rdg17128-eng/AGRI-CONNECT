import http from 'http';

// Local port 3000 bridge to prevent ERR_CONNECTION_REFUSED when Supabase
// defaults to localhost:3000. Automatically redirects with OAuth tokens to Port 5173 or Vercel.
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Transferring to KisanConnect...</title>
    <script>
        // Forward full URL including OAuth hash fragment (#access_token=...) to the active app origin
        try {
            var origin = localStorage.getItem('kisan_auth_origin') || 'http://localhost:5173';
            var target = origin + window.location.pathname + window.location.search + window.location.hash;
            window.location.replace(target);
        } catch (e) {
            window.location.replace('http://localhost:5173' + window.location.pathname + window.location.search + window.location.hash);
        }
    </script>
</head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 3rem 1rem; background: #050d09; color: #f0f8f4;">
    <div style="max-width: 480px; margin: 0 auto; background: rgba(15, 30, 22, 0.8); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 1rem; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <h2 style="color: #34d399; margin-top: 0;">Logging into KisanConnect...</h2>
        <p style="color: #8ba699;">Securely transferring your session...</p>
        <p style="font-size: 0.85rem; color: #52796f;">If you are not redirected in 3 seconds, <a id="manual-link" href="http://localhost:5173" style="color: #34d399;">click here to continue</a>.</p>
    </div>
    <script>
        var manualLink = document.getElementById('manual-link');
        if (manualLink) {
            var origin = localStorage.getItem('kisan_auth_origin') || 'http://localhost:5173';
            manualLink.href = origin + window.location.pathname + window.location.search + window.location.hash;
        }
    </script>
</body>
</html>`);
});

server.listen(3000, () => {
    console.log('[KisanConnect] OAuth redirect bridge active on http://localhost:3000 -> 5173');
});
