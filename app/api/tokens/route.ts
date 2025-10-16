import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth0'
import { PrismaClient } from '@/generated/prisma'
import { generateToken } from "@/lib/auth";

const prisma = new PrismaClient()
export async function GET() {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
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
export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const body = await request.json()
        const { name, description } = body
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Token name is required' }, { status: 400 })
        }
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const token = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
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