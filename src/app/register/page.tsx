"use client";

import { Suspense } from "react";
import Navbar from "@/components/Navbar/Navbar";
import AuthForm from "@/components/Auth/AuthForm";
import wallpaperImg from "@/images/wallpaper.jpg";

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${wallpaperImg.src})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <Navbar />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-24 pb-8">
        <Suspense fallback={null}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </div>
  );
}
