
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MessagesTab } from "@/components/startup/MessagesTab";

const StartupMessages = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-2xl font-bold mb-8">Messages</h1>
          <MessagesTab />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StartupMessages;
