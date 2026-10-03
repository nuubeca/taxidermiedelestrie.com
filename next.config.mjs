/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "supabase.pelti.co" },
      { protocol: "https", hostname: "*.supabase.co" },
      ...(process.env.NODE_ENV === "development"
        ? [{ protocol: "http", hostname: "10.100.100.150" }]
        : []),
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
