import http from 'http';

// Local port 3000 forwarder to prevent ERR_CONNECTION_REFUSED if Supabase
// defaults to localhost:3000 before Dashboard URL is updated.
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to KisanConnect...</title>
    <script>
        // Forward full URL including OAuth hash fragment (#access_token=...) to Vite dev port 5173
        const target = 'http://localhost:5173' + window.location.pathname + window.location.search + window.location.hash;
        window.location.replace(target);
    </script>
</head>
<body style="font-family: sans-serif; text-align: center; padding: 2rem; background: #040d08; color: #fff;">
    <h2>Redirecting to KisanConnect (Port 5173)...</h2>
    <p>Transferring Google OAuth session...</p>
</body>
</html>`);
});

server.listen(3000, () => {
    console.log('KisanConnect OAuth redirect helper listening on http://localhost:3000 -> http://localhost:5173');
});
