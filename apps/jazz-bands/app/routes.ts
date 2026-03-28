import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', './routes/index.tsx'),
  route('/gallery', './routes/gallery.tsx'),
  route('/musicians', './routes/musicians/index.tsx'),
  route('/musicians/:musicianSlug', './routes/musicians/slug.tsx'),
  route('/tour', './routes/tour/index.tsx'),
  route('/tour/:tourDateSlug', './routes/tour/slug.tsx'),
  route('/contact', './routes/contact.tsx'),
  route('*', './routes/__catchall.tsx'),
] satisfies RouteConfig
