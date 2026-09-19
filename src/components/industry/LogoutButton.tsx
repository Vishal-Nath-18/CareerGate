"use client";

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    window.location.href = "/";
  };
  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-red-400 transition-colors"
    >
      Log out
    </button>
  );
}