import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { PrismaClient } from '@/generated/prisma'
import { s3Service } from '@/lib/s3'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'SBOM ID is required' }, { status: 400 })
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if SBOM exists and belongs to user's project
        const sbom = await prisma.sbom.findFirst({
            where: {
                id: id,
                project: {
                    userId: user.id,
                },
            },
            include: {
                project: true,
            },
        })

        if (!sbom) {
            return NextResponse.json({ error: 'SBOM not found' }, { status: 404 })
        }

        // Delete from S3 if storage URL exists
        if (sbom.storageUrl) {
            try {
                // Extract key from storage URL
                const urlParts = sbom.storageUrl.split('/')
                const key = urlParts.slice(-2).join('/') // projectId/sbomId.json

                await s3Service.deleteSBOM(sbom.project.id, sbom.id)
            } catch (s3Error) {
                console.warn('Failed to delete SBOM from S3:', s3Error)
                // Continue with database deletion even if S3 deletion fails
            }
        }

        // Delete from database
        await prisma.sbom.delete({
            where: { id: id },
        })

        return NextResponse.json({ message: 'SBOM deleted successfully' })
    } catch (error) {
        console.error('Error deleting SBOM:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}