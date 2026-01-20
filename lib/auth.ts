import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
      async signIn({ user, account, profile }) {
        // Handle GitHub OAuth sign in - create or update user in database
        if (account?.provider === "github" && profile) {
          const githubProfile = profile as { login?: string; email?: string }
          const email = user.email || githubProfile.email
          const username = githubProfile.login

          if (!email) {
            // Can't create user without email
            return false
          }

          try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
              where: { email }
            })

            if (existingUser) {
              // Update username if not set
              if (!existingUser.username && username) {
                await prisma.user.update({
                  where: { email },
                  data: { username }
                })
              }
              // Store the database ID for the JWT callback
              user.id = existingUser.id
            } else {
              // Create new user
              const newUser = await prisma.user.create({
                data: {
                  email,
                  username: username || null,
                  password: "", // OAuth users don't have a password
                }
              })
              user.id = newUser.id
            }
          } catch (error) {
            console.error("Error during GitHub sign in:", error)
            return false
          }
        }
        return true
      },
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