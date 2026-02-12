interface LeetCodeProblem {
    questionFrontendId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    content: string;
    topicTags: Array<{ name: string; slug: string }>;
    isPaidOnly: boolean;
  }
  
  export function extractProblemSlug(url: string): string | null {
    const match = url.match(/(?:leetcode\.com|neetcode\.io)\/problems\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  export async function fetchLeetCodeProblem(url: string): Promise<LeetCodeProblem | null> {
    const titleSlug = extractProblemSlug(url);
    if (!titleSlug) {
      throw new Error("Invalid LeetCode or NeetCode URL");
    }
    
    const query = `
      query getQuestionDetail($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionFrontendId
          title
          titleSlug
          difficulty
          content
          topicTags {
            name
            slug
          }
          isPaidOnly
        }
      }
    `;
  
    try {
      const response = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { titleSlug }
        })
      });
  
      const json = await response.json();
      
      if (json.errors || !json.data?.question) {
        throw new Error(json.errors?.[0]?.message || 'Failed to fetch problem');
      }
  
      return json.data.question;
    } catch (error) {
      console.error('Error fetching LeetCode problem:', error);
      return null;
    }
  }