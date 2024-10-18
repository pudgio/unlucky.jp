const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Load SSL certificates
const privateKey = fs.readFileSync('path/to/your/private.key', 'utf8');
const certificate = fs.readFileSync('path/to/your/certificate.crt', 'utf8');
const ca = fs.readFileSync('path/to/your/ca_bundle.crt', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const app = express();
const PORT = 443; // HTTPS port

// Set up storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

app.use(express.static('uploads'));

// Handle image upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    res.json({ link: imageUrl });
});

// Serve the upload.html file
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
    console.log(`HTTPS Server is running on port ${PORT}`);
});

// Optionally, create an HTTP server to redirect to HTTPS
const httpApp = express();
httpApp.get('*', (req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
});
const httpServer = http.createServer(httpApp);
httpServer.listen(80, () => {
    console.log('HTTP Server is running on port 80 and redirecting to HTTPS');
});