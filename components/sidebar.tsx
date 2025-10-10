"use client"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { User, LogOut } from "lucide-react"

type SidebarProps = {
    user?: { name?: string | null; email?: string | null; picture?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
    return (
        <aside className="flex min-h-full w-64 flex-col border-r bg-sidebar p-4">
            <div className="flex items-center gap-2 px-2">
                <Image loading="eager" src="/logo.png" alt="Logo" width={32} height={32} className="rounded" />
                <span className="text-lg font-semibold">Autothreat</span>
            </div>
            <nav className="mt-6 flex-1 space-y-1">
                <Link href="#" className="block rounded-md px-3 py-2 hover:bg-accent">
                    Overview
                </Link>
                <Link href="#" className="block rounded-md px-3 py-2 hover:bg-accent">
                    Projects
                </Link>
                <Link href="#" className="block rounded-md px-3 py-2 hover:bg-accent">
                    Vulnerabilities
                </Link>
                <Link href="#" className="block rounded-md px-3 py-2 hover:bg-accent">
                    Reports
                </Link>
            </nav>
            <div className="relative group z-0">
                <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg mt-2">
                    <CardContent className="flex items-center gap-3 p-3">
                        <Avatar>
                            <AvatarImage src={user?.picture ?? "/vercel.svg"} alt={user?.name ?? "User"} />
                            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{user?.name ?? "User"}</p>
                            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="font-medium text-sm border -z-10 absolute group-hover:bottom-full group-hover:-top-full inset-0 bg-card/95 backdrop-blur-sm rounded-lg transition-all duration-500 grid grid-cols-2 items-center justify-center gap-2 p-2 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 ease-[cubic-bezier(0.4,0,0.2,1)] [&>*]:hover:bg-accent [&>*]:rounded-md">
                    <Link prefetch={false} href="/profile" className="flex-1 flex flex-col items-center hover:bg-accent rounded-md py-2 px-4" tabIndex={-1}>
                        <User className="h-4 w-4" />
                        Profile
                    </Link>
                    <Link prefetch={false} href="/auth/logout" className="flex-1 flex flex-col items-center hover:bg-accent rounded-md py-2 px-4" tabIndex={-1}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Link>
                </div>
            </div>
        </aside>
    )
}
