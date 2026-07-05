import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Picture to PDF - Free Image to PDF Converter",
  description:
    "Convert your images to PDF for free. No signup required. Support JPG, PNG, WebP and more. Fast, private, and easy to use.",
  keywords: "image to pdf, picture to pdf, jpg to pdf, png to pdf, free converter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
