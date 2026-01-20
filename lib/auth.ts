import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { PrismaClient } from "@/lib/generated/prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const { auth, handlers, signIn, signOut } = NextAuth({ 
    providers: [
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }
  
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })
  
          if (!user || !user.password) {
            return null
          }
  
          const isValid = await bcrypt.compare(credentials.password as string, user.password)
  
          if (!isValid) {
            return null
          }
  
          return {
            id: user.id,
            email: user.email,
            username: user.username || undefined,
          }
        }
      }),
      GitHub({
        clientId: process.env.GITHUB_ID!,
        clientSecret: process.env.GITHUB_SECRET!,
      })
    ],
    callbacks: {
      async jwt({ token, user }) {
        // Initial sign in
        if (user) {
          token.id = user.id
          token.email = user.email
        }
        return token
      },
      async session({ session, token }) {
        // Send properties to the client
        if (session.user) {
          session.user.id = token.id as string
          session.user.email = token.email as string
        }
        return session
      },
    },
  })