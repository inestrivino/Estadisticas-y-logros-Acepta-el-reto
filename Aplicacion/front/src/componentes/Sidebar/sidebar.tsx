import { Navbar, Nav, Offcanvas, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb, faBars, faChartLine, faChartPie, faTableList, faAward, faHouseChimney } from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";
import { EventType } from "shared/EventTypes.ts";
import BarraCarga from "./barraCarga";
import { useAppContext } from "../../contexto/contextos";

export default function Sidebar() {

  //porcentaje de carga inicial para la barra
  const [porcentajeCarga, setPorcentajeCarga] = useState(0);
  useEffect(() => {
    fetch("/api/gestion/porcentajeCarga")
      .then(res => res.json())
      .then(data => setPorcentajeCarga(data));
  }, []);

  //estado del offcanvas en pantallas pequeñas
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  //titulo que se muestra en la navbar de pantallas pequeñas segun la ruta
  const location = useLocation();

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

  const appContext = useAppContext();
  const rutaRanking = appContext?.usuarioActual
    ? `/usuarios/ranking?usuarioActual=${appContext.usuarioActual}`
    : "/usuarios/ranking";

  const links = (
    <>
      <Nav.Link as={NavLink} className="app-nav-link" to="/">
        <FontAwesomeIcon icon={faHouseChimney} />Inicio</Nav.Link>

      <Nav.Link as={NavLink} className="app-nav-link" to={"/problemas"}>
        <FontAwesomeIcon icon={faChartPie} />Estadísticas ejercicios</Nav.Link>

      <Nav.Link as={NavLink} className="app-nav-link" to={`/usuarios/estadisticas`}>
        <FontAwesomeIcon icon={faChartLine} />Estadísticas usuario</Nav.Link>

      <Nav.Link as={NavLink} className="app-nav-link" to={`/usuarios/logros`}>
        <FontAwesomeIcon icon={faAward} />Logros</Nav.Link>

      <Nav.Link as={NavLink} className="app-nav-link" to={rutaRanking}>
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            ¡Acepta el reto!
            <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#ffffff", letterSpacing: "0.05em" }}>
              Estadísticas y Logros
            </span>
          </div>
        </Navbar.Brand>

        <Nav className="flex-column gap-3 sidebar-links">
          {links}
        </Nav>

        <div className="mt-auto">
          <BarraCarga evento={EventType.CARGA_ENVIOS} progresoInicial={porcentajeCarga} />
        </div>
      </div>

      {/*sidebar desplegada para pantallas pequeñas (con offcanvas) */}
      <Offcanvas show={show} onHide={handleClose} placement="start" className="app-offcanvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="app-offcanvas-titulo">
            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              ¡Acepta el reto!
              <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#ffffff", letterSpacing: "0.05em" }}>
                Estadísticas y Logros
              </span>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="app-offcanvas-body d-flex flex-column">
          <Nav className="flex-column gap-3 sidebar-links">{links}</Nav>
          <div className="mt-auto pt-3">
            {porcentajeCarga >= 0 && <BarraCarga evento={EventType.CARGA_ENVIOS} progresoInicial={porcentajeCarga} />}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}