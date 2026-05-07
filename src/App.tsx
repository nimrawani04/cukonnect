import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Search from "./pages/Search.tsx";
import RideDetail from "./pages/RideDetail.tsx";
import Publish from "./pages/Publish.tsx";
import PublishRide from "./pages/PublishRide.tsx";
import Trips from "./pages/Trips.tsx";
import Auth from "./pages/Auth.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Profile from "./pages/Profile.tsx";
import About from "./pages/About.tsx";
import NotFound from "./pages/NotFound.tsx";
import { useRideMessageNotifications } from "@/hooks/useRideMessageNotifications";
import { useTheme } from "@/hooks/useTheme";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useRideMessageNotifications();
  useTheme();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/search" element={<Search />} />
      <Route path="/ride/:id" element={<RideDetail />} />
      <Route path="/publish" element={<Publish />} />
      <Route path="/publish/new" element={<PublishRide />} />
      <Route path="/trips" element={<Trips />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/about" element={<About />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
