import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import "../styles/global.css";

const MyApp = ({ Component, pageProps }: AppProps) => (
  <SessionProvider>
    <Component {...pageProps} />
  </SessionProvider>
);

export default MyApp;

