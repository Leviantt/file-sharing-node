require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const File = require('./models/File')

const app = express();
const PORT = process.env.PORT ?? 3000;
const upload = multer({dest: "uploads"});
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));

mongoose.connect(process.env.DATABASE_URL);

app.get('/', (req, res) => {
    res.render('index');
})

app.post('/upload', upload.single('file'), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname
    }
    const password = req.body.password;    
    if(password && password !== ''){
        fileData.password = await bcrypt.hash(password, 10);
    }
    const file = await File.create(fileData);
    console.log(`req.headers.origin: ${req.headers.origin}`);
    res.render('index', {fileLink: `${req.headers.origin}/file/${file.id}`});
})

app.route(`/file/:id`).get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
    const file = await File.findById(req.params.id);

    if(file.password != null) {
        if(req.body.password == null) {
            res.render('password');
            return;
        }
        if(!(await bcrypt.compare(req.body.password, file.password))) {
            res.render('password', {error: true});
            return;
        }
    }

    file.downloadCount++;
    await file.save();
    res.download(file.path, file.originalName);
}
app.listen(PORT, () => {
    console.log(`Server has been started on port ${PORT}...`);
})