const { defineConfig } = require('@vue/cli-service')
//gitub.com/mqttjs/MQTT.js
const webpack = require('webpack');
module.exports = defineConfig({
  filenameHashing: false,
  productionSourceMap: false,
  css: {
    extract: false
  },
  configureWebpack: {
    optimization: {
      splitChunks: false
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
    ],
  },
})
