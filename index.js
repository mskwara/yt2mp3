const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const data = require("./data");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

console.log(`Start: ${new Date().toUTCString()}`);

if (!fs.existsSync("./output")) {
  fs.mkdirSync("./output");
}

if (!fs.existsSync("./output/final")) {
  fs.mkdirSync("./output/final");
}

if (!fs.existsSync("./output/temp")) {
  fs.mkdirSync("./output/temp");
}

const trim = (src, start, end, title, output) => {
  return new Promise((resolve, reject) => {
    let order = ffmpeg(src)
      .output(output)
      .on("end", function (err) {
        if (!err) {
          console.log(`Successfully saved song: ${title} (${new Date().toUTCString()})`);
          resolve();
        }
      })
      .on("error", function (err) {
        console.log(`Error: ${err}`);
        reject();
      });
    if (start != null) {
      order = order.setStartTime(start);
    }
    if (start != null && end != null) {
      order = order.setDuration(end - start);
    }
    order.run();
  });
};

const transformToValidTitle = (title) => title.replaceAll('/', '-').replaceAll('?', '');

for (const entry of data) {
  const fullAudioPath = `./output/temp/${entry.title}.mp3`;
  ytdl.getInfo(entry.url).then((info) => {
    const readableStream = ytdl(entry.url, {
      format: ytdl.chooseFormat(info.formats, { quality: "140" }),
    });

    readableStream.on("pipe", () => {
      console.log("Processing: ", entry.title);
    });

    readableStream.on("end", async () => {
      console.log("File saved: ", entry.title);

      const packagePath = `./output/final/${entry.title}`;
      if (!fs.existsSync(packagePath)) {
        fs.mkdirSync(packagePath);
      }
      for (let i = 0; i < info.videoDetails.chapters.length; i++) {
        const currentChapter = info.videoDetails.chapters[i];
        const nextChapter = info.videoDetails.chapters[i + 1];
        const start = currentChapter.start_time;
        const end = nextChapter ? nextChapter.start_time : null;

        const chapterTitle = transformToValidTitle(currentChapter.title);
        const chapterPath = `./output/final/${entry.title}/${chapterTitle}.mp3`;
        console.log({ start, end });
        await trim(
          fullAudioPath,
          start,
          end,
          chapterTitle,
          chapterPath
        );
      }
    });

    readableStream.pipe(fs.createWriteStream(fullAudioPath));
  });
}
