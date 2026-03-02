import { useLibrary } from "@/hooks/useLibrary";
import "./libraryList.scss";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useEffect } from "react";

const LibraryList = () => {
  const { pagesStore, pageActions, } = useLibrary();
  const { setActiveTabTypeAndView } = useActiveTab();

  useEffect(()=>{
    (async ()=>{

      await pageActions.pages.load()
      .catch(err=> console.error('[err]: ',err))
    })()
  })
  return (
    <div className="library-list">
      <h1>Memory Space</h1>

      <div className="library-list-items">
        {pagesStore.pages.map(({ pageMeta, headSnapshot, snapshots }) => (
          <div
            key={pageMeta.id}
            className="library-list-item"
            onClick={async () => {
              // const res = await pageActions.page.updateLastOpened(item);
              // if (res.ok === false) console.log(res.error);

              pageActions.activePage.set({
                pageMeta,
                headSnapshot,
                snapshots,
              });
              setActiveTabTypeAndView("library", "detail");
            }}
          >
            <h2>{pageMeta.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};
export default LibraryList;
