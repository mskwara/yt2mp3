const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

const createDirectory = require('./utils/createDirectory');
const trim = require('./utils/trim');
const getValidFilename = require('./utils/getValidFilename');
const data = require('./data');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

createDirectory('./output');
createDirectory('./output/final');
createDirectory('./output/temp');

for (const entry of data) {
  const fullAudioPath = `./output/${entry.splitByChapters ? 'temp' : 'final'}/${entry.title}.mp3`;
  let started = false;

  ytdl.getInfo(entry.url).then((info) => {
    const readableStream = ytdl(entry.url, {
      format: ytdl.chooseFormat(info.formats, { quality: '140' }),
    });

    readableStream.on('pipe', () => {
      if (!started) {
        console.log(`Downloading: ${entry.title}...`);
        started = true;
      }
    });

    readableStream.on('end', async () => {
      console.log(`Successfully saved URL audio: ${entry.title}.`);

      if(!entry.splitByChapters) {
        return;
      }

      const packagePath = `./output/final/${getValidFilename(entry.title)}`;
      createDirectory(packagePath);

      for (let i = 0; i < info.videoDetails.chapters.length; i++) {
        const currentChapter = info.videoDetails.chapters[i];
        const nextChapter = info.videoDetails.chapters[i + 1];
        const start = currentChapter.start_time;
        const end = nextChapter ? nextChapter.start_time : null;

        const chapterTitle = getValidFilename(currentChapter.title);
        const chapterPath = `${packagePath}/${chapterTitle}.mp3`;

        trim(fullAudioPath, start, end, chapterTitle, chapterPath);
      }
    });

    readableStream.pipe(fs.createWriteStream(fullAudioPath));
  });
}
