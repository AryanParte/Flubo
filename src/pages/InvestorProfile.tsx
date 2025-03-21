
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfileTab } from "@/components/investor/ProfileTab";

const InvestorProfile = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-2xl font-bold mb-8">Investor Profile</h1>
          <ProfileTab />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InvestorProfile;
