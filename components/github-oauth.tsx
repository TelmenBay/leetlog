'use client';

import { signIn } from "next-auth/react";
import Image from "next/image";

const GithubSignIn = () => {
    return (
        <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#1A1A1A] text-white font-medium rounded-sm hover:bg-[#333] transition-colors"
        >
            <Image src="/github.svg" alt="GitHub" width={18} height={18} className="invert" />
            Continue with GitHub
        </button>
    )
}

export default GithubSignIn;