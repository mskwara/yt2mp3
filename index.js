const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const { scrapePlaylist } = require('youtube-playlist-scraper');
const _uniqueId = require('lodash/uniqueId');
const _values = require('lodash/values');
const _every = require('lodash/every');
const _includes = require('lodash/includes');
const _split = require('lodash/split');
const _map = require('lodash/map');
const _isNil = require('lodash/isNil');

const createDirectory = require('./utils/createDirectory');
const trim = require('./utils/trim');
const getValidFilename = require('./utils/getValidFilename');
const data = require('./data');
const getSecondsFromTime = require('./utils/getSecondsFromTime');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

createDirectory('./output');
createDirectory('./output/final');
createDirectory('./output/temp');

const playlistSubstringIdentifier = 'playlist?list=';

var isDone = {};

const onProgramEnd = () => {
  if (_every(_values(isDone), (value) => value === true)) {
    console.log('Cleaning up...');
    fs.rmSync('./output/temp', { recursive: true, force: true });
    console.log(
      '\n ===> Remember to copy all the files in /output/final directory to a safe place! <=== \n'
    );
  }
};

const downloadRequestedMusic = async () => {
  const preparedData = [];

  for (const entry of data) {
    if (_includes(entry.url, playlistSubstringIdentifier)) {
      const playlistId = _split(entry.url, playlistSubstringIdentifier)[1];
      const { title: playlistTitle, playlist: playlistData } = await scrapePlaylist(playlistId);
      preparedData.push(
        ..._map(playlistData, (obj) => ({
          url: obj.url,
          title: '',
          splitByChapters: false,
          isFromPlaylist: true,
          playlistTitle,
        }))
      );
    } else {
      preparedData.push({
        ...entry,
        cropStart: entry.splitByChapters ? undefined : entry.cropStart,
        cropEnd: entry.splitByChapters ? undefined : entry.cropEnd,
      });
    }
  }

  for (const entry of preparedData) {
    let started = false;
    const entryHash = _uniqueId('entry');
    isDone[entryHash] = false;

    ytdl.getInfo(entry.url).then((info) => {
      const validTitle = getValidFilename(entry.title || info.videoDetails.title);
      const fullAudioPath = `./output/temp/${validTitle}.mp3`;
      const readableStream = ytdl(entry.url, {
        format: ytdl.chooseFormat(info.formats, { quality: '140' })
      });

      readableStream.on('pipe', () => {
        if (!started) {
          console.log(`Downloading: ${validTitle}...`);
          started = true;
        }
      });

      readableStream.on('end', async () => {
        console.log(`Successfully saved URL audio: ${validTitle}.`);

        if (entry.isFromPlaylist) {
          const packagePath = `./output/final/${getValidFilename(entry.playlistTitle)}`;
          createDirectory(packagePath);
          const finalOutput = `${packagePath}/${validTitle}.mp3`;
          trim(fullAudioPath, null, null, validTitle, finalOutput).finally(() => {
            isDone[entryHash] = true;
            onProgramEnd();
          });
          return;
        }

        if (!entry.splitByChapters) {
          const finalOutput = `./output/final/${validTitle}.mp3`;
          const start = entry.cropStart ? getSecondsFromTime(entry.cropStart) : null;
          const end = entry.cropEnd ? getSecondsFromTime(entry.cropEnd) : null;
          
          trim(fullAudioPath, start, end, validTitle, finalOutput).finally(() => {
            isDone[entryHash] = true;
            onProgramEnd();
          });
          return;
        }

        const packagePath = `./output/final/${validTitle}`;
        createDirectory(packagePath);

        const chapterPromises = [];

        for (let i = 0; i < info.videoDetails.chapters.length; i++) {
          const currentChapter = info.videoDetails.chapters[i];
          const nextChapter = info.videoDetails.chapters[i + 1];
          const start = currentChapter.start_time;
          const end = nextChapter ? nextChapter.start_time : null;

          const chapterTitle = getValidFilename(currentChapter.title);
          const chapterPath = `${packagePath}/${chapterTitle}.mp3`;

          chapterPromises.push(trim(fullAudioPath, start, end, chapterTitle, chapterPath));
        }
        Promise.all(chapterPromises).finally(() => {
          isDone[entryHash] = true;
          onProgramEnd();
        });
      });

      readableStream.pipe(fs.createWriteStream(fullAudioPath));
    });
  }
};

downloadRequestedMusic();
