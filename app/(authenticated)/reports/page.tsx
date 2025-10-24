'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, AlertTriangle, Shield, Package } from 'lucide-react'

interface Project {
    id: string
    projectName: string
    repoUrl: string
    description?: string
    createdAt: string
    tags: string[]
    _count: {
        sboms: number
    }
    sboms: Array<{
        id: string
        generatedAt: string
        vulnerabilitiesFound: number
        format: string
        tool: string
        commitHash: string
        componentsCount: number
        storageUrl: string | null
    }>
}

interface SbomEntry {
    sbomId: string
    projectId: string
    projectName: string
    repoUrl: string
    description?: string
    tags: string[]
    generatedAt: string
    vulnerabilitiesFound: number
    componentsCount: number
    format: string
    tool: string
    commitHash: string
    storageUrl: string | null
}

export default function ReportsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProject, setSelectedProject] = useState('all')
    const [selectedFormat, setSelectedFormat] = useState('all')
    const [activeDownload, setActiveDownload] = useState<string | null>(null)

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects')
            if (response.ok) {
                const data = await response.json()
                setProjects(data)
                setError(null)
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
            setError('We were unable to load your reports. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const totalProjects = projects.length
    const totalSboms = projects.reduce((sum, project) => sum + project._count.sboms, 0)
    const totalVulnerabilities = projects.reduce((sum, project) =>
        sum + project.sboms.reduce((sbomSum, sbom) => sbomSum + sbom.vulnerabilitiesFound, 0), 0
    )
    const totalComponents = projects.reduce((sum, project) =>
        sum + project.sboms.reduce((sbomSum, sbom) => sbomSum + sbom.componentsCount, 0), 0
    )

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const sbomEntries = useMemo<SbomEntry[]>(() => {
        return projects.flatMap((project) =>
            project.sboms.map((sbom) => ({
                sbomId: sbom.id,
                projectId: project.id,
                projectName: project.projectName,
                repoUrl: project.repoUrl,
                description: project.description,
                tags: project.tags,
                generatedAt: sbom.generatedAt,
                vulnerabilitiesFound: sbom.vulnerabilitiesFound,
                componentsCount: sbom.componentsCount,
                format: sbom.format,
                tool: sbom.tool,
                commitHash: sbom.commitHash,
                storageUrl: sbom.storageUrl,
            }))
        )
    }, [projects])

    const filteredSboms = useMemo(() => {
        const loweredSearch = searchTerm.trim().toLowerCase()

        return sbomEntries.filter((entry) => {
            const matchesProject = selectedProject === 'all' || entry.projectId === selectedProject
            const matchesFormat = selectedFormat === 'all' || entry.format.toLowerCase() === selectedFormat
            const matchesSearch =
                loweredSearch.length === 0 ||
                [
                    entry.projectName,
                    entry.repoUrl,
                    entry.tool,
                    entry.commitHash,
                    entry.format,
                ]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(loweredSearch))

            return matchesProject && matchesFormat && matchesSearch
        })
    }, [sbomEntries, searchTerm, selectedProject, selectedFormat])

    const projectOptions = useMemo(() => {
        return projects.map((project) => ({ id: project.id, name: project.projectName }))
    }, [projects])

    const formatOptions = useMemo(() => {
        const formats = new Set<string>()
        sbomEntries.forEach((entry) => formats.add(entry.format.toLowerCase()))
        return Array.from(formats)
    }, [sbomEntries])

    const handleDownload = async (url: string, filename: string, key: string) => {
        setActiveDownload(key)
        try {
            let fetchUrl = url
            if (url.startsWith('s3://')) {
                fetchUrl = url.replace('s3://', process.env.AWS_S3_ENDPOINT || 'http://localhost:4566/')
            }

            const isLocalStack = fetchUrl.includes('localhost:4566') || fetchUrl.includes('localstack')
            const fetchOptions = isLocalStack
                ? {
                    method: 'GET',
                    headers: {
                        'Accept': '*/*',
                        'Cache-Control': 'no-cache',
                    },
                    mode: 'cors' as RequestMode,
                }
                : { credentials: 'include' as RequestCredentials }

            const response = await fetch(fetchUrl, fetchOptions)
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error')
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
            }

            const contentDisposition = response.headers.get('content-disposition')
            const suggestedName = contentDisposition?.match(/filename="?([^";]+)"?/)?.[1]

            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = suggestedName ?? filename
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(blobUrl)
        } catch (downloadError) {
            console.error('Download failed:', downloadError)
            const errorMessage = downloadError instanceof Error ? downloadError.message : 'Unknown error occurred'
            alert(`We could not download the selected report. Error: ${errorMessage}`)
        } finally {
            setActiveDownload(null)
        }
    }

    const handleDownloadSbom = async (entry: SbomEntry) => {
        if (!entry.storageUrl) {
            alert('The SBOM artifact is not available for download yet.')
            return
        }

        await handleDownload(entry.storageUrl, `sbom-${entry.projectName}-${entry.commitHash || entry.sbomId}.json`, `${entry.sbomId}-sbom`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading reports...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold">Reports</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Access generated SBOMs, vulnerability assessments, and supporting evidence for every monitored project.
                    Use filters to locate specific reports and download artifacts for auditors or engineering teams.
                </p>
            </div>

            {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Report Snapshot */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Projects Covered</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProjects}</div>
                        <p className="text-xs text-muted-foreground">
                            Projects with at least one generated report
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total SBOMs</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSboms}</div>
                        <p className="text-xs text-muted-foreground">
                            Software Bill of Materials generated in the last cycle
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vulnerabilities</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVulnerabilities}</div>
                        <p className="text-xs text-muted-foreground">
                            Open findings awaiting remediation
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Components</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalComponents}</div>
                        <p className="text-xs text-muted-foreground">
                            Components discovered across all scans
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter Reports</CardTitle>
                    <CardDescription>Refine the report catalog by project, format, or metadata.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="report-search">Search</Label>
                            <Input
                                id="report-search"
                                placeholder="Search project, repository, tool, commit..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="report-project">Project</Label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder="All projects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All projects</SelectItem>
                                    {projectOptions.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="report-format">SBOM Format</Label>
                            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder="All formats" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All formats</SelectItem>
                                    {formatOptions.map((format) => (
                                        <SelectItem key={format} value={format}>
                                            {format.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setSearchTerm('')
                                    setSelectedProject('all')
                                    setSelectedFormat('all')
                                }}
                            >
                                Reset filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SBOM Catalog */}
            <Card>
                <CardHeader>
                    <CardTitle>Generated Reports</CardTitle>
                    <CardDescription>
                        Download SBOM artifacts, vulnerability breakdowns, and supporting metadata for compliance packages.
                    </CardDescription>
                </CardHeader>
                <CardContent className='overflow-auto'>
                    {filteredSboms.length === 0 ? (
                        <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                            No reports match the current filters. Adjust your search to see more results.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Generated</TableHead>
                                    <TableHead>Format</TableHead>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Commit Hash</TableHead>
                                    <TableHead>Findings</TableHead>
                                    <TableHead>Components</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSboms.map((entry) => (
                                    <TableRow key={entry.sbomId}>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium">{entry.projectName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    <a
                                                        href={entry.repoUrl}
                                                        className="underline-offset-2 hover:underline"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {entry.repoUrl}
                                                    </a>
                                                </div>
                                                {entry.description && (
                                                    <div className="text-xs text-muted-foreground">{entry.description}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDateTime(entry.generatedAt)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{entry.format}</Badge>
                                        </TableCell>
                                        <TableCell>{entry.tool}</TableCell>
                                        <TableCell className="font-mono text-xs">{entry.commitHash || '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={entry.vulnerabilitiesFound > 0 ? 'destructive' : 'default'}>
                                                {entry.vulnerabilitiesFound}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{entry.componentsCount}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadSbom(entry)}
                                                    disabled={activeDownload === `${entry.sbomId}-sbom`}
                                                >
                                                    {activeDownload === `${entry.sbomId}-sbom` ? 'Downloading...' : 'Download SBOM'}
                                                </Button>
                                                {/* <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDownloadVulnerabilities(entry)}
                                                    disabled={activeDownload === `${entry.sbomId}-vulnerabilities`}
                                                >
                                                    {activeDownload === `${entry.sbomId}-vulnerabilities`
                                                        ? 'Preparing...'
                                                        : 'Vulnerability Report'}
                                                </Button> */}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
