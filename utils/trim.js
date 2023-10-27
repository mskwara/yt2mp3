const ffmpeg = require('fluent-ffmpeg');

const operationNames = {
  trimming: 'Trimming',
  encoding: 'Encoding',
}

const trim = (src, start, end, title, output) => {
  const operationName = start === null && end === null ? operationNames.encoding : operationNames.trimming;
  if (!src || !output) {
    console.log(`${operationName} failed for: ${title}. No src or output provided!`);
    return;
  }

  console.log(`${operationName}: ${title}...`);

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
    if (end != null) {
      order = order.setDuration(end - (start ?? 0));
    }

    order.run();
  });
};

module.exports = trim;
