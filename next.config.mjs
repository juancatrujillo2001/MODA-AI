/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // Allow data: URLs for base64 previews during development
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
