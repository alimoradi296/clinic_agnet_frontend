const path = require("path")

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingRoot: undefined,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Explicitly add webpack configuration to resolve aliases
  webpack: (config, { isServer }) => {
    config.resolve.alias["@/components"] = path.join(__dirname, "components")
    config.resolve.alias["@/lib"] = path.join(__dirname, "lib")
    config.resolve.alias["@/app"] = path.join(__dirname, "app")
    return config
  },
}

module.exports = nextConfig
