import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', './routes/index.tsx'),
  route('/galerie', './routes/galerie.tsx'),
  route('/robots.txt', './routes/robots.txt.tsx'),
  route('/sitemap.xml', './routes/sitemap.xml.tsx'),
  route('*', './routes/__catchall.tsx'),
] satisfies RouteConfig
