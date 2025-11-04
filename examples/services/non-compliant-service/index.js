const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Non-compliant service');
});

app.listen(3001, () => {
  console.log('Service running on port 3001');
});
