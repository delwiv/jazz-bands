import { ReactRouter } from "react-router";
import { isbot } from "isbot";
import type { AppLoadContext, EntryContext } from "react-router";

interface Props {
  URL: string;
  context: EntryContext;
  loadContext: AppLoadContext;
}

export default async function ({ URL, context, loadContext }: Props) {
  const isBot = isbot(new URL(URL).pathname);
  
  if (isBot) {
    const { renderToString } = await import("react-dom/server");
    const reactRouter = renderToString(
      <ReactRouter context={context} url={URL} />
    );
    
    return new Response("<!DOCTYPE html>" + reactRouter, {
      headers: { "content-type": "text/html" },
    });
  }
  
  return new Response(
    "<!DOCTYPE html>" +
      `<html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://cdn.sanity.io" />
        </head>
        <body>
          <div id="root">
            <script type="text/javascript">
              window.__data = ${JSON.stringify(context)};
            </script>
            <script src="/__react-router-client/__build/vite-client.ts" type="module"></script>
          </div>
        </body>
      </html>`,
    {
      headers: { "content-type": "text/html" },
    });
}
