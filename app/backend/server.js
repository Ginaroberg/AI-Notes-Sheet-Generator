const http = require('http'); // Import the 'http' module
const express = require('express');
const multer = require('multer');
const path = require('path');

// Initialize the Express app
const app = express();
const port = 5001;

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Set the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set filename to include a timestamp
  },
});

const upload = multer({ storage: storage });

app.post('/upload', upload.array('files', 10), (req, res) => {
  if (!req.files) {
    return res.status(400).send('No files uploaded.');
  }

  // Return the paths of the uploaded files
  res.json({ files: req.files.map(file => file.path) });
});

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Create the server using the express app
http.createServer(app).listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
