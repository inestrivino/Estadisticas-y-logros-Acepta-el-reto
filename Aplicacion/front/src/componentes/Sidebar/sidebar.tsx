import { Navbar, Nav, Offcanvas, Button } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb, faBars, faChartLine, faChartPie, faTableList, faAward, faGear, faHouseChimney } from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";

type Params = {
  problema?: string;
  usuario?: string;
};

export default function Sidebar() {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const location = useLocation();
  const params = useParams<Params>();

  const getTitulo = () => {
    if (location.pathname.startsWith("/problemas"))
      return "Estadísticas ejercicios";

    if (location.pathname.startsWith("/usuarios/estadisticas"))
      return "Estadísticas usuario";

    if (location.pathname.startsWith("/usuarios/logros"))
      return "Logros de usuario";

    if (location.pathname.startsWith("/usuarios/ranking"))
      return "Ranking usuarios";

    if (location.pathname === "/pruebaSocket")
      return "Prueba socket";

    return "¡Acepta el reto!";
  };

  //TODO cambiar el valor por defecto
  const links = (
    <>
      <Nav.Link as={NavLink} className="app-nav-link" to="/">
        <FontAwesomeIcon icon={faHouseChimney} />Inicio</Nav.Link>
      <Nav.Link as={NavLink} className="app-nav-link" to={"/problemas" + (params.problema ? `/${params.problema}` : ``)}>
        <FontAwesomeIcon icon={faChartPie} />Estadísticas ejercicios</Nav.Link>
      <Nav.Link as={NavLink} className="app-nav-link" to={`/usuarios/estadisticas` + (params.usuario ? `/${params.usuario}` : ``)}>
        <FontAwesomeIcon icon={faChartLine} />Estadísticas usuario</Nav.Link>
      <Nav.Link as={NavLink} className="app-nav-link" to={`/usuarios/logros/` + (params.usuario ? `/${params.usuario}` : ``)}>
        <FontAwesomeIcon icon={faAward} />Logros</Nav.Link>
      <Nav.Link as={NavLink} className="app-nav-link" to="/usuarios/ranking">
        <FontAwesomeIcon icon={faTableList} />Tabla de clasificación</Nav.Link>
    </>
  );

  return (
    <>
      {/*navbar superior para pantallas pequeñas*/}
      <Navbar className="d-lg-none fixed-top px-3 app-navbar-top">
        <Button variant="outline-primary" onClick={handleShow}>
          <FontAwesomeIcon icon={faBars} />
        </Button>

        <Navbar.Brand className="ms-2 app-navbar-titulo">
          {getTitulo()}
        </Navbar.Brand>
      </Navbar>

      {/*Sidebar fija en pantallas grandes*/}
      <div className="sidebar d-none d-lg-flex flex-column p-3">
        <Navbar.Brand className="mb-5 app-navbar-titulo">
          <FontAwesomeIcon icon={faLightbulb} className="me-2" />
          ¡Acepta el reto!
        </Navbar.Brand>

        <Nav className="flex-column gap-3 sidebar-links">
          {links}
        </Nav>
      </div>

      {/*sidebar desplegada para pantallas pequeñas (con offcanvas) */}
      <Offcanvas show={show} onHide={handleClose} placement="start" className="app-offcanvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="app-offcanvas-titulo">
            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
            ¡Acepta el reto!
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="app-offcanvas-body">
          <Nav className="flex-column gap-3 sidebar-links">{links}</Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}