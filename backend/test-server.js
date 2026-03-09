const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    message: "LocalLLMTestGenBuddy test server is running!",
    testCases: []
  }));
});

const PORT = 4001;
server.listen(PORT, () => {
  console.log(`Test backend is RUNNING at http://localhost:${PORT}`);
});
