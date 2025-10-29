import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Report Images",
  description: "Upload and manage incident report images for schools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
