const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Welcome to Compliant Service!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Compliant service listening at http://localhost:${port}`);
  });
}

module.exports = app;
