import "./App.scss";

import Navbar from "./components/navbar/navbar";
import Editor from "./workspace/editor/editor";
function App() {
  

  return (
    <main className="container">
      <Navbar></Navbar>
      <Editor></Editor>
    </main>
  );
}

export default App;
