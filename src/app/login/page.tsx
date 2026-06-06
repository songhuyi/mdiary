"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import DarkToggle from "@/components/DarkToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("邮箱或密码错误");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-stone-900">
      <DarkToggle />
      {/* Left panel - brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-stone-300/30 dark:bg-stone-700/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-stone-300/30 dark:bg-stone-700/30 rounded-full blur-3xl" />
        </div>
        <div className="text-center relative z-10 animate-fade-in">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/60 dark:bg-stone-800/60 shadow-lg backdrop-blur-sm">
            <span className="text-5xl font-serif text-stone-800 dark:text-stone-100">墨</span>
          </div>
          <h2 className="text-2xl font-serif text-stone-800 dark:text-stone-100 mb-2">墨</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">记录生活，留住时光</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 bg-white dark:bg-stone-900">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800">
              <span className="text-3xl font-serif text-stone-800 dark:text-stone-100">墨</span>
            </div>
          </div>

          <h1 className="text-2xl font-serif text-stone-800 dark:text-stone-100 mb-8">登录</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg animate-fade-in">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 input-focus"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 dark:text-stone-400 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:outline-none bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 input-focus"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
            还没有账号？{" "}
            <Link href="/register" className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white underline underline-offset-4">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
