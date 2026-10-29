import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BookKeep-It - Interactive Bookkeeping Learning Platform',
    short_name: 'BookKeep-It',
    description: 'Master bookkeeping principles, debits & credits, journals, trial balance, and financial statements.',
    start_url: '/',
    display: 'standalone',
    background_color: '#023e8a',
    theme_color: '#0077b6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/logo.jpeg',
        sizes: '1254x1254',
        type: 'image/jpeg'
      }
    ]
  };
}
