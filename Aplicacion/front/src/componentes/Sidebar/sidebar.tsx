import { Navbar, Nav, Offcanvas, Button } from "react-bootstrap";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb, faBars, faChartLine, faChartPie, faTableList, faAward, faGear, faXmark } from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";

export default function Sidebar() {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const links = (
    <>
      <Nav.Link href="#"><FontAwesomeIcon icon={faChartLine} />Mis estadísticas</Nav.Link>
      <Nav.Link href="/problemas/problema3"><FontAwesomeIcon icon={faAward} />Logros</Nav.Link>
      <Nav.Link href="/problemas/problema2"><FontAwesomeIcon icon={faTableList} />Tabla de clasificación</Nav.Link>
      <Nav.Link href="/problemas/problema1"><FontAwesomeIcon icon={faChartPie} />Estadísticas ejercicios</Nav.Link>
      <Nav.Link href="/pruebaSocket"><FontAwesomeIcon icon={faGear} />Ajustes</Nav.Link>
    </>
  );

  return (
    <>
      {/*navbar superior para pantallas pequeñas*/}
      <Navbar className="d-lg-none fixed-top px-3">
        <Button variant="outline-primary" onClick={handleShow}>
          <FontAwesomeIcon icon={faBars} />
        </Button>

        <Navbar.Brand className="ms-2">
          <FontAwesomeIcon icon={faLightbulb} className="me-2" />
          ¡Acepta el reto!
        </Navbar.Brand>
      </Navbar>

      {/*Sidebar fija en pantallas grandes*/}
      <div className="sidebar d-none d-lg-flex flex-column p-3">
        <Navbar.Brand className="mb-5">
          <FontAwesomeIcon icon={faLightbulb} className="me-2" />
          ¡Acepta el reto!
        </Navbar.Brand>

        <Nav className="flex-column gap-3 sidebar-links">
          {links}
        </Nav>
      </div>

      {/*sidebar desplegada para pantallas pequeñas (con offcanvas) */}
      <Offcanvas show={show} onHide={handleClose} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
            ¡Acepta el reto!
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <Nav className="flex-column gap-3 sidebar-links">{links}</Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}