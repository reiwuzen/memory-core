import { invoke } from "@tauri-apps/api/core";
import "./App.scss";

import Navbar from "./components/navbar/navbar";
import Workspace from "./workspace/workspace";
function App() {
  invoke("create_memory_spaces_dir")
  return (
    <main className="container">
      <Navbar />
      <Workspace />
    </main>
  );
}

export default App;
