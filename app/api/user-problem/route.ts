import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchLeetCodeProblem } from "@/lib/leetcode";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - No session" },
        { status: 401 }
      );
    }
    
    if (!session.user) {
      return NextResponse.json(
        { error: "Unauthorized - No user in session" },
        { status: 401 }
      );
    }

    // Try to get user ID from session or fetch by email
    let userId = session.user.id as string;
    
    // If no ID, try to get it from email
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      if (user) {
        userId = user.id;
      }
    }
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { url } = await request.json();
    
    if (!url || !url.includes('leetcode.com/problems/')) {
      return NextResponse.json(
        { error: "Invalid LeetCode URL" },
        { status: 400 }
      );
    }

    // Extract slug to get leetcodeId
    const match = url.match(/leetcode\.com\/problems\/([^\/]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid LeetCode URL format" },
        { status: 400 }
      );
    }

    // Fetch problem data from LeetCode
    const problemData = await fetchLeetCodeProblem(url);
    
    if (!problemData) {
      return NextResponse.json(
        { error: "Failed to fetch problem data from LeetCode" },
        { status: 500 }
      );
    }

    const leetcodeId = parseInt(problemData.questionFrontendId);

    // Check if problem exists in cache, if not create it
    let problem = await prisma.problem.findUnique({
      where: { leetcodeId }
    });

    if (!problem) {
      // Create new problem in cache
      problem = await prisma.problem.create({
        data: {
          leetcodeId,
          title: problemData.title,
          difficulty: problemData.difficulty,
          category: problemData.topicTags[0]?.name || null,
          tags: problemData.topicTags.map(tag => tag.name),
          description: problemData.content,
        }
      });
    }

    // Check if UserProblem already exists
    const existingUserProblem = await prisma.userProblem.findUnique({
      where: {
        userId_problemId: {
          userId: session.user.id as string,
          problemId: problem.id
        }
      }
    });

    if (existingUserProblem) {
      return NextResponse.json(
        { error: "Problem already added to your list" },
        { status: 400 }
      );
    }

    // Create UserProblem relation
    const userProblem = await prisma.userProblem.create({
      data: {
        userId: session.user.id as string,
        problemId: problem.id,
        status: "not_started"
      },
      include: {
        problem: true
      }
    });

    return NextResponse.json({ 
      success: true,
      userProblem 
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error:", error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Problem already added to your list" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}