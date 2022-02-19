const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const _uniqueId = require('lodash/uniqueId');
const _values = require('lodash/values');
const _every = require('lodash/every');

const createDirectory = require('./utils/createDirectory');
const trim = require('./utils/trim');
const getValidFilename = require('./utils/getValidFilename');
const data = require('./data');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

createDirectory('./output');
createDirectory('./output/final');
createDirectory('./output/temp');

const isDone = {};

const onProgramEnd = () => {
  if(_every(_values(isDone), value => value === true)) {
    console.log('Cleaning up...');
    fs.rmSync('./output/temp', { recursive: true, force: true });
    console.log('\n ===> Remember to copy all the files in /output/final directory to a safe place! <=== \n');
  }
}

for (const entry of data) {
  let started = false;
  const entryHash = _uniqueId('entry');
  isDone[entryHash] = false;

  ytdl.getInfo(entry.url).then((info) => {
    const validTitle = getValidFilename(entry.title || info.videoDetails.title);
    const fullAudioPath = `./output/temp/${validTitle}.mp3`;
    const readableStream = ytdl(entry.url, {
      format: ytdl.chooseFormat(info.formats, { quality: '140' }),
    });

    readableStream.on('pipe', () => {
      if (!started) {
        console.log(`Downloading: ${validTitle}...`);
        started = true;
      }
    });

    readableStream.on('end', async () => {
      console.log(`Successfully saved URL audio: ${validTitle}.`);

      if(!entry.splitByChapters) {
        const finalOutput = `./output/final/${validTitle}.mp3`;
        trim(fullAudioPath, null, null, validTitle, finalOutput).finally(() => {
          isDone[entryHash] = true;
          onProgramEnd();
        });
        return;
      }

      const packagePath = `./output/final/${validTitle}`;
      createDirectory(packagePath);

      for (let i = 0; i < info.videoDetails.chapters.length; i++) {
        const currentChapter = info.videoDetails.chapters[i];
        const nextChapter = info.videoDetails.chapters[i + 1];
        const start = currentChapter.start_time;
        const end = nextChapter ? nextChapter.start_time : null;

        const chapterTitle = getValidFilename(currentChapter.title);
        const chapterPath = `${packagePath}/${chapterTitle}.mp3`;

        trim(fullAudioPath, start, end, chapterTitle, chapterPath).finally(() => {
          isDone[entryHash] = true;
          onProgramEnd();
        });
      }
    });

    readableStream.pipe(fs.createWriteStream(fullAudioPath));
  });
}
