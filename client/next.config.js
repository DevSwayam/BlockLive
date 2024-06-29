/** @type {import('next').NextConfig} */
module.exports = {
  env: { WALLET_CONNECT_PROJECT_ID: process.env.WALLET_CONNECT_PROJECT_ID },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback, // This spreads existing fallbacks
      "tfhe_bg.wasm": require.resolve("tfhe/tfhe_bg.wasm"),
    };
    return config;
  },
};
