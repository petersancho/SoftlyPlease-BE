const express = require('express');
const path = require('path');

const app = express();

// Core middleware
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

// Static: public/
app.use(express.static(path.join(process.cwd(), 'public')));

// Static: files/ with header tweaks for .gh/.ghx
app.use('/files', require('./middleware/static-files'));
app.use('/files', express.static(path.join(process.cwd(), 'files')));

// Static: examples/, vendor/, my-examples/
app.use('/examples', express.static(path.join(process.cwd(), 'examples')));
app.use('/vendor', express.static(path.join(process.cwd(), 'public', 'vendor')));
app.use('/my-examples', express.static(path.join(process.cwd(), 'my-examples')));

// API routes
app.use('/solve', require('./routes/solve'));
app.use('/status', require('./routes/status'));
app.use('/status/definitions', require('./routes/status-defs'));

// Error middleware (JSON)
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[softly] listening on ${PORT}`);
});
