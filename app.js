const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // Enable CORS

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.get('/', (req, res) => {
  res.send('Video Compression Service is running!');
});

app.post('/compress', upload.single('video'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `compressed-${req.file.filename}`;

  ffmpeg(inputPath)
    .output(path.join('uploads', outputPath))
    .videoCodec('libx264')
    .size('50%')
    .on('end', () => {
      fs.unlinkSync(inputPath); // remove the original file
      res.json({ downloadUrl: `http://localhost:3000/uploads/${outputPath}` });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).send('Error compressing video');
    })
    .run();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
