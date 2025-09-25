// src/lib/auth.ts - Better Auth Client Configuration
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://localhost:3000",
  fetchOptions: {
    credentials: "include",
  },
})

// Export individual methods for easier usage
export const {
  signIn,
  signUp,
  signOut,
  getSession,
  updateUser,
  useSession,
} = authClient

