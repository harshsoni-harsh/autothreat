import { auth0 } from "@/lib/auth0";
import { Sidebar } from "@/components/sidebar"
import { PrismaClient } from "@/generated/prisma";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth0.getSession();
    if (!session || !session.user) {
        redirect('/auth/login');
    }
    const user = session.user;
    try {
        const existingUser = await prisma.user.findFirst({
            where: { email: user.email },
        })
        if (!existingUser) {
            await prisma.user.create({
                data: {
                    email: user.email!,
                    name: user.name || "User",
                },
            });
        }
    } catch (error) {
        console.error("Error updating lastLoggedIn:", error);
    }

    return (
        <div className="flex min-h-screen max-w-screen max-h-screen">
            <Sidebar user={{ name: user?.name, email: user?.email, picture: user?.picture as string | undefined }} />
            <main className="flex-1 p-6 overflow-auto">
                {children}
            </main>
        </div>
    );
}
