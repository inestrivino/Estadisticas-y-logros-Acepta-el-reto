import { Outlet } from "react-router-dom";
import Sidebar from "../../componentes/Sidebar/sidebar";
import { Container } from "react-bootstrap";
import "./Layout.css";

export default function Layout() {
    return (
        <div className="d-flex layout-wrapper">
            <Sidebar />
            <div className="contenido">
                <Outlet />
            </div>
        </div>
    )
}