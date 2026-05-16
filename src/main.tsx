
// Import the createRoot function from React DOM for rendering the app
import { createRoot } from "react-dom/client";
// Import the main App component
import App from "./app/App.tsx";
// Import global CSS styles
import "./styles/index.css";

// Create a root and render the App component into the DOM element with id 'root'
createRoot(document.getElementById("root")!).render(<App />);
  