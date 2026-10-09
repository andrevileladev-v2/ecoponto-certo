import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
    partialPrefetching: true,
      async rewrites() {
          return [
                {
                        source: '/api/:path*',
                                destination: 'http://localhost:3333/api/:path*',
                                      },
                                          ];
                                            },
                                            };

                                            export default nextConfig;
