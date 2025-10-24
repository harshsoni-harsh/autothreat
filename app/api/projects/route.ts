import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET() {
    try {
        const session = await auth0.getSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const projects = await prisma.project.findMany({
            where: { userId: user.id },
            include: {
                sboms: {
                    orderBy: { generatedAt: 'desc' },
                },
                _count: {
                    select: { sboms: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(projects)
    } catch (error) {
        console.error('Error fetching projects:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { projectName, repoUrl, description, tags } = body

        if (!projectName || !repoUrl) {
            return NextResponse.json({ error: 'Project name and repository URL are required' }, { status: 400 })
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if project with same name already exists for this user
        const existingProject = await prisma.project.findFirst({
            where: {
                userId: user.id,
                projectName: projectName,
            },
        })

        if (existingProject) {
            return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 })
        }

        const project = await prisma.project.create({
            data: {
                userId: user.id,
                projectName,
                repoUrl,
                description: description || '',
                tags: tags || [],
            },
            include: {
                sboms: {
                    orderBy: { generatedAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { sboms: true },
                },
            },
        })

        return NextResponse.json(project, { status: 201 })
    } catch (error) {
        console.error('Error creating project:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, projectName, repoUrl, description, tags } = body

        if (!id || !projectName || !repoUrl) {
            return NextResponse.json({ error: 'Project ID, name, and repository URL are required' }, { status: 400 })
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if project exists and belongs to user
        const existingProject = await prisma.project.findFirst({
            where: {
                id: id,
                userId: user.id,
            },
        })

        if (!existingProject) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Check if another project with same name already exists for this user
        const duplicateProject = await prisma.project.findFirst({
            where: {
                userId: user.id,
                projectName: projectName,
                id: { not: id }, // Exclude current project
            },
        })

        if (duplicateProject) {
            return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 })
        }

        const project = await prisma.project.update({
            where: { id: id },
            data: {
                projectName,
                repoUrl,
                description: description || '',
                tags: tags || [],
            },
            include: {
                sboms: {
                    orderBy: { generatedAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { sboms: true },
                },
            },
        })

        return NextResponse.json(project)
    } catch (error) {
        console.error('Error updating project:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if project exists and belongs to user
        const project = await prisma.project.findFirst({
            where: {
                id: id,
                userId: user.id,
            },
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Delete the project (this will cascade delete SBOMs due to schema relations)
        await prisma.project.delete({
            where: { id: id },
        })

        return NextResponse.json({ message: 'Project deleted successfully' })
    } catch (error) {
        console.error('Error deleting project:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}