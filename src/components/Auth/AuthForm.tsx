"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";

interface AuthFormProps {
  mode: "login" | "register";
}

const getSafeRedirectTo = (value: string | null, fallback = "/home") => {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  return value;
};

const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, signIn, signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = getSafeRedirectTo(searchParams.get("redirectTo"));
  const isRegister = mode === "register";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const result = await signUp({
          email,
          password,
          displayName,
        });

        if (result.requiresEmailConfirmation) {
          setSuccessMessage("Check your email to confirm your account before signing in.");
        } else {
          router.replace(redirectTo);
        }
      } else {
        await signIn(email, password);
        router.replace(redirectTo);
      }
    } catch (authError) {
      if (authError instanceof Error) {
        setError(authError.message);
      } else {
        setError("Authentication failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 className="text-3xl font-bold text-white mb-2 text-center">
        {isRegister ? "Create Account" : "Sign In"}
      </h1>
      <p className="text-white/80 text-center mb-8">
        {isRegister
          ? "Save your favorite Pokemon and keep your experience personalized."
          : "Sign in to access favorites and save your own Pokemon picks."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div>
            <label htmlFor="displayName" className="block text-white text-sm font-semibold mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl bg-white/90 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Trainer name"
              maxLength={40}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-white text-sm font-semibold mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl bg-white/90 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ash@pokemon.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-white text-sm font-semibold mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl bg-white/90 px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a secure password"
            minLength={6}
            required
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-white">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl bg-emerald-500/20 px-4 py-3 text-sm text-white">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#d14d41] py-3 text-white font-semibold transition-colors hover:bg-[#b8423a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? isRegister
              ? "Creating account..."
              : "Signing in..."
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="text-white/80 text-sm text-center mt-6">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={
            isRegister
              ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
              : `/register?redirectTo=${encodeURIComponent(redirectTo)}`
          }
          className="font-semibold text-yellow-300 hover:text-yellow-200"
        >
          {isRegister ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
};

export default AuthForm;
