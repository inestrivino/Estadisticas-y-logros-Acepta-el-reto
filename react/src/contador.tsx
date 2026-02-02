import { useState } from "react";

export function Contador() {
  // Estado del contador
  const [count, setCount] = useState(0);

  // Funciones para aumentar y disminuir
  const incrementar = () => setCount(count + 1);
  const decrementar = () => setCount(count - 1);
  const resetear = () => setCount(0);

  return (
    <div style={{marginTop: "50px" }}>
      <h1>Contador React</h1>
      <p>Valor actual: {count}</p>
      <button onClick={incrementar}>+</button>
      <button onClick={decrementar}>-</button>
      <button onClick={resetear}>Reset</button>
    </div>
  );
}