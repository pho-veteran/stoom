import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const { userId } = await auth();
  
  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">
          Start your collaborative learning journey today
        </p>
      </div>
      <div className="w-full">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "shadow-xl border-2 border-border/50 bg-card/95 backdrop-blur",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border hover:bg-accent",
              formButtonPrimary: "bg-violet-600 hover:bg-violet-700 text-white",
              footerActionLink: "text-violet-600 hover:text-violet-700",
            },
          }}
        />
      </div>
    </div>
  );
}

