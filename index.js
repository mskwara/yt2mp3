const fs = require("fs");
const ytdl = require("ytdl-core");
const ffmpeg = require('fluent-ffmpeg');
const data = require("./data");

ffmpeg.setFfmpegPath('./node_modules/ffmpeg/lib');
ffmpeg.setFfprobePath('./node_modules/ffprobe');

ffmpeg('./output/Sea Shanties - vol1.mp3')
      .inputOptions('-t 5') // 2s
      .output('output.mp3')
      .run()

// if (!fs.existsSync('./output')) {
//   fs.mkdirSync('./output');
// }

// for (const entry of data) {
//   ytdl.getInfo(entry.url).then((info) => {
//     const readableStream = ytdl(entry.url, {
//       format: ytdl.chooseFormat(info.formats, { quality: "140" }),
//     });

//     readableStream.on("pipe", () => {
//       console.log("Processing: ", entry.title);
//     });

    
//     readableStream.on("end", () => {
//       console.log("File saved: ", entry.title);

//       ffmpeg(`./output/${entry.title}.mp3`)
//       .inputOptions('-t 5') // 2s
//       .output('output.mp3')
//       .run()
//     });

//     readableStream.pipe(fs.createWriteStream(`./output/${entry.title}.mp3`));
//   });
// }
