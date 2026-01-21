'use client';

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const GithubSignIn = () => {
  const handleGithubSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleGithubSignIn}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#1A1A1A] text-white font-medium rounded-sm hover:bg-[#333] transition-colors"
    >
      <Image src="/github.svg" alt="GitHub" width={18} height={18} className="invert" />
      Continue with GitHub
    </button>
  )
}

export default GithubSignIn;
