"use client";

import Link from "next/link";
import Image from "next/image";
import ashImg from "@/images/ash.png";
import titleImg from "@/images/title.png";
import wallpaperImg from "@/images/wallpaper.jpg";

export default function LandingPage() {
  return (
    <div
      className="flex justify-center items-center h-screen w-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${wallpaperImg.src})`,
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="bg-white/30 flex h-auto w-full max-w-4xl p-4 justify-center rounded-2xl shadow-2xl backdrop-blur-sm relative z-10">
        <div className="w-2/5 h-full hidden md:flex justify-center items-center p-4">
          <Image
            className="w-full h-full object-cover object-center"
            src={ashImg}
            alt="Ash Ketchum"
            width={500}
            height={500}
          />
        </div>
        <div className="p-8 w-full md:w-3/5 flex flex-col items-center justify-evenly text-gray-800 text-justify text-lg space-y-6">
          <Image
            className="w-64 md:w-72"
            src={titleImg}
            alt="Pokemon title"
            width={272}
            height={100}
          />
          <p>
            Welcome to my new page for viewing and creating Pokemon! This page
            has been created especially for Pokemon enthusiasts who want to
            explore the fascinating world of Pokemon and create their own pocket
            monsters.
          </p>
          <Link href="/home">
            <button 
              className="rounded-full text-white text-lg border-none h-12 px-6 transition-colors"
              style={{ backgroundColor: '#d14d41' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b8423a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#d14d41'}
            >
              Go Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
