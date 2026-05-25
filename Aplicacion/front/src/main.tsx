import { createRoot } from "react-dom/client";
import App from "./app.tsx";
import { StrictMode } from "react";

import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";

import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";

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