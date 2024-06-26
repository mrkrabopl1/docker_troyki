const { merge } = require('webpack-merge')
const path = require('path')

const TerserPlugin = require("terser-webpack-plugin")
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

const common = require('./webpack.common')
const { PROJECT_PATH } = require('../constant')

module.exports = merge(common, {
    mode: 'production',
    devtool: false,
    output: {
        filename: 'js/[name].[contenthash:8].js',
        path: path.resolve(PROJECT_PATH, './dist'),
        assetModuleFilename: 'images/[name].[contenthash:8].[ext]',
        publicPath : '/'
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash:8].css',
            chunkFilename: 'css/[name].[contenthash:8].chunk.css',
        })
    ],
    optimization: {
        minimize: true,
        minimizer:[
            new CssMinimizerPlugin(),
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    compress: { pure_funcs: ['console.log'] },
                }
            }),
        ],
        splitChunks: {
            chunks: 'all',
            minSize: 0,
        },
    },
    target: 'browserslist',
})