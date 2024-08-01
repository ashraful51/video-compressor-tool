import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const uploadMiddleware = upload.single('video');
  await new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  const inputPath = req.file.path;
  const outputPath = path.join(process.cwd(), 'uploads', `compressed-${req.file.filename}`);

  ffmpeg(inputPath)
    .output(outputPath)
    .videoCodec('libx264')
    .size('50%')
    .on('end', async () => {
      await fs.promises.unlink(inputPath); // remove the original file
      res.json({ downloadUrl: `/uploads/compressed-${req.file.filename}` });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).send('Error compressing video');
    })
    .run();
};
