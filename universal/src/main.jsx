import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import { AuthGate, AuthNotConfigured } from "./auth/AuthGate.jsx";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/universal/">
        <AuthGate>
          <App />
        </AuthGate>
      </ClerkProvider>
    ) : (
      <AuthNotConfigured />
    )}
  </StrictMode>,
);
