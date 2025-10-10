'use client'

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface Token {
    id: string
    name: string
    description?: string
    token: string
    createdAt: string
    lastUsed?: string
    expiresAt?: string
}

export default function ProfilePage() {
    const { user, isLoading } = useUser()
    const [tokens, setTokens] = useState<Token[]>([])
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newTokenName, setNewTokenName] = useState("")
    const [newTokenDescription, setNewTokenDescription] = useState("")
    const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set())
    const [isLoadingTokens, setIsLoadingTokens] = useState(true)

    useEffect(() => {
        fetchTokens()
    }, [])

    const fetchTokens = async () => {
        try {
            const response = await fetch('/api/tokens')
            if (response.ok) {
                const data = await response.json()
                setTokens(data)
            }
        } catch (error) {
            console.error('Failed to fetch tokens:', error)
            toast.error('Failed to load tokens')
        } finally {
            setIsLoadingTokens(false)
        }
    }

    const createToken = async () => {
        if (!newTokenName.trim()) {
            toast.error('Token name is required')
            return
        }

        try {
            const response = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newTokenName,
                    description: newTokenDescription,
                }),
            })

            if (response.ok) {
                const newToken = await response.json()
                setTokens([...tokens, newToken])
                setNewTokenName("")
                setNewTokenDescription("")
                setIsCreateDialogOpen(false)
                toast.success('Token created successfully')
            } else {
                toast.error('Failed to create token')
            }
        } catch (error) {
            console.error('Failed to create token:', error)
            toast.error('Failed to create token')
        }
    }

    const deleteToken = async (tokenId: string) => {
        try {
            const response = await fetch(`/api/tokens/${tokenId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setTokens(tokens.filter(token => token.id !== tokenId))
                toast.success('Token deleted successfully')
            } else {
                toast.error('Failed to delete token')
            }
        } catch (error) {
            console.error('Failed to delete token:', error)
            toast.error('Failed to delete token')
        }
    }

    const copyToken = async (token: string) => {
        try {
            await navigator.clipboard.writeText(token)
            toast.success('Token copied to clipboard')
        } catch (error) {
            toast.error('Failed to copy token')
        }
    }

    const toggleTokenVisibility = (tokenId: string) => {
        setVisibleTokens(prev => {
            const newSet = new Set(prev)
            if (newSet.has(tokenId)) {
                newSet.delete(tokenId)
            } else {
                newSet.add(tokenId)
            }
            return newSet
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>
    }

    return (
        <div className="space-y-6">
            {/* User Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your account details and social connections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.picture || ""} alt={user?.name || "User"} />
                            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-semibold">{user?.name || "User"}</h3>
                            <p className="text-muted-foreground">{user?.email || "No email"}</p>
                            <div className="flex gap-2">
                                <Badge variant="default">Auth0</Badge>
                                {user?.sub && (
                                    <Badge variant="outline">
                                        {user.sub.startsWith('google') ? 'Google' :
                                            user.sub.startsWith('github') ? 'GitHub' :
                                                user.sub.startsWith('twitter') ? 'Twitter' : 'Social'}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* API Tokens Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>API Tokens</CardTitle>
                            <CardDescription>Manage your API tokens for accessing various services</CardDescription>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Token
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Token</DialogTitle>
                                    <DialogDescription>
                                        Create a new API token for accessing services. Make sure to copy it immediately as it won't be shown again.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="token-name">Token Name</Label>
                                        <Input
                                            id="token-name"
                                            value={newTokenName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTokenName(e.target.value)}
                                            placeholder="e.g., Development Token"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="token-description">Description (Optional)</Label>
                                        <Textarea
                                            id="token-description"
                                            value={newTokenDescription}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTokenDescription(e.target.value)}
                                            placeholder="What is this token used for?"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={createToken}>Create Token</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingTokens ? (
                        <div className="text-center py-4">Loading tokens...</div>
                    ) : tokens.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No API tokens found. Create your first token to get started.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Token</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Last Used</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tokens.map((token) => (
                                    <TableRow key={token.id}>
                                        <TableCell className="font-medium">{token.name}</TableCell>
                                        <TableCell>{token.description || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                                    {visibleTokens.has(token.id)
                                                        ? token.token
                                                        : `${token.token.substring(0, 8)}...${token.token.substring(token.token.length - 8)}`}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleTokenVisibility(token.id)}
                                                >
                                                    {visibleTokens.has(token.id) ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToken(token.token)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDate(token.createdAt)}</TableCell>
                                        <TableCell>{token.lastUsed ? formatDate(token.lastUsed) : 'Never'}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteToken(token.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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