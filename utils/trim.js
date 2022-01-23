const ffmpeg = require('fluent-ffmpeg');

const trim = (src, start, end, title, output) => {
  if (!src || !output) {
    console.log(`Trimming failed for: ${title}. No src or output provided!`);
    return;
  }

  console.log(`Trimming: ${title}...`);

  return new Promise((resolve, reject) => {
    let order = ffmpeg(src)
      .output(output)
      .on('end', function (err) {
        if (!err) {
          console.log(`Successfully saved song: ${title}.`);
          resolve();
        }
      })
      .on('error', function (err) {
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

module.exports = trim;
