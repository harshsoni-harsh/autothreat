import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// GET /api/tokens - Get all tokens for the current user
export async function GET() {
    try {
        const session = await auth0.getSession()

        // just in case, after middleware check
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get all tokens for the user
        const tokens = await prisma.token.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(tokens)
    } catch (error) {
        console.error('Error fetching tokens:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/tokens - Create a new token
export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession()

        // just in case, after middleware check
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, description } = body

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Token name is required' }, { status: 400 })
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Generate a unique token
        const token = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

        // Create the token
        const newToken = await prisma.token.create({
            data: {
                userId: user.id,
                name: name.trim(),
                token,
                description: description?.trim() || null,
            },
        })

        return NextResponse.json(newToken, { status: 201 })
    } catch (error) {
        console.error('Error creating token:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}