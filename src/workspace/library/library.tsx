import "./library.scss";
import { useState } from "react";
import MemorySpaceList from "./libraryList/libraryList";
import MemorySpaceItem from "./libraryItem/libraryItem";
import LibraryDetail from "./libraryDetail/libraryDetail";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useLibrary } from "@/hooks/useLibrary";

const Library = () => {
  const { activeTab, setActiveTabView } = useActiveTab();
  const { pagesStore } = useLibrary();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const selectedPage = pagesStore.activePage;
  const selectedBook = pagesStore.books.find((book) => book.id === selectedBookId) ?? null;

  if (!activeTab) return <p>Null</p>;

  return (
    <div className="library">
      {activeTab.view === "list" && (
        <MemorySpaceList
          onOpenBook={(bookId) => {
            setSelectedBookId(bookId);
            setActiveTabView("detail");
          }}
        />
      )}
      {activeTab.view === "detail" && selectedPage && <MemorySpaceItem />}
      {activeTab.view === "detail" && !selectedPage && selectedBook && (
        <LibraryDetail
          book={selectedBook}
          onBack={() => {
            setSelectedBookId(null);
            setActiveTabView("list");
          }}
        />
      )}
      {activeTab.view === "detail" && !selectedPage && !selectedBook && (
        <MemorySpaceList
          onOpenBook={(bookId) => {
            setSelectedBookId(bookId);
            setActiveTabView("detail");
          }}
        />
      )}
    </div>
  );
};

export default Library;
