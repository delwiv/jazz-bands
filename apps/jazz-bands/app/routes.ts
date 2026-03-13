import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/', './routes/index.tsx'),
  route('/musicians', './routes/musicians.tsx'),
  route('/tour', './routes/tour.tsx'),
  route('/music', './routes/music.tsx'),
  route('/contact', './routes/contact.tsx'),
  route('*', './routes/__catchall.tsx'),
] satisfies RouteConfig
