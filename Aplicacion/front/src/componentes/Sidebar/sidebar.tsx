import { Navbar, Nav, Offcanvas, Button } from "react-bootstrap";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb, faBars, faChartLine, faChartPie, faTableList, faAward, faGear, faXmark } from "@fortawesome/free-solid-svg-icons";
import "./sidebar.css";

export default function Sidebar() {
  const [show, setShow] = useState(false);

  const links = (
    <>
      <Nav.Link href="#"><FontAwesomeIcon icon={faChartLine} />Mis estadísticas</Nav.Link>
      <Nav.Link href="#"><FontAwesomeIcon icon={faAward} />Logros</Nav.Link>
      <Nav.Link href="#"><FontAwesomeIcon icon={faTableList} />Tabla de clasificación</Nav.Link>
      <Nav.Link href="#"><FontAwesomeIcon icon={faChartPie} />Estadísticas de ejercicios</Nav.Link>
      <Nav.Link href="#"><FontAwesomeIcon icon={faGear} />Ajustes</Nav.Link>
    </>
  );

  return (
    <>
      {/* cuando la pantalla es pequeña se esconde la navbar y se muestra solo este boton para desplegarla */}
      <Button className="d-lg-none m-2" onClick={() => setShow(true)}>{/*TODO cambiar para que coincida con el color de la navbar */}
        <FontAwesomeIcon icon={faBars} />
      </Button>

      <div className="d-flex">
        
        {/*La navbar cuando la pantalla es grande se muestra siempre a la izquierda*/}
        <Navbar className="d-none d-lg-flex flex-column p-3 navbar-lg">
          <Navbar.Brand className="mb-5 fs-4">
            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
            ¡Acepta el reto!
          </Navbar.Brand>
          <Nav className="flex-column w-100 gap-3 mt-2">{links}</Nav>
        </Navbar>

        {/*La navbar cuando la pantalla es pequeña y esta desplegada cubre toda la pantalla */}
        <div className={`navbar-sm ${show ? "show" : ""}`}>
          <div className="navbar-title">
            <span>
              <FontAwesomeIcon icon={faLightbulb} className="me-2" />
              ¡Acepta el reto!
            </span>
            <FontAwesomeIcon
              icon={faXmark}
              className="close-icon"
              onClick={() => setShow(false)}
            />
          </div>
          <Nav className="flex-column">{links}</Nav>
        </div>
        
      </div>
    </>
  );
}