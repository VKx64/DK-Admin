import { Geist, Geist_Mono, Raleway } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import SideNavigation from "@/components/v1/SideNavigation";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Daikin Admin",
  description: "Admin dashboard for Daikin",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-row w-screen h-screen ${inter.className}`}>
        <AuthProvider>
          <SideNavigation />
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
