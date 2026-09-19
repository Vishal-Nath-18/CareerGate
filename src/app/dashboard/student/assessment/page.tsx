import Link from "next/link";
import StudentNavbar from "@/components/StudentNavbar";

export default function AssessmentPage() {
  return (
    <div className="relative min-h-screen bg-[#050a1f] text-white overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <StudentNavbar currentPage="Assessment" />

      {/* Coming Soon */}
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent mb-4 pb-2 leading-normal">
            Coming Soon
          </h1>
          <p className="text-zinc-400 text-sm">AI-powered assessments are on their way.</p>
        </div>
      </main>
    </div>
  );
}