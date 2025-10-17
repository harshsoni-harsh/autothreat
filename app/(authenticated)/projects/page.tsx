'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink, Calendar, FileText, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react'

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
        storageUrl: string
    }>
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [detailedProject, setDetailedProject] = useState<Project | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        projectName: '',
        repoUrl: '',
        description: '',
        tags: '',
    })

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects')
            if (response.ok) {
                const data = await response.json()
                setProjects(data)
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditProject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingProject) return

        setCreating(true)

        try {
            const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

            const response = await fetch('/api/projects', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: editingProject.id,
                    projectName: formData.projectName,
                    repoUrl: formData.repoUrl,
                    description: formData.description,
                    tags,
                }),
            })

            if (response.ok) {
                const updatedProject = await response.json()
                setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p))
                setIsEditDialogOpen(false)
                setEditingProject(null)
                setFormData({ projectName: '', repoUrl: '', description: '', tags: '' })
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to update project')
            }
        } catch (error) {
            console.error('Error updating project:', error)
            alert('Failed to update project')
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project? This will also delete all associated SBOMs.')) {
            return
        }

        try {
            const response = await fetch(`/api/projects?id=${projectId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setProjects(prev => prev.filter(p => p.id !== projectId))
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete project')
            }
        } catch (error) {
            console.error('Error deleting project:', error)
            alert('Failed to delete project')
        }
    }

    const handleDeleteSbom = async (sbomId: string) => {
        if (!confirm('Are you sure you want to delete this SBOM?')) {
            return
        }

        try {
            const response = await fetch(`/api/sbom?id=${sbomId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                // Refresh projects to get updated data
                await fetchProjects()
                setIsDetailDialogOpen(false)
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to delete SBOM')
            }
        } catch (error) {
            console.error('Error deleting SBOM:', error)
            alert('Failed to delete SBOM')
        }
    }

    const openEditDialog = (project: Project) => {
        setEditingProject(project)
        setFormData({
            projectName: project.projectName,
            repoUrl: project.repoUrl,
            description: project.description || '',
            tags: project.tags.join(', '),
        })
        setIsEditDialogOpen(true)
    }

    const openDetailDialog = (project: Project) => {
        setDetailedProject(project)
        setIsDetailDialogOpen(true)
    }

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectName: formData.projectName,
                    repoUrl: formData.repoUrl,
                    description: formData.description,
                    tags,
                }),
            })

            if (response.ok) {
                const newProject = await response.json()
                setProjects(prev => [newProject, ...prev])
                setIsDialogOpen(false)
                setFormData({ projectName: '', repoUrl: '', description: '', tags: '' })
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to create project')
            }
        } catch (error) {
            console.error('Error creating project:', error)
            alert('Failed to create project')
        } finally {
            setCreating(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading projects...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Projects</h1>
                    <p className="text-muted-foreground">
                        Manage your software projects and their software bill of materials
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreateProject}>
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                    Add a new project to track its software bill of materials and vulnerabilities.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="projectName" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="projectName"
                                        value={formData.projectName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                                        className="col-span-3"
                                        placeholder="My Project"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="repoUrl" className="text-right">
                                        Repository
                                    </Label>
                                    <Input
                                        id="repoUrl"
                                        type="url"
                                        value={formData.repoUrl}
                                        onChange={(e) => setFormData(prev => ({ ...prev, repoUrl: e.target.value }))}
                                        className="col-span-3"
                                        placeholder="https://github.com/user/repo"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="col-span-3"
                                        placeholder="Project description..."
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="tags" className="text-right">
                                        Tags
                                    </Label>
                                    <Input
                                        id="tags"
                                        value={formData.tags}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                        className="col-span-3"
                                        placeholder="web, api, mobile (comma-separated)"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Project'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Project Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleEditProject}>
                        <DialogHeader>
                            <DialogTitle>Edit Project</DialogTitle>
                            <DialogDescription>
                                Update project information and repository details.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-projectName" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="edit-projectName"
                                    value={formData.projectName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                                    className="col-span-3"
                                    placeholder="My Project"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-repoUrl" className="text-right">
                                    Repository
                                </Label>
                                <Input
                                    id="edit-repoUrl"
                                    type="url"
                                    value={formData.repoUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, repoUrl: e.target.value }))}
                                    className="col-span-3"
                                    placeholder="https://github.com/user/repo"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-description" className="text-right">
                                    Description
                                </Label>
                                <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="col-span-3"
                                    placeholder="Project description..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-tags" className="text-right">
                                    Tags
                                </Label>
                                <Input
                                    id="edit-tags"
                                    value={formData.tags}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                    className="col-span-3"
                                    placeholder="web, api, mobile (comma-separated)"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={creating}>
                                {creating ? 'Updating...' : 'Update Project'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detailed Project View Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{detailedProject?.projectName}</DialogTitle>
                        <DialogDescription>
                            Detailed view of project and its SBOMs
                        </DialogDescription>
                    </DialogHeader>
                    {detailedProject && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Repository</Label>
                                    <a
                                        href={detailedProject.repoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-blue-600 hover:text-blue-800 mt-1"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        {detailedProject.repoUrl}
                                    </a>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Created</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {formatDate(detailedProject.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {detailedProject.description && (
                                <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {detailedProject.description}
                                    </p>
                                </div>
                            )}

                            {detailedProject.tags.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium">Tags</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {detailedProject.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label className="text-sm font-medium">SBOMs ({detailedProject._count.sboms})</Label>
                                {detailedProject.sboms.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                        {detailedProject.sboms.map((sbom) => (
                                            <Card key={sbom.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">{sbom.format}</Badge>
                                                                <Badge variant="outline">{sbom.tool}</Badge>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {sbom.commitHash.substring(0, 7)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                                <span>Components: {sbom.componentsCount}</span>
                                                                <span>Vulnerabilities: {sbom.vulnerabilitiesFound}</span>
                                                                <span>{formatDate(sbom.generatedAt)}</span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteSbom(sbom.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-1">No SBOMs uploaded yet</p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {projects.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first project to start tracking software bill of materials and vulnerabilities.
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Project
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Projects</CardTitle>
                        <CardDescription>
                            {projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Repository</TableHead>
                                    <TableHead>SBOMs</TableHead>
                                    <TableHead>Vulnerabilities</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-[70px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{project.projectName}</div>
                                                {project.description && (
                                                    <div className="text-sm text-muted-foreground">{project.description}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <a
                                                href={project.repoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-blue-600 hover:text-blue-800"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                Repository
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default">
                                                {project._count.sboms}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {project.sboms.length > 0 ? (
                                                <Badge variant={project.sboms[0].vulnerabilitiesFound > 0 ? "destructive" : "default"}>
                                                    {project.sboms[0].vulnerabilitiesFound}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {project.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {formatDate(project.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openDetailDialog(project)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditDialog(project)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteProject(project.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
