import { auth0 } from "@/lib/auth0";
import { Sidebar } from "@/components/sidebar"
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export default async function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth0.getSession(); 
    if (!session || !session.user) {
        return <div>Please log in to access this page.</div>;
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
        <div className="flex min-h-screen">
            <Sidebar user={{ name: user?.name, email: user?.email, picture: user?.picture as string | undefined }} />
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    );
}
