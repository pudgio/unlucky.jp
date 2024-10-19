require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const privateKeyPath = process.env.SSL_PRIVATE_KEY_PATH;
const certificatePath = process.env.SSL_CERTIFICATE_PATH;

if (!privateKeyPath || !certificatePath) {
    console.error('SSL certificate paths are not set in the .env file');
    process.exit(1);
}

const privateKey = fs.readFileSync(path.join(__dirname, privateKeyPath), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, certificatePath), 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate
};

const app = express();
const PORT = 443;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'i');
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

app.use(express.static('i'));

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    res.json({ link: imageUrl });
});

app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
});

const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT, () => {
    console.log(`HTTPS Server is running on port ${PORT}`);
});

const httpApp = express();
httpApp.get('*', (req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
});
const httpServer = http.createServer(httpApp);
httpServer.listen(80, () => {
    console.log('HTTP Server is running on port 80 and redirecting to HTTPS');
});