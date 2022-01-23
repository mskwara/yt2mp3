const illegalCharacters = [
  '#',
  '%',
  '&',
  '{',
  '}',
  '\\',
  '<',
  '>',
  '*',
  '?',
  '/',
  '$',
  '!',
  "'",
  '"',
  ':',
  '@',
  '+',
  '`',
  '|',
  '=',
];

const getValidFilename = (title) =>
  title
    .split('')
    .filter((char) => !illegalCharacters.includes(char))
    .join('');

module.exports = getValidFilename;
