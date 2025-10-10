import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// DELETE /api/tokens/[id] - Delete a specific token
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth0.getSession()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: tokenId } = await params

        if (!tokenId) {
            return NextResponse.json({ error: 'Token ID is required' }, { status: 400 })
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Find the token and ensure it belongs to the user
        const token = await prisma.token.findFirst({
            where: {
                id: tokenId,
                userId: user.id,
            },
        })

        if (!token) {
            return NextResponse.json({ error: 'Token not found' }, { status: 404 })
        }

        // Delete the token
        await prisma.token.delete({
            where: { id: tokenId },
        })

        return NextResponse.json({ message: 'Token deleted successfully' })
    } catch (error) {
        console.error('Error deleting token:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}