/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "taxidermiedelestrie.com",
      },
      {
        protocol: "http",
        hostname: "taxidermiedelestrie.com",
      },
      {
        protocol: "https",
        hostname: "www.taxidermiedelestrie.com",
      },
    ],
  },
};

export default nextConfig;
