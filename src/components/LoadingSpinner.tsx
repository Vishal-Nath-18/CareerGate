export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#050a1f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}