'use client'
import { useUser } from "@auth0/nextjs-auth0"
import { DataTable } from "@/components/data-table"
import { columns, sampleData } from "@/components/vuln-columns"
import { Separator } from "@/components/ui/separator"

export default function Dashboard() {
    const { user, isLoading } = useUser()

    return (
        <>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl font-semibold">Hi {user?.name ?? 'there'}</h1>
            <Separator className="my-4" />

            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <section>
                    <h2 className="mb-3 text-lg font-medium">Open-source Vulnerabilities</h2>
                    <DataTable columns={columns} data={sampleData} />
                </section>
            )}
        </>
    )
}