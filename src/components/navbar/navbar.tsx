import { useState } from "react";
import "./navbar.scss";
import { useActiveTab } from "@/hooks/useActiveTab";
import { TabType, TabView } from "@/types/tab";
import { useSettings } from "@/hooks/useSettings";

const Navbar = () => {
  const { activeTab, setActiveTabTypeAndView } = useActiveTab();
  const [isOpen, setIsOpen] = useState(false);
  const {settingsView} = useSettings();

  const handleClick =<T extends TabType> (type: T, view: TabView<T>) => {
    setActiveTabTypeAndView(type, view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`nav-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="nav-backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navbar */}
      <nav
        id="navbar"
        className={`navbar ${isOpen ? "open" : ""}`}
      >
        <ul>
          <li
            className={activeTab?.type === "overview" ? "active" : ""}
            onClick={() => handleClick("overview", "list")}
          >
            <h6>Overview</h6>
          </li>

          <li
            className={activeTab?.type === "library" ? "active" : ""}
            onClick={() => handleClick("library", "list")}
          >
            <h6>Library</h6>
          </li>

          <li
            className={activeTab?.type === "create" ? "active" : ""}
            onClick={() => handleClick("create", "picker")}
          >
            <h6>Create</h6>
          </li>

          <li
            className={activeTab?.type === "structure" ? "active" : ""}
            onClick={() => handleClick("structure", "list")}
          >
            <h6>Structure</h6>
          </li>
          <li
            className={activeTab?.type === 'calender' ? 'active' : ''}
            onClick={() => handleClick('calender','calender')}
          >
            <h6>Calender</h6>
          </li>

          <li
            onClick={() => {settingsView.isOpen.actions.enable();setIsOpen(false)}}
          >
            <h6>Settings</h6>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Navbar;
