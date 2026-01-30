import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')

  // If there's a ref code in the URL
  if (ref) {
    const cookieName = `visited_agent_${ref}`
    
    // If the cookie doesn't exist, prepare the response to set it
    if (!request.cookies.has(cookieName)) {
      const response = NextResponse.next()
      response.cookies.set(cookieName, 'true', {
        maxAge: 86400, // 1 day
        httpOnly: true,
      })
      return response
    }
  }

  return NextResponse.next()
}

// Run the middleware only on the homepage
export const config = {
  matcher: '/',
}
