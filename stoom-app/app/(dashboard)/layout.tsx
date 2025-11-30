import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
