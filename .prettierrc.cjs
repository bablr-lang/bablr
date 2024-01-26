module.exports = {
  printWidth: 100,
  trailingComma: 'all',
  singleQuote: true,

  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 60,
      },
    },
    {
      files: 'ARCHITECTURE.md',
      options: {
        printWidth: 80,
      },
    },
  ],
};
