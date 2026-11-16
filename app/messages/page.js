import MessagesSection from "@/components/MessagesSection";
import LandingTabBar from "@/components/LandingTabBar";

export default function MessagesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-24">
      <main className="flex-1">
        <MessagesSection />
      </main>

      <LandingTabBar />
    </div>
  );
}