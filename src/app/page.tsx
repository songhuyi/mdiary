import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-stone-50 via-stone-100 to-stone-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-stone-200/30 dark:bg-stone-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-stone-200/30 dark:bg-stone-700/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-stone-300/50 dark:bg-stone-600/50 rounded-full animate-float" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-stone-400/40 dark:bg-stone-500/40 rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-stone-300/60 dark:bg-stone-600/60 rounded-full animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="text-center max-w-md relative z-10 animate-fade-in-up">
        {/* Brand icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/80 dark:bg-stone-800/80 shadow-lg backdrop-blur-sm">
          <span className="text-4xl font-serif text-stone-800 dark:text-stone-100">墨</span>
        </div>

        <h1 className="text-4xl font-serif text-stone-800 dark:text-stone-100 mb-3">墨</h1>
        <p className="text-stone-500 dark:text-stone-400 mb-8 leading-relaxed text-sm">
          记录生活中的每一个瞬间<br />
          写日记、连载小说、偶得的感受<br />
          让文字留住时光
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="btn-primary px-6 py-2.5 text-center"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 rounded-lg text-sm hover:bg-white/50 dark:hover:bg-stone-800/50 transition-all text-center"
          >
            注册
          </Link>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-stone-300 dark:via-stone-600 to-transparent" />
    </div>
  );
}
