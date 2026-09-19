const BOOKMARKS_KEY = "uigen_bookmarks";

export function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addBookmark(id: string): string[] {
  const bookmarks = getBookmarks();
  if (!bookmarks.includes(id)) {
    const updated = [...bookmarks, id];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return updated;
  }
  return bookmarks;
}

export function removeBookmark(id: string): string[] {
  const bookmarks = getBookmarks();
  const updated = bookmarks.filter((b) => b !== id);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  return updated;
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().includes(id);
}
