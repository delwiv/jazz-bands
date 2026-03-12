import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  route("$subdomain", "./routes/$subdomain/index.tsx", [
    route("musicians", "./routes/$subdomain/musicians.tsx"),
    route("tour", "./routes/$subdomain/tour.tsx"),
    route("music", "./routes/$subdomain/music.tsx"),
    route("contact", "./routes/$subdomain/contact.tsx"),
  ]),
] satisfies RouteConfig;
