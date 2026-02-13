'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  UserProblemWithDetails,
  calculateReadiness,
  getReadinessBadgeClasses,
  formatTime,
  Readiness,
} from '@/lib/readiness';

interface AnalyticsClientProps {
  userProblems: UserProblemWithDetails[];
}

// --- Category definitions with LeetCode tag mappings ---

interface Category {
  name: string;
  tags: string[];
}

const DATA_STRUCTURE_CATEGORIES: Category[] = [
  { name: 'Array & String', tags: ['Array', 'String'] },
  { name: 'Linked List', tags: ['Linked List'] },
  { name: 'Hash Table', tags: ['Hash Table'] },
  { name: 'Tree', tags: ['Tree', 'Binary Tree', 'Binary Search Tree'] },
  { name: 'Graph', tags: ['Graph', 'Breadth-First Search', 'Depth-First Search', 'Topological Sort', 'Shortest Path'] },
  { name: 'Heap / PQ', tags: ['Heap (Priority Queue)'] },
  { name: 'Stack / Queue', tags: ['Stack', 'Queue', 'Monotonic Stack', 'Monotonic Queue'] },
  { name: 'Trie', tags: ['Trie'] },
];

const ALGORITHM_CATEGORIES: Category[] = [
  { name: 'Dynamic Programming', tags: ['Dynamic Programming'] },
  { name: 'Binary Search', tags: ['Binary Search'] },
  { name: 'Two Pointers', tags: ['Two Pointers'] },
  { name: 'Sliding Window', tags: ['Sliding Window'] },
  { name: 'Backtracking', tags: ['Backtracking'] },
  { name: 'Greedy', tags: ['Greedy'] },
  { name: 'Bit Manipulation', tags: ['Bit Manipulation'] },
  { name: 'Union Find', tags: ['Union Find'] },
];

// --- Scoring: readiness + difficulty → 0-5 ---

const SCORE_MAP: Record<string, Record<string, number>> = {
  mastered: { easy: 3, medium: 4, hard: 5 },
  rusty:    { easy: 2, medium: 3, hard: 4 },
  revisit:  { easy: 2, medium: 3, hard: 4 },
  weak:     { easy: 1, medium: 2, hard: 3 },
  '-':      { easy: 0, medium: 0, hard: 0 },
};

function getScore(readiness: Readiness, difficulty: string): number {
  return SCORE_MAP[readiness]?.[difficulty.toLowerCase()] ?? 0;
}

// --- Component ---

