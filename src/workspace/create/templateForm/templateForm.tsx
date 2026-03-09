import { useMemo, useRef, useState } from "react";
import "./templateForm.scss";
import type { CreateTemplate } from "@/types/template";
import { useActiveTab } from "@/hooks/useActiveTab";
import { useLibrary } from "@/hooks/useLibrary";
import type { NormalizedVersionedPage, PageType } from "@/types/page";
import { Editor, type EditorHandle } from "@reiwuzen/blocky-react";
import { appToast } from "@/components/ui";
import "@reiwuzen/blocky-react/styles.css";

type TemplateFormProps = {
  selectedTemplate: CreateTemplate;
  onBack: () => void;
};

const TemplateForm = ({ selectedTemplate, onBack }: TemplateFormProps) => {
  const { pageActions, pagesStore } = useLibrary();
  const { setActiveTabTypeAndView } = useActiveTab();
  const editorRef = useRef<EditorHandle>(null);
  const [title, setTitle] = useState(selectedTemplate.initialTitle);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);

  const isBookTemplate = selectedTemplate.createType === "book";
  const selectedType = selectedTemplate.templateType;

  const assignablePages = useMemo(() => {
    const pages = pagesStore.pages;
    if (selectedType === "generic") {
      return pages.filter((page) => page.pageMeta.bookId === null);
    }
    return pages.filter(
      (page) =>
        page.pageMeta.bookId === null &&
        page.pageMeta.type === selectedType,
    );
  }, [pagesStore.pages, selectedType]);

  const getBookPageTypeLabel = (type: PageType) => {
    if (type === "generic") return "Generic (accepts all page types)";
    return `${type.charAt(0).toUpperCase()}${type.slice(1)} (only same type pages)`;
  };

  const getPageTitle = (page: NormalizedVersionedPage) => {
    if (page.pageMeta.title.trim().length > 0) {
      return page.pageMeta.title;
    }
    return "Untitled";
  };

  return (
    <div className="templateForm">
      <header className="templateForm-header">
        <h1>Create memory</h1>
        <p>
          {isBookTemplate
            ? `Create a ${selectedType} book and optionally attach existing pages.`
            : `Create a ${selectedType} page.`}
        </p>
      </header>

      <div className="templateForm-form">
        <div className="form-field">
          <label htmlFor="templateFormTitle">Title</label>
          <input
            id="templateFormTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
            autoFocus
          />
        </div>

        <div className="form-field">
          <label>Type</label>
          <div className="type-pill">
            {isBookTemplate
              ? getBookPageTypeLabel(selectedType)
              : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
          </div>
        </div>

        {isBookTemplate && (
          <div className="form-field">
            <label>Add existing pages</label>
            <div className="pages-selector">
              {assignablePages.length === 0 && (
                <p className="empty-pages">No eligible pages available.</p>
              )}

              {assignablePages.map((page) => {
                const isChecked = selectedPageIds.includes(page.pageMeta.id);
                return (
                  <label
                    key={page.pageMeta.id}
                    className="page-option"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        setSelectedPageIds((prev) => {
                          if (e.target.checked) {
                            return [...prev, page.pageMeta.id];
                          }
                          return prev.filter((id) => id !== page.pageMeta.id);
                        });
                      }}
                    />
                    <span>
                      {getPageTitle(page)} ({page.pageMeta.type})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {!isBookTemplate && (
          <div className="form-field">
            <label>Initial Content</label>
            <div className="editor-shell">
              <Editor
                ref={editorRef}
                initialBlocks={[]}
                editable={true}
                placeholder="Start writing..."
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            className="ghost"
            onClick={onBack}
          >
            Back
          </button>
          <button
            className="primary"
            disabled={!title.trim()}
            onClick={async () => {
              try {
                if (isBookTemplate) {
                  const createBookRes = await pageActions.books.create(title.trim(), selectedType);
                  if (!createBookRes.ok) {
                    throw new Error(String(createBookRes.error));
                  }

                  if (selectedPageIds.length > 0) {
                    const moveResults = await Promise.all(
                      selectedPageIds.map((pageId) =>
                        pageActions.page.setBookId(pageId, createBookRes.value.id),
                      ),
                    );

                    const failedMoves = moveResults.filter((result) => !result.ok);
                    if (failedMoves.length > 0) {
                      throw new Error(`Failed to attach ${failedMoves.length} page(s)`);
                    }
                  }

                  appToast.success(`Book created. ID: ${createBookRes.value.id}`);
                } else {
                  const blocks = editorRef.current?.serialize() ?? [];
                  const hasContent = blocks.length > 0;

                  const createRes = hasContent
                    ? await pageActions.page.createWithInitialSnapshot(
                      title.trim(),
                      selectedType,
                      JSON.stringify(blocks),
                    )
                    : await pageActions.page.create(title.trim(), selectedType);

                  if (!createRes.ok) {
                    throw new Error(String(createRes.error));
                  }
                  appToast.success("Page created.");
                }

                await pageActions.pages.load();
                await pageActions.books.load();
                setActiveTabTypeAndView("library", "list");
              } catch (err) {
                console.error("Failed to save memory:", err);
                appToast.error("Failed to create memory.");
              }
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateForm;
