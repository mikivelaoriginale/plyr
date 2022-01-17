const postcss = require('rollup-plugin-postcss');
const copy = require('rollup-plugin-copy');

function externalAsset({ include, assetTargetDir }) {
  const isMatchSingle = function (include, module) {
    return new RegExp(include, 'g').test(module);
  };

  const isMatch = function (include, module) {
    if (include === undefined) return true;
    return Array.isArray(include)
      ? include.some((i) => isMatchSingle(i, module))
      : isMatchSingle(include, module);
  };

  return {
    name: 'rollup-plugin-external-asset',
    resolveId(source) {
      if (!isMatch(include, source)) return null;
      return { id: source, external: true };
    },
  };
}

module.exports = {
  rollup(config) {
    config.plugins = [
      externalAsset({
        include: ['.svg$'],
        assetTargetDir: 'dist/icons',
      }),
      copy({
        targets: [{ src: 'src/icons/*.svg', dest: 'dist/icons' }],
        verbose: true,
      }),

      postcss({ extract: 'index.css' }),
      ...config.plugins,
    ];

    return config;
  },
};
