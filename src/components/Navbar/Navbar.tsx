"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FaArrowLeft, FaPlus, FaBars } from "react-icons/fa";
import { usePathname } from "next/navigation";
import titleImg from "@/images/title.png";

const Navbar = () => {
  const [isOnCreatePage, setIsOnCreatePage] = useState(false);
  const pathname = usePathname();

  const handleClick = () => {
    setIsOnCreatePage(!isOnCreatePage);
  };

  return (
    <div className="bg-[#6a5f94] flex items-center justify-center fixed top-0 w-full z-50">
      <div className="w-full lg:max-w-[1280px] flex items-center py-4 px-6 relative">
        {/* Left side - Hamburger Menu */}
        <div className="flex items-center">
          <button className="text-white text-xl hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                  title="Menu">
            <FaBars />
          </button>
        </div>

        {/* Center - Pokemon Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Image 
            className="h-12 w-auto" 
            src={titleImg} 
            alt="Pokemon title" 
            width={200}
            height={48}
          />
        </div>

        {/* Right side - Navigation */}
        <div className="flex gap-6 ml-auto">
          {pathname === "/create" ? (
            <Link
              onClick={handleClick}
              href="/home"
              className="text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
              title="Go Back"
            >
              <FaArrowLeft />
            </Link>
          ) : (
            <Link
              onClick={handleClick}
              href="/create"
              className="text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
              title="Add New Pokemon"
            >
              <FaPlus />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;