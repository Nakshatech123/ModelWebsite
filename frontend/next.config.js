// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    // Add Cesium alias so it resolves cleanly
    config.resolve.alias = {
      ...config.resolve.alias,
      cesium: path.resolve(__dirname, 'node_modules/cesium'),
    };

    // Allow importing Cesium CSS
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
      include: path.resolve(__dirname, 'node_modules/cesium'),
    });

    return config;
  },
};

module.exports = nextConfig;
