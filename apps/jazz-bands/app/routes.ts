import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', './routes/index.tsx'),
  route('/musicians', './routes/musicians/_index.tsx'),
  route('/musicians/$musicianSlug', './routes/musicians/$musicianSlug.tsx'),
  route('/tour', './routes/tour/_index.tsx'),
  route('/tour/$tourDateSlug', './routes/tour/$tourDateSlug.tsx'),
  route('/contact', './routes/contact.tsx'),
  route('*', './routes/__catchall.tsx'),
] satisfies RouteConfig
