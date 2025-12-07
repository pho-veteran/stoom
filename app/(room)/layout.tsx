import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      {children}
    </div>
  );
}

