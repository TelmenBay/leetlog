// app/components/GitHubStar.tsx
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
      className="border-2 border-white px-4 py-2 flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
    >
      <img src="/github.svg" alt="GitHub" className="w-6 h-6 dark:invert" />
      <img src="/star.svg" alt="Star" className="w-4 h-4 dark:invert" />
      {stars !== null && (
          <span className="text-xl">{stars}</span>
      )}
    </a>
  );
}