export default function AnalyticsClient({ userProblems }: AnalyticsClientProps) {
  const stats = useMemo(() => {
    const totalProblems = userProblems.length;
    const solved = userProblems.filter(up => up.timeSpent !== null).length;
    const solvedTimes = userProblems
      .filter(up => up.timeSpent !== null)
      .map(up => up.timeSpent!);
    const avgTime = solvedTimes.length > 0
      ? Math.round(solvedTimes.reduce((a, b) => a + b, 0) / solvedTimes.length)
      : null;

    const readinessCounts: Record<string, number> = {
      mastered: 0, revisit: 0, weak: 0, rusty: 0, '-': 0,
    };
    userProblems.forEach(up => {
      const r = calculateReadiness(up);
      readinessCounts[r]++;
    });

    // Difficulty breakdown
    const difficulties = ['Easy', 'Medium', 'Hard'] as const;
    const difficultyStats = difficulties.map(diff => {
      const problems = userProblems.filter(up => up.problem.difficulty === diff);
      const diffSolved = problems.filter(up => up.timeSpent !== null);
      const diffTimes = diffSolved.map(up => up.timeSpent!);
      const diffReadiness: Record<string, number> = { mastered: 0, revisit: 0, weak: 0, rusty: 0 };
      problems.forEach(up => {
        const r = calculateReadiness(up);
        if (r in diffReadiness) diffReadiness[r]++;
      });
      return {
        difficulty: diff,
        total: problems.length,
        solved: diffSolved.length,
        avgTime: diffTimes.length > 0
          ? Math.round(diffTimes.reduce((a, b) => a + b, 0) / diffTimes.length)
          : null,
        readiness: diffReadiness,
      };
    });

    return { totalProblems, solved, avgTime, readinessCounts, difficultyStats };
  }, [userProblems]);

  // Compute category scores for radar charts
  const computeCategoryScores = useMemo(() => {
    // Pre-compute readiness and score for each problem
    const problemScores = userProblems.map(up => ({
      tags: up.problem.tags,
      score: getScore(calculateReadiness(up), up.problem.difficulty),
    }));

    function scoreCategories(categories: Category[]) {
      return categories.map(cat => {
        const matching = problemScores.filter(p =>
          p.tags.some(tag => cat.tags.includes(tag))
        );
        const avg = matching.length > 0
          ? matching.reduce((sum, p) => sum + p.score, 0) / matching.length
          : 0;
        return {
          category: cat.name,
          score: parseFloat(avg.toFixed(2)),
          count: matching.length,
        };
      });
    }

    const dsScores = scoreCategories(DATA_STRUCTURE_CATEGORIES);
    const algoScores = scoreCategories(ALGORITHM_CATEGORIES);

    // GPA: average of all 16 category scores (including 0s)
    const allScores = [...dsScores, ...algoScores];
    const gpa = allScores.reduce((sum, c) => sum + c.score, 0) / allScores.length;

    return { dsScores, algoScores, gpa: parseFloat(gpa.toFixed(2)) };
  }, [userProblems]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-[#1A1A1A]';
    }
  };

  if (userProblems.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B6B6B] text-lg mb-2" style={{ fontFamily: 'var(--font-jost)' }}>
          No problems tracked yet.
        </p>
        <Link
          href="/dashboard"
          className="text-[#1A1A1A] underline text-sm font-medium"
          style={{ fontFamily: 'var(--font-jost)' }}
        >
          Add problems from the Dashboard to see analytics.
        </Link>
      </div>
    );
  }

  const readinessTotal = stats.totalProblems;
  const readinessBar = [
    { key: 'mastered', color: 'bg-green-500', count: stats.readinessCounts['mastered'] },
    { key: 'revisit', color: 'bg-yellow-500', count: stats.readinessCounts['revisit'] },
    { key: 'rusty', color: 'bg-orange-500', count: stats.readinessCounts['rusty'] },
    { key: 'weak', color: 'bg-red-500', count: stats.readinessCounts['weak'] },
    { key: '-', color: 'bg-gray-300', count: stats.readinessCounts['-'] },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radarTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-sm px-3 py-2 shadow-sm">
        <p className="text-xs font-medium text-[#1A1A1A]" style={{ fontFamily: 'var(--font-jost)' }}>
          {data.category}
        </p>
        <p className="text-xs text-[#6B6B6B]" style={{ fontFamily: 'var(--font-jost)' }}>
          Score: {data.score} / 5
        </p>
        <p className="text-xs text-[#9CA3AF]" style={{ fontFamily: 'var(--font-jost)' }}>
          {data.count} problem{data.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide block mb-1" style={{ fontFamily: 'var(--font-jost)' }}>
            Total Problems
          </span>
          <span className="text-[#1A1A1A] text-2xl font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>
            {stats.totalProblems}
          </span>
        </div>

        <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide block mb-1" style={{ fontFamily: 'var(--font-jost)' }}>
            Solved
          </span>
          <span className="text-[#1A1A1A] text-2xl font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>
            {stats.solved}
          </span>
        </div>

        <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide block mb-1" style={{ fontFamily: 'var(--font-jost)' }}>
            Avg Solve Time
          </span>
          <span className="text-[#1A1A1A] text-2xl font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>
            {formatTime(stats.avgTime)}
          </span>
        </div>

        <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide block mb-2" style={{ fontFamily: 'var(--font-jost)' }}>
            Readiness
          </span>
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
            {readinessBar.map(r => r.count > 0 && (
              <div
                key={r.key}
                className={`${r.color}`}
                style={{ width: `${(r.count / readinessTotal) * 100}%` }}
                title={`${r.key}: ${r.count}`}
              />
            ))}
          </div>
          <div className="flex gap-3 mt-2 flex-wrap">
            {readinessBar.filter(r => r.count > 0 && r.key !== '-').map(r => (
              <span key={r.key} className="text-[10px] text-[#6B6B6B] capitalize" style={{ fontFamily: 'var(--font-jost)' }}>
                <span className={`inline-block w-2 h-2 rounded-full ${r.color} mr-1`} />
                {r.key} {r.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two Radar Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Data Structures Radar */}
        <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide block mb-4" style={{ fontFamily: 'var(--font-jost)' }}>
            Data Structures
          </span>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={computeCategoryScores.dsScores} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#E5E5E5" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: '#6B6B6B', fontFamily: 'var(--font-jost)' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickCount={6}
              />
              <Radar
                dataKey="score"
                stroke="#1A1A1A"
                fill="#1A1A1A"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Tooltip content={radarTooltip} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Algorithms Radar */}
        <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
          <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide block mb-4" style={{ fontFamily: 'var(--font-jost)' }}>
            Algorithms
          </span>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={computeCategoryScores.algoScores} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#E5E5E5" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: '#6B6B6B', fontFamily: 'var(--font-jost)' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                tickCount={6}
              />
              <Radar
                dataKey="score"
                stroke="#1A1A1A"
                fill="#1A1A1A"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Tooltip content={radarTooltip} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GPA Card */}
      <div className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 text-center">
        <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wide block mb-2" style={{ fontFamily: 'var(--font-jost)' }}>
          DSA GPA
        </span>
        <span className="text-[#1A1A1A] text-4xl font-semibold" style={{ fontFamily: 'var(--font-jost)' }}>
          {computeCategoryScores.gpa.toFixed(2)}
        </span>
        <span className="text-[#6B6B6B] text-xl font-medium ml-1" style={{ fontFamily: 'var(--font-jost)' }}>
          / 5
        </span>
      </div>

      {/* Difficulty Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {stats.difficultyStats.map(diff => (
          <div key={diff.difficulty} className="bg-white rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
            <span className={`text-sm font-semibold ${getDifficultyColor(diff.difficulty)}`} style={{ fontFamily: 'var(--font-jost)' }}>
              {diff.difficulty}
            </span>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                <span className="text-[#6B6B6B]">Problems</span>
                <span className="text-[#1A1A1A] font-medium">{diff.total}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                <span className="text-[#6B6B6B]">Solved</span>
                <span className="text-[#1A1A1A] font-medium">{diff.solved}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ fontFamily: 'var(--font-jost)' }}>
                <span className="text-[#6B6B6B]">Avg Time</span>
                <span className="text-[#1A1A1A] font-medium">{formatTime(diff.avgTime)}</span>
              </div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {Object.entries(diff.readiness).filter(([, count]) => count > 0).map(([key, count]) => (
                  <span
                    key={key}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm border capitalize ${getReadinessBadgeClasses(key)}`}
                    style={{ fontFamily: 'var(--font-jost)' }}
                  >
                    {key} {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
