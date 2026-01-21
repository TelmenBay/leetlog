import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create or update user in our database
      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: data.user.id }
        })

        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: data.user.id,
              email: data.user.email!,
              username: data.user.user_metadata?.user_name || data.user.user_metadata?.preferred_username || null,
            }
          })
        }
      } catch (dbError) {
        console.error('Error creating user in database:', dbError)
        // Continue anyway - user can still authenticate
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/sign-in?error=auth`)
}
