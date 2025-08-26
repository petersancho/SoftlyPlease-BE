// Simple test script for Heroku
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Simple route
app.get('/', (req, res) => {
  res.send('Hello World from Heroku!');
});

app.get('/version', (req, res) => {
  res.json({
    message: "Test server working",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get('/?format=json', (req, res) => {
  res.json({
    test: "JSON API working",
    format: req.query.format
  });
});

app.listen(port, () => {
  console.log(`Test server listening on port ${port}`);
});
