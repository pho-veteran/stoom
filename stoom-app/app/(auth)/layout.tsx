import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50/50 via-background to-slate-50/50 dark:from-slate-950 dark:via-background dark:to-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/20 to-transparent dark:via-violet-950/20" />
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-lg">
            S
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Stoom
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}

