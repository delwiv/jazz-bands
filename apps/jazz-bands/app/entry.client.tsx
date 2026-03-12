import { ReactRouterDevServer } from "@react-router/dev/server";
import { startReactRouterDevServer } from "@react-router/dev/vite";

import { isbot } from "isbot";

declare global {
  namespace App {
    interface LoaderData {
      subdomain: string;
      origin: string;
    }
  }
}

if (!import.meta.env.SSR) {
  await ReactRouterDevServer();
}

export default startReactRouterDevServer({
  isSpaMode: false,
  getLoadContext: () => ({}),
});
