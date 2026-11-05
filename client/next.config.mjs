/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add Enterprise-Grade Production Security Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 1. Force HTTPS with HSTS (preload, subdomains, 2 years)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // 2. Prevent Clickjacking attacks (prevents embedding in malicious iframes)
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // 3. Prevent MIME Sniffing attacks
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 4. Cross-site scripting (XSS) filter
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // 5. Control Referrer Information Leaks
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 6. Disable device sensor access by unauthorized third parties
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          // 7. Prevent DNS prefetching exploits
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
