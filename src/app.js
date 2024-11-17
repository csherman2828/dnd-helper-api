const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('Hello, Dockerized Express!');
});

// Start Server
app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}`);
});
