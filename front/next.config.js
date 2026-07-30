const path = require('path');
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    forceSwcTransforms: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://goapp1:8100/api/:path*',
      },
    ];
  },

  webpack: (config) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        API_URL: JSON.stringify(process.env.API_URL || 'http://localhost:8100/api'),
      })
    );
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'src': path.resolve(__dirname, 'src'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@public': path.resolve(__dirname, 'public'),
    };

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        { loader: '@svgr/webpack', options: { svgo: true } },
        { loader: 'url-loader', options: { limit: 8192 } },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;