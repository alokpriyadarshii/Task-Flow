import '@fastify/jwt'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
}

export type JwtPayload = {
  sub: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: AuthUser
  }
}
