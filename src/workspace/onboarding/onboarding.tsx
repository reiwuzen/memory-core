import { useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/hooks/useLibrary";
import { useActiveTab } from "@/hooks/useActiveTab";
import { Button, Modal } from "@/components/ui";
import "./onboarding.scss";

const ONBOARDING_KEY = "zensys.onboarding.completed.v1";
const PRIORITY_STRATEGY_KEY = "zensys.priority.strategy.v1";

const priorityStrategies = [
  {
    id: "recency",
    label: "Recency Balanced",
    description: "Bias toward recently opened and updated pages.",
  },
  {
    id: "knowledge-depth",
    label: "Knowledge Depth",
    description: "Prioritize pages with tags and deep snapshot history.",
  },
  {
    id: "manual-focus",
    label: "Manual Focus",
    description: "Keep priority controlled mostly by your explicit sorting.",
  },
] as const;

const Onboarding = () => {
  const { pagesStore, pageActions } = useLibrary();
  const { setActiveTabTypeAndView } = useActiveTab();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>(() => {
    return localStorage.getItem(PRIORITY_STRATEGY_KEY) ?? "recency";
  });

  useEffect(() => {
    pageActions.pages.load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shouldShow = useMemo(() => {
    const isCompleted = localStorage.getItem(ONBOARDING_KEY) === "true";
    return !isCompleted && pagesStore.pages.length === 0;
  }, [pagesStore.pages.length]);

  useEffect(() => {
    setIsOpen(shouldShow);
  }, [shouldShow]);

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.setItem(PRIORITY_STRATEGY_KEY, selectedStrategy);
    setIsOpen(false);
  };

  return (
    <Modal
      title="Welcome to Memory-Core"
      isOpen={isOpen}
      onClose={complete}
      actions={
        <>
          <Button variant="ghost" onClick={complete}>
            Skip for now
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              complete();
              setActiveTabTypeAndView("create", "picker");
            }}
          >
            Create First Page
          </Button>
        </>
      }
    >
      <div className="onboarding">
        <p>
          Create your first memory space, choose a priority strategy, and use the command palette with{" "}
          <kbd>Ctrl/Cmd + K</kbd>.
        </p>
        <div className="strategy-list" role="radiogroup" aria-label="Priority strategy">
          {priorityStrategies.map((strategy) => (
            <label key={strategy.id} className="strategy-item">
              <input
                type="radio"
                name="priority-strategy"
                value={strategy.id}
                checked={selectedStrategy === strategy.id}
                onChange={(event) => setSelectedStrategy(event.target.value)}
              />
              <div>
                <strong>{strategy.label}</strong>
                <span>{strategy.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default Onboarding;
