const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/sudans-game-reader/'
    : '/',
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.json$/,
          type: 'javascript/auto',
          use: [
            {
              loader: 'raw-loader',
              options: {
                esModule: false
              }
            }
          ]
        }
      ]
    }
  }
})