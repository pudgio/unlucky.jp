require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const privateKey = fs.readFileSync(path.join(__dirname, process.env.SSL_PRIVATE_KEY), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, process.env.SSL_CERTIFICATE), 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate
};

const app = express();
const PORT = 443;

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
    res.redirect([`https://${req.headers.host}${req.url}`](command:_github.copilot.openSymbolFromReferences?%5B%22%22%2C%5B%7B%22uri%22%3A%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2Fdosbr%2FOneDrive%2FDesktop%2Funlucky.jp%2Funlucky.jp%2Fserver.js%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%2C%22pos%22%3A%7B%22line%22%3A5%2C%22character%22%3A6%7D%7D%5D%2C%226ab2988d-0143-45cb-9eca-c2955c6f340e%22%5D "Go to definition"));
});
const httpServer = http.createServer(httpApp);
httpServer.listen(80, () => {
    console.log('HTTP Server is running on port 80 and redirecting to HTTPS');
});