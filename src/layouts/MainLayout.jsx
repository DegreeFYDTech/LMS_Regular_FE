import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AIFloatButton from "../components/AIFloatButton";

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {<Navbar />}
        <Outlet />
      </main>
      <AIFloatButton />
      <Footer />
    </div>
  );
};

export default MainLayout;
