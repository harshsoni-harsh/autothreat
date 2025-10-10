"use client"
import { Auth0Provider } from "@auth0/nextjs-auth0"
import { Toaster } from "sonner"

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Auth0Provider>
            {children}
            <Toaster />
        </Auth0Provider>
    )
}
