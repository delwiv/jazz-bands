import Document, { Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)

    return { ...initialProps }
  }

  render() {
    return (
      <html>
        <Head>
          <style>{`body { margin: 0 } /* custom! */`}</style>
          <link href="/static/material-font.css" rel="stylesheet" />
          <link rel="stylesheet" href="/static/materialize.min.css" />
          <link rel="icon" type="image/png" href="/static/favicon.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <body className="custom_class">
          <script src="/static/materialize.min.js" />
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
