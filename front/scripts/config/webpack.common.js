const WebpackBar = require('webpackbar')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require('webpack')
const path = require('path')
require('dotenv').config()
const CopyPlugin = require("copy-webpack-plugin")
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const Dotenv = require('dotenv-webpack');
const { PROJECT_PATH } = require('../constant')
const { isDevelopment, isProduction } = require('../env')


setTimeout(()=>{
    console.log(process.env.I,'kfljdnlgjfngjndfkjgnfkdjnkdng')
  },10)
console.log(process.env,'kfljdnlgjfngjndfkjgnfkdjnkdng')

const getCssLoaders = () => {
    const cssLoaders = [
        isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
        {
            loader: 'css-loader',
            options: {
                modules: {
                    localIdentName: "[local]--[hash:base64:5]"
                },
                sourceMap: isDevelopment,
            }
        }
    ]


    isProduction && cssLoaders.push({
        loader: 'postcss-loader',
        options: {
            postcssOptions: {
                plugins: [
                    isProduction && [
                        'postcss-preset-env',
                        {
                            autoprefixer: {
                                grid: true
                            }
                        }
                    ]
                ]
            }
        }
    })

    return cssLoaders
}
module.exports = {
    entry: {
        app: path.resolve(PROJECT_PATH, './src/index.tsx')
    },
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename],
        },
    },
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [...getCssLoaders()]
            },
            {
                test: /\.less$/,
                use: [
                    ...getCssLoaders(),
                    {
                        loader: 'less-loader',
                        options: {
                            sourceMap: isDevelopment,
                        }
                    }
                ]
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    ...getCssLoaders(),
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: isDevelopment,
                        }
                    }
                ]
            },
            {
                test: /\.(tsx?|jsx?)$/,
                loader: 'babel-loader',
                options: { cacheDirectory: true },
                exclude: /node_modules/,
            },
            {
                test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024,
                    },
                },
            },

            {
                test: /\.svg$/i,
                issuer: /\.[jt]sx?$/,
                use: ['@svgr/webpack', 'url-loader'],
            },
            {
                test: /\.(eot|ttf|woff|woff2?)$/,
                type: 'asset/resource',
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(PROJECT_PATH, './index.html'),
        }),
        new WebpackBar({
            name: 'Link Startou!!!',
            color: '#52c41a'
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                configFile: path.resolve(PROJECT_PATH, './tsconfig.json'),
            },
        }),
        new Dotenv(),
        new CopyPlugin({
            patterns: [
                {
                    context: 'public',
                    from: '*',
                    to: path.resolve(PROJECT_PATH, './dist/public'),
                    noErrorOnMissing: true,
                    toType: 'dir',
                    globOptions: {
                        dot: true,
                        gitignore: true,
                        ignore: ['**/index.html'],		// ** Represents any directory
                    },
                },
            ],
        }),
        new webpack.DefinePlugin({
            API_URL: JSON.stringify(process.env.I)
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
            'src': path.resolve(__dirname, '../../src'),
        }
    },
}