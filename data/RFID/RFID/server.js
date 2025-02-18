const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

// Track connected clients
io.on('connection', (socket) => {
  console.log('A client connected');
  
  // Send initial data immediately on connection
  sendFileData(socket);
  
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

const jsonFilePath = path.join(__dirname, 'data', 'data.json');

// Configure Chokidar with more robust settings
const watcher = chokidar.watch(jsonFilePath, {
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: 1000,
    pollInterval: 100
  },
});

// Handle different file events
watcher
  .on('add', handleFileChange)
  .on('change', handleFileChange)
  .on('unlink', handleFileDelete)
  .on('error', (error) => {
    console.error('Watcher error:', error);
  });

function handleFileChange(filePath) {
  console.log(`File ${filePath} changed`);
  sendFileData();
}

function handleFileDelete(filePath) {
  console.log(`File ${filePath} deleted`);
  io.emit('data-update', {});
}

function sendFileData(socket = io) {
  fs.readFile(jsonFilePath, 'utf8', (err, fileData) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log('File does not exist - sending empty data');
        socket.emit('data-update', {});
      } else {
        console.error('Error reading file:', err);
      }
      return;
    }

    try {
      const jsonData = fileData.trim() ? JSON.parse(fileData) : {};
      socket.emit('data-update', jsonData);
      console.log('Sent data update:', jsonData);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      socket.emit('data-update', {});
    }
  });
}

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all available network interfaces
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  sendFileData();
});