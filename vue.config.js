const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
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