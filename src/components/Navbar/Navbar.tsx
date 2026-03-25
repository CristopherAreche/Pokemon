"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaBalanceScale,
  FaBars,
  FaHeart,
  FaLock,
  FaPlus,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useAdminSession } from "@/components/AdminSession/AdminSessionProvider";
import { useCompare } from "@/components/Compare/CompareProvider";
import { useFavorites } from "@/components/Favorites/FavoritesProvider";
import titleImg from "@/images/title.png";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut } = useAuth();
  const { isAdmin, isCheckingSession, logout } = useAdminSession();
  const { selectedCount } = useCompare();
  const { favoriteCount } = useFavorites();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);

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
      setIsMobileMenuOpen(false);

      if (pathname === "/favorites") {
        router.push("/home");
      }
    } catch {
      alert("Failed to sign out.");
    }
  };

  const navButtonClass =
    "text-white text-xl font-bold hover:text-yellow-300 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all";
  const mobileMenuItemClass =
    "flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-white transition-colors hover:bg-white/20";

  return (
    <div className="bg-[#6a5f94] flex items-center justify-center fixed top-0 w-full z-50">
      <div className="w-full lg:max-w-[1280px] flex items-center py-4 px-6 relative">
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={navButtonClass}
            title="Menu"
            aria-label="Open menu"
          >
            <FaBars />
          </button>
        </div>

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

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <Link
            href="/compare"
            className={`relative ${navButtonClass}`}
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
                  className={`relative ${navButtonClass}`}
                  title="My Favorites"
                >
                  <FaHeart />
                  {favoriteCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-400 px-1 text-xs font-bold text-slate-900">
                      {favoriteCount}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={handleUserSignOut}
                  className={navButtonClass}
                  title="Sign Out"
                >
                  <FaSignOutAlt />
                </button>
              </>
            ) : (
              <Link
                href={`/login?redirectTo=${encodeURIComponent(pathname || "/home")}`}
                className={navButtonClass}
                title="Sign In"
              >
                <FaSignInAlt />
              </Link>
            ))}

          {pathname === "/create" ? (
            <Link
              href="/home"
              className={navButtonClass}
              title="Go Back"
            >
              <FaArrowLeft />
            </Link>
          ) : (
            <Link
              href="/create"
              className={navButtonClass}
              title={isAdmin ? "Add New Pokemon" : "Admin Access"}
            >
              {isAdmin ? <FaPlus /> : <FaLock />}
            </Link>
          )}

          {isAdmin && !isCheckingSession && (
            <button
              type="button"
              onClick={handleLogout}
              className={navButtonClass}
              title="End Admin Session"
            >
              <FaSignOutAlt />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          {!isLoading &&
            (isAuthenticated ? (
              <Link
                href="/favorites"
                className={`relative ${navButtonClass}`}
                title="My Favorites"
              >
                <FaHeart />
                {favoriteCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-400 px-1 text-xs font-bold text-slate-900">
                    {favoriteCount}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                href={`/login?redirectTo=${encodeURIComponent(pathname || "/home")}`}
                className={navButtonClass}
                title="Sign In"
              >
                <FaSignInAlt />
              </Link>
            ))}

          {pathname === "/create" && (
            <Link
              href="/home"
              className={navButtonClass}
              title="Go Back"
            >
              <FaArrowLeft />
            </Link>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />

          <div className="fixed left-0 top-0 h-screen w-[280px] bg-[#4c4470] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <p className="text-lg font-semibold text-white">Menu</p>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className={navButtonClass}
                aria-label="Close menu"
                title="Close menu"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex flex-col gap-3 p-5">
              <Link
                href="/compare"
                className={mobileMenuItemClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <FaBalanceScale />
                  {selectedCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-slate-900">
                      {selectedCount}
                    </span>
                  )}
                </span>
                <span className="font-medium">Compare Pokemon</span>
              </Link>

              <Link
                href={
                  isAuthenticated
                    ? "/favorites"
                    : `/login?redirectTo=${encodeURIComponent("/favorites")}`
                }
                className={mobileMenuItemClass}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <FaHeart />
                  {favoriteCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-400 px-1 text-xs font-bold text-slate-900">
                      {favoriteCount}
                    </span>
                  )}
                </span>
                <span className="font-medium">My Favorites</span>
              </Link>

              {pathname !== "/create" && (
                <Link
                  href="/create"
                  className={mobileMenuItemClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                    {isAdmin ? <FaPlus /> : <FaLock />}
                  </span>
                  <span className="font-medium">{isAdmin ? "Add New Pokemon" : "Admin Access"}</span>
                </Link>
              )}

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleUserSignOut}
                  className={mobileMenuItemClass}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                    <FaSignOutAlt />
                  </span>
                  <span className="font-medium">Sign Out</span>
                </button>
              ) : (
                <Link
                  href={`/login?redirectTo=${encodeURIComponent(pathname || "/home")}`}
                  className={mobileMenuItemClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                    <FaSignInAlt />
                  </span>
                  <span className="font-medium">Sign In</span>
                </Link>
              )}

              {isAdmin && !isCheckingSession && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className={mobileMenuItemClass}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                    <FaSignOutAlt />
                  </span>
                  <span className="font-medium">End Admin Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
