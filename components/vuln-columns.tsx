"use client"
import { ColumnDef } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type Vulnerability = {
    id: string
    package: string
    version: string
    cve: string
    severity: "critical" | "high" | "medium" | "low" | "none"
    cvss?: number
    projectsAffected?: number
    affected: string
    fixed: string | null
    status: "open" | "mitigated" | "resolved" | "ignored"
}

export const columns: ColumnDef<Vulnerability>[] = [
    { accessorKey: "package", header: "Package" },
    { accessorKey: "version", header: "Version" },
    { accessorKey: "cve", header: "CVE" },
    {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ getValue }) => {
            const sev = getValue() as Vulnerability["severity"]
            const map: Record<Vulnerability["severity"], { label: string; variant: any }> = {
                critical: { label: "Critical", variant: "destructive" },
                high: { label: "High", variant: "destructive" },
                medium: { label: "Medium", variant: "warning" },
                low: { label: "Low", variant: "default" },
                none: { label: "None", variant: "success" },
            }
            const { label, variant } = map[sev]
            return <Badge variant={variant as any}>{label}</Badge>
        },
    },
    { accessorKey: "cvss", header: "CVSS", cell: ({ getValue }) => (getValue() ? (getValue() as number).toFixed(1) : "-") },
    { accessorKey: "projectsAffected", header: "Projects", cell: ({ getValue }) => getValue() ?? 0 },
    { accessorKey: "affected", header: "Affected Range" },
    {
        accessorKey: "fixed",
        header: "Fixed In",
        cell: ({ getValue }) => getValue() ?? "-",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
            const st = getValue() as Vulnerability["status"]
            const map: Record<Vulnerability["status"], { label: string; variant: any }> = {
                open: { label: "Open", variant: "destructive" },
                mitigated: { label: "Mitigated", variant: "warning" },
                resolved: { label: "Resolved", variant: "success" },
                ignored: { label: "Ignored", variant: "outline" },
            }
            const { label, variant } = map[st]
            return <Badge variant={variant as any}>{label}</Badge>
        },
    },
    {
        id: "actions",
        header: "VEX",
        cell: ({ row }) => {
            const vuln = row.original
            return (
                <Button size="sm" onClick={() => alert(`VEX for ${vuln.package} ${vuln.cve}`)}>Generate VEX</Button>
            )
        },
    },
]

export const sampleData: Vulnerability[] = [
    {
        id: "1",
        package: "lodash",
        version: "4.17.21",
        cve: "CVE-2021-23337",
        severity: "high",
        cvss: 7.4,
        projectsAffected: 3,
        affected: ">=4.17.0 <4.17.21",
        fixed: "4.17.21",
        status: "resolved",
    },
    {
        id: "2",
        package: "axios",
        version: "0.21.1",
        cve: "CVE-2021-3749",
        severity: "medium",
        cvss: 5.6,
        projectsAffected: 2,
        affected: "<0.21.2",
        fixed: "0.21.2",
        status: "mitigated",
    },
    {
        id: "3",
        package: "react",
        version: "18.2.0",
        cve: "-",
        severity: "none",
        cvss: 0,
        projectsAffected: 0,
        affected: "-",
        fixed: null,
        status: "open",
    },
]
