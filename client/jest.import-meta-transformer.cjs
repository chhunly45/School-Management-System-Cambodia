const path = require('path');
const tsJest = require('ts-jest');

const delegate = tsJest.default.createTransformer({
  useESM: true,
  tsconfig: 'tsconfig.json'
});

const qrScannerPanelPath = path.join('components', 'attendance', 'QrScannerPanel.tsx');
const isQrScannerPanel = (sourcePath) => sourcePath.endsWith(qrScannerPanelPath);

const rewriteForJest = (sourceText, sourcePath) => {
  if (!isQrScannerPanel(sourcePath)) return sourceText;

  return sourceText.replace(
    /import\.meta\.url/g,
    "require('url').pathToFileURL(__filename)"
  );
};

module.exports = {
  process(sourceText, sourcePath, options) {
    return delegate.process(rewriteForJest(sourceText, sourcePath), sourcePath, options);
  },

  getCacheKey(sourceText, sourcePath, options) {
    return delegate.getCacheKey(rewriteForJest(sourceText, sourcePath), sourcePath, options);
  }
};