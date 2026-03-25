"use client";

import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaBalanceScale, FaBars, FaHeart, FaLock, FaPlus, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useAdminSession } from "@/components/AdminSession/AdminSessionProvider";
import { useCompare } from "@/components/Compare/CompareProvider";
import titleImg from "@/images/title.png";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { isAdmin, isCheckingSession, logout } = useAdminSession();
  const { selectedCount } = useCompare();

  const handleLogout = async () => {
    try {
      await logout();

      if (pathname === "/create") {
        router.push("/home");
      }
    } catch {
      alert("Failed to end the admin session.");
    }
  };

  const handleUserSignOut = async () => {
    try {
      await signOut();

      if (pathname === "/favorites") {
        router.push("/home");
      }
    } catch {
      alert("Failed to sign out.");
    }
  };

  return (
    <div className="bg-[#6a5f94] flex items-center justify-center fixed top-0 w-full z-50">
      <div className="w-full lg:max-w-[1280px] flex items-center py-4 px-6 relative">
        {/* Left side - Hamburger Menu */}
        <div className="flex items-center">
          <button
            type="button"
            className="text-white text-xl hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
            title="Menu"
          >
            <FaBars />
          </button>
        </div>

        {/* Center - Pokemon Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/home" className="block" title="Go Home">
            <Image 
              className="h-12 w-auto cursor-pointer" 
              src={titleImg} 
              alt="Pokemon title" 
              width={200}
              height={48}
            />
          </Link>
        </div>

        {/* Right side - Navigation */}
        <div className="flex gap-3 ml-auto">
          <Link
            href="/compare"
            className="relative text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
            title="Compare Pokemon"
          >
            <FaBalanceScale />
            {selectedCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-slate-900">
                {selectedCount}
              </span>
            )}
          </Link>

          {!isLoading &&
            (isAuthenticated ? (
              <>
                <Link
                  href="/favorites"
                  className="text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                  title="My Favorites"
                >
                  <FaHeart />
                </Link>
                <button
                  type="button"
                  onClick={handleUserSignOut}
                  className="text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                  title="Sign Out"
                >
                  <FaSignOutAlt />
                </button>
              </>
            ) : (
              <Link
                href={`/login?redirectTo=${encodeURIComponent(pathname || "/home")}`}
                className="text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                title="Sign In"
              >
                <FaSignInAlt />
              </Link>
            ))}

          {pathname === "/create" ? (
            <Link
              href="/home"
              className="text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
              title="Go Back"
            >
              <FaArrowLeft />
            </Link>
          ) : (
            <Link
              href="/create"
              className="text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
              title={isAdmin ? "Add New Pokemon" : "Admin Access"}
            >
              {isAdmin ? <FaPlus /> : <FaLock />}
            </Link>
          )}

          {isAdmin && !isCheckingSession && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
              title="End Admin Session"
            >
              <FaSignOutAlt />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
