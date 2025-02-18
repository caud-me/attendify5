const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files (like index.html) from the 'public' folder.
app.use(express.static(path.join(__dirname, 'public')));

// When a client connects, log it.
io.on('connection', (socket) => {
  console.log('A client connected');
});

// Define the path to your JSON file.
const jsonFilePath = path.join(__dirname, 'data', 'data.json');

// Use Chokidar to watch the JSON file.
chokidar.watch(jsonFilePath).on('change', (filePath) => {
  console.log(`File ${filePath} has changed.`);

  // Read the updated JSON file.
  fs.readFile(jsonFilePath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return;
    }

    try {
      const jsonData = JSON.parse(fileData);

      // Emit an event to all connected clients with the new data.
      io.emit('data-update', jsonData);
      console.log('Emitted data-update event with:', jsonData);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
    }
  });
});

// Start the server.
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
