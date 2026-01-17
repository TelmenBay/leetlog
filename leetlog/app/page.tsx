import Image from "next/image";
import Timer from "./components/timer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center">
        <Image
            src="/white_LL.jpg"
            alt="LeetLog Logo"
            width={160}
            height={160}
            className="object-contain"
          />
        </div>
        
        <div className="flex gap-4">
          <button className="text-xl border-3 px-6 py-4 border-white text-white dark:text-white hover:text-black hover:bg-white transition-colors">
            Login
          </button>
          <button className="text-xl bg-white text-black border-3 border-white px-6 py-4 hover:bg-black hover:text-white hover:border-white border-3 border-black transition-colors">
            Sign Up
          </button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Timer />
      </main>
      <footer className="p-6">
        <div className="flex justify-center items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} LeetLog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
