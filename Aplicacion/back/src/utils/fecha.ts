export default function dateToTimestamp(fecha: { dia: number, mes: number, anio: number }): number {
    const date = new Date(Date.UTC(fecha.anio, fecha.mes, fecha.dia));
    date.setUTCHours(0, 0, 0, 0);
    return date.valueOf() / 1000;
}