import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        // Extract API key from Authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
        }

        const apiKey = authHeader.substring(7)

        if (!apiKey) {
            return NextResponse.json({ error: 'API key is required' }, { status: 401 })
        }
        
        // Find user by API key
        const token = await prisma.token.findUnique({
            where: { token: apiKey },
            include: { user: true }
        })

        if (!token) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
        }

        const user = token.user

        // Parse request body
        const body = await request.json()
        const { project: projectName, sbom, metadata } = body

        if (!projectName || !sbom) {
            return NextResponse.json({ error: 'Project name and SBOM data are required' }, { status: 400 })
        }

        // Update token last used
        await prisma.token.update({
            where: { id: token.id },
            data: { lastUsed: new Date() }
        })

        // Find or create project
        let project = await prisma.project.findFirst({
            where: {
                userId: user.id,
                projectName: projectName
            }
        })

        if (!project) {
            // Create new project
            project = await prisma.project.create({
                data: {
                    userId: user.id,
                    projectName: projectName,
                    repoUrl: `https://github.com/${projectName}`,
                    description: `Project ${projectName}`,
                    tags: []
                }
            })
        }

        // Extract SBOM metadata
        const sbomId = sbom.SPDXID || sbom.id || `sbom_${Date.now()}`
        const format = sbom.spdxVersion ? 'SPDX' : 'Unknown'
        const tool = metadata?.source || 'github-action'
        const commitHash = metadata?.commitHash || 'unknown'
        const componentsCount = (sbom.packages?.length ?? sbom.components.length) || 0
        const vulnerabilitiesFound = 0

        // Store SBOM data (in a real implementation, you'd store this in cloud storage)
        // For now, we'll store a reference
        const storageUrl = `sbom_${project.id}_${Date.now()}.json`

        // Create SBOM record
        const newSbom = await prisma.sbom.create({
            data: {
                projectId: project.id,
                storageUrl: storageUrl,
                format: format,
                tool: tool,
                commitHash: commitHash,
                componentsCount: componentsCount,
                vulnerabilitiesFound: vulnerabilitiesFound
            }
        })

        // Update project's latest SBOM ID
        await prisma.project.update({
            where: { id: project.id },
            data: { latestSbomId: newSbom.id }
        })

        // Return success response
        return NextResponse.json({
            id: newSbom.id,
            status: 'success',
            message: 'SBOM synced successfully',
            project: projectName,
            sbomId: newSbom.id,
            componentsCount: componentsCount,
            syncedAt: new Date().toISOString()
        }, { status: 201 })

    } catch (error) {
        console.error('Error syncing SBOM:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}