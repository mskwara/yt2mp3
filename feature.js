const fs = require("fs");
const ytdl = require("ytdl-core");
const MP3Cutter = require('mp3-cutter');
const data = require("./data");

if (!fs.existsSync('./output')) {
  fs.mkdirSync('./output');
}

// MP3Cutter.cut({
//   src: './output/The Fisherman’s Friends - Cousin Jack.mp3',
//   target: './test.mp3',
//   start: 25,
//   end: 70 
// });

for (const entry of data) {
  ytdl.getInfo(entry.url).then((info) => {
    for (let i = 0; i < 1; i++) {
      const currentChapter = info.videoDetails.chapters[i];
      const nextChapter = info.videoDetails.chapters[i + 1];
      const start = currentChapter.start_time;
      const end = nextChapter ? nextChapter.start_time : null;

      const dir = `./output/${entry.title}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      const options = {
        format: ytdl.chooseFormat(info.formats, { quality: '140' }),
        begin: 50 * 1000
      };
      // if (end) {
      //   options.range = {
      //     start: start * 320 * 1024 / 8,
      //     end: end * 320 * 1024 / 8,
      //   };
      // } else {
      //   options.begin = start * 1000;
      // }

      const readableStream = ytdl(entry.url, options);

      readableStream.on("pipe", () => {
        console.log("Processing: ", currentChapter.title);
      });

      readableStream.on("unpipe", () => {
        console.log("File saved: ", currentChapter.title);
      });

      readableStream.pipe(
        fs.createWriteStream(`./output/${currentChapter.title}.mp3`)
      );
    }
  });
}
