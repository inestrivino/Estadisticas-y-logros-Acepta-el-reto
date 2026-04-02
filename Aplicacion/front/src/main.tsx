import { createRoot } from "react-dom/client";
import App from "./app.tsx";
import { StrictMode } from "react";
import './index.css';

const domNode3 = document.getElementById("root");
if (domNode3) {
    const root3 = createRoot(domNode3);
    root3.render (
        <StrictMode>
            <App />
        </StrictMode>
    )
}