import jwt from 'jsonwebtoken'

const SECRET = process.env.ACCESS_TOKEN_SECRET!

export function signAccessToken(userId: string): string {
    return jwt.sign({ userId }, SECRET, { expiresIn: '30m' })
}

export function verifyAccessToken(token: string): { userId: string } {
    return jwt.verify(token, SECRET) as { userId: string }
}

export function getTokenFromHeader(req: Request): string | null {
    const auth = req.headers.get('authorization') ?? ''
    return auth.startsWith('Bearer ') ? auth.slice(7) : null
}
