const { merge } = require('webpack-merge')
const path = require('path')
const webpack = require('webpack')

const common = require('./webpack.common')
const { PROJECT_PATH, SERVER_HOST, SERVER_PORT } = require('../constant')

module.exports = merge(common, {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    output: {
        filename: 'js/[name].js',
        path: path.resolve(PROJECT_PATH, './dist'),
        publicPath:"/"
    },
    devServer: {
        host: SERVER_HOST,
        port: SERVER_PORT,
        historyApiFallback: true,
        compress: true,
        open: true,
        hot: true,
        allowedHosts: 'all'
    },
    plugins: [
        // Really only opens hot: True automatically identifies whether there is no declaration that the plugin is automatically introduced, but it is afraid that there is a hidden problem here or manual plus.
        new webpack.HotModuleReplacementPlugin(),
    ],
    target: 'web',
})