'use client';

import { useState, useEffect } from "react";

export default function GitHubStar() {
  const [stars, setStars] = useState<number | null>(null);
  const repoOwner = "telmenbay";
  const repoName = "leetlog";

  useEffect(() => {
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {
        setStars(null);
      });
  }, [repoOwner, repoName]);

  return (
    <a
      href={`https://github.com/${repoOwner}/${repoName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="border border-[#D4D4D4] px-3 py-1.5 flex items-center gap-2 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-colors rounded-sm"
    >
      <img src="/github.svg" alt="GitHub" className="w-5 h-5" />
      <img src="/star.svg" alt="Star" className="w-4 h-4" />
      {stars !== null && (
        <span className="text-sm font-medium">{stars}</span>
      )}
    </a>
  );
}