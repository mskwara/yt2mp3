const MP3Cutter = require('mp3-cutter');

MP3Cutter.cut({
  src: './output/temp/Sea Shanties - vol1.mp3',
  target: './test.mp3',
  start: 180,
  end: 200
});