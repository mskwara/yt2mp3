const { split, toNumber } = require("lodash")

// HH:mm:ss
module.exports = (timeString) => {
	const [hours, minutes, seconds] = split(timeString, ":").map(toNumber);

  return hours * 60 * 60 + minutes * 60 + seconds;
}