require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
app.set('trust proxy', 1); // Render runs behind a proxy

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 404 — anything not matched above
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'TRANSMISSION FAILED — internal error' });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`[up] http://localhost:${port}`));
}
