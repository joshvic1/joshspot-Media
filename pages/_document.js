import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {process.env.GOOGLE_SITE_VERIFICATION && <meta name="google-site-verification" content={process.env.GOOGLE_SITE_VERIFICATION} />}
        {process.env.BING_SITE_VERIFICATION && <meta name="msvalidate.01" content={process.env.BING_SITE_VERIFICATION} />}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
