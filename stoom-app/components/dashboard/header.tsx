"use client";

export function Header() {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{greeting()}</h2>
        <p className="text-xs text-muted-foreground">
          Ready to start your study session?
        </p>
      </div>
    </header>
  );
}

