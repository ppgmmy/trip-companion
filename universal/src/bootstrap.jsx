import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import { AuthGate } from "./auth/AuthGate.jsx";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function Bootstrap() {
  if (!publishableKey) {
    return <App />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/universal/">
      <AuthGate>
        <App />
      </AuthGate>
    </ClerkProvider>
  );
}
