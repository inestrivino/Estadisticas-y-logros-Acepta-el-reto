import { Outlet } from "react-router-dom";
import Sidebar from "../../componentes/Sidebar/sidebar";
import { Container } from "react-bootstrap";
import "./Layout.css";

export default function Layout() {
    return(
        <div className="d-flex h-full">
            <Sidebar />
            <div className="contenido h-full overflow-auto" style={{width: "100%", boxSizing: "border-box"}}>
                <Outlet />
            </div>
        </div>
    )
}