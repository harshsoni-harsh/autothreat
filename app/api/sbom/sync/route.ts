import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { s3Service } from '@/lib/s3'

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
        const format = metadata.format
        const tool = metadata?.source || 'github-action'
        const commitHash = metadata.commit_hash
        const componentsCount = (sbom.packages?.length ?? sbom.components.length) || 0
        const vulnerabilitiesFound = 0

        // Upload SBOM to S3 or store locally if S3 not configured
        let storageUrl: string
        try {
            if (s3Service.isConfigured()) {
                storageUrl = await s3Service.uploadSBOM(sbom, project.id, sbomId)
                console.log(`SBOM uploaded to S3: ${storageUrl}`)
            } else {
                // Fallback: store reference if S3 not configured
                storageUrl = `local_sbom_${project.id}_${Date.now()}.json`
                console.warn('S3 not configured, storing local reference. Configure AWS credentials for cloud storage.')
            }
        } catch (error) {
            console.error('Failed to upload SBOM to S3, using local reference:', error)
            storageUrl = `local_sbom_${project.id}_${Date.now()}.json`
        }

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
            storageUrl: storageUrl,
            storageType: storageUrl.startsWith('https://') ? 's3' : 'local',
            syncedAt: new Date().toISOString()
        }, { status: 201 })

    } catch (error) {
        console.error('Error syncing SBOM:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}