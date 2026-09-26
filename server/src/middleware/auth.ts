import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function requireAuth(req: Request, res: Response, next: NextFunction){
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ success: false, message: 'Unauthorized' })
  const token = auth.replace(/^Bearer\s+/i, '')
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev') as any
    ;(req as any).user = payload
    next()
  }catch(e){
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction){
  requireAuth(req, res, () => {
    const user = (req as any).user
    if (user && user.role === 'admin') return next()
    return res.status(403).json({ success: false, message: 'Forbidden' })
  })
}
