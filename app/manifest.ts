import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Marrelay - Web, Data, SEO & CAD Studio in Toronto',
    short_name: 'Marrelay',
    description:
      'Toronto digital studio: web, data, SEO, social and engineering/CAD for startups in Canada and the US, at a fixed project price.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF6EC',
    theme_color: '#ED1C24',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
