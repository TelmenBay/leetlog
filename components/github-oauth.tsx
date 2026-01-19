'use client';

import { signIn } from "next-auth/react";
import Image from "next/image";

const GithubSignIn = () => {
    return (
        <button 
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="flex items-center gap-2 text-xl border-3 px-6 py-4 flex-row"
        >
            <Image className="dark:invert" src="/github.svg" alt="GitHub" width={20} height={20} />
            Continue with Github
        </button>
    )
}

export default GithubSignIn;