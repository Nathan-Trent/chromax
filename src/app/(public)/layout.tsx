import { SessionExpiryWatcher } from "@/components/SessionExpiryWatcher";
import { Footer } from "@/components/public/Footer";
import { Nav } from "@/components/public/Nav";

/** Public pages inherit `GoogleReCaptchaProvider` from the root layout (`src/app/layout.tsx`). */
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <SessionExpiryWatcher />
      <Nav />
      <main className="flex-1 w-full pt-16">
        <div className="animate-fade-in">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
