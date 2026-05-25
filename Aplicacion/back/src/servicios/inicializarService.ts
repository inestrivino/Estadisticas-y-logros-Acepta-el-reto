import procesarEnviosService from './procesarEnviosService.js';
import gestionDAO from '../dao/gestionDAO.js';
import { EnvioSinProcesarInicial } from "../types/envios/envioSinProcesarInicial.js";
import gestionService from './gestionService.js';

type RespuestaApi = { submission: EnvioSinProcesarInicial[] };
type PaginaFetched = { data: RespuestaApi, pagina: number };
type EnvioConPagina = { envio: EnvioSinProcesarInicial, numPagina: number };

class InicializarService {

    //CONSTANTES
    private tamanioBloque = 50; //numero de paginas que se acumularan antes de mandar los datos a la base de datos
    private salto = 20; //resultados por pagina
    private poolSize = 20; //numero de peticiones que hay a la vez a la api
    private expected = -1; //numero de envio que se espera
    private diferenciaDeProcesado = 10; //diferencia máximo entre el último bloque que se proceso y el que ya se recibieron sus paginas
    private numPaginasRecuperar = 10; //numero de paginas que se miran hacia atras al recuperar envios perdidos

    //NUMERO DE PETICIONES QUE SE ESTAN EJECUTANDO
    private currentInPool = 0;
    private ultimoBloquePaginaRecibidas = -1;
    private ultimoBloqueProcesado = -1;

    /**
     * Arranca la carga inicial de envios desde la API, retomando desde donde se quedo en
     * el ultimo arranque gracias al ultimo envio y la ultima pagina almacenados en Redis.
     * @returns el numero del ultimo envio procesado.
     */
    public async inicializar() {

        //se mira si ya se han cargado todos los envios
        if (await this.yaCargadosTodos()) 
            return;

        //se busca el primer envio a procesar y la pagina donde esta
        const { envio, pagina } = await this.buscarPrimerEnvio();

        this.expected = envio;

        let cola: Promise<void> = Promise.resolve();

        for await (const { promesa, numBloque } of this.peticiones(pagina, envio)) {

            this.ultimoBloquePaginaRecibidas = numBloque;

            //le llega la cadena de promesas a procesarBloque y le dice que cuando se procese mande el resultado a procesarEnviosService
            cola = cola.then(async () => {
                const bloque = await promesa;
                this.ultimoBloqueProcesado = numBloque;
                await procesarEnviosService.procesarBloqueEnviosInicial(bloque);
                console.log(` + Bloque ${numBloque} insertado en la base de datos\n`);
            });

        }

        //se procesa el ultimo bloque de la cola
        await cola;
    }

    /**
     * Comprueba si la base de datos ya contiene todos los envios disponibles en la API.
     * Compara el numero del ultimo envio cargado en la base de datos con el numero del
     * ultimo envio actual de la API (normalizado al inicio de su pagina, multiplo de 20 + 1).
     * @returns `true` si el ultimo envio cargado coincide con el ultimo envio de la API,
     * lo que indica que no hay envios nuevos por procesar, `false` en caso contrario.
     */
    private async yaCargadosTodos(): Promise<boolean> {
        
        let ultimoEnvioCargado: number = await gestionService.getUltimoEnvio();

        //se hace una primera peticion para ver el numero del ultimo envio
        const url = this.generarUrl(1);
        const res = await fetch(url);
        const text = await res.text();
        const json: RespuestaApi = JSON.parse(text);
        const ultimoEnvioNumber = json.submission[0].num;

        return ultimoEnvioNumber === ultimoEnvioCargado;
    }

    /**
     * Localiza el primer envio a procesar y la pagina de la API donde se encuentra.
     * Si no hay envios previos arranca desde el principio, si los hay retoma desde el siguiente al ultimo procesado.
     * @returns Objeto con el numero de envio y la pagina de referencia donde buscarlo.
     */
    private async buscarPrimerEnvio(): Promise<{ envio: number, pagina: number }> {

        //saca el ultimo envio que se metio en la base de datos
        let ultimoEnvio: number = await gestionService.getUltimoEnvio();
        let referenciaPagina: number = 1;

        //DEBUG
        const ultimoEnvioManual = process.env.ULTIMOENVIO;
        if (ultimoEnvioManual !== undefined && Number(ultimoEnvioManual) !== -1)
            ultimoEnvio = Number(ultimoEnvioManual);

        //si no habia envios aun se pone 1
        if (ultimoEnvio === 0) {
            ultimoEnvio = 1;

            //se hace una primera peticion para ver el numero del ultimo envio
            const url = this.generarUrl(1);
            const res = await fetch(url);
            const text = await res.text();
            const json: RespuestaApi = JSON.parse(text);
            const ultimoEnvioNumber = Math.round(json.submission[0].num / 20) * 20 + 1;

            referenciaPagina = ultimoEnvioNumber;
        }

        //si habia se busca el siguiente, y se mira que pagina fue la ultima revisada
        else {
            ultimoEnvio++;
            referenciaPagina = Math.round(await gestionDAO.getUltimaPagina() / 20) * 20 + 1;
        }

        //se busca a partir de la referencia un intervalo en el que dentro este el envio buscado
        const { ini, fin } = await this.buscarPrimerIntervalo(ultimoEnvio, referenciaPagina);

        //se hace una busqueda binaria en el intervalo encontrado para encontrar la pagina con el envio
        const firstPagina = await this.bucarEnIntervalo(ultimoEnvio, ini, fin);

        //si es la primera pagina que se carga se marca cual es
        if (ultimoEnvio === 1)
            await gestionDAO.setPrimeraPagina(firstPagina);

        return { envio: ultimoEnvio, pagina: firstPagina };
    }

    /**
     * Busca el intervalo de paginas que contiene el primer envio a procesar.
     * Usa saltos exponenciales hacia arriba o hacia abajo desde la pagina de referencia
     * hasta acotar un rango donde debe estar el envio buscado.
     * @param firstEnvio - Numero del primer envio que se quiere procesar.
     * @param firstPagina - Numero de pagina de la API usado como punto de partida.
     * @returns Objeto `{ ini, fin }` con los limites del intervalo encontrado.
     */
    private async buscarPrimerIntervalo(firstEnvio: number, firstPagina: number): Promise<{ ini: number, fin: number }> {

        console.log(`Comienza la busqueda del intervalo desde ${firstPagina} en busqueda del envio ${firstEnvio}:`);

        //se comprueba segun la referencia que teniamos hacia donde tiene que ir la busqueda del intervalo
        /*
        ir hacia abajo significa que o nos hemos ido tan atras que no hay envios o que el numero de envio es mas 
        grande que el buscado y entonces vamos hacia abajo en el numero de pagina
        */
        /*
        ir hacia arriba es lo contrario, el numero de envio buscado es mas pequenio que el actual y vamos
        hacia arriba en el numero de paginas
        */
        let haciaAbajo = false;
        let url = this.generarUrl(firstPagina);
        const res = await fetch(url);
        const text = await res.text();
        const json: RespuestaApi = JSON.parse(text);
        if (json.submission.length === 0 || json.submission[json.submission.length - 1].num < firstEnvio)
            haciaAbajo = true;
        if (haciaAbajo && json.submission.length !== 0 && json.submission[0].num > firstEnvio) //se encuentra directamente en la primera pagina
            return { ini: firstPagina, fin: firstPagina }

        //se comienza la busqueda teniendo en cuenta ese envio como referencia
        let saltoAux = this.salto;
        let pagina = firstPagina;
        let prevPagina = firstPagina;

        let intervaloEncontrado = false;
        while (!intervaloEncontrado) {

            prevPagina = pagina;
            if (haciaAbajo) {
                pagina = firstPagina - saltoAux;

                //esta es la primera pagina y no tiene sentido ir mas abajo 
                if (pagina < 1)
                    pagina = 1;
            }
            else
                pagina = firstPagina + saltoAux;

            url = this.generarUrl(pagina);
            const response = await fetch(url);
            const text = await response.text();
            const current: RespuestaApi = JSON.parse(text);

            saltoAux *= 2;
            console.log(`Pagina ${pagina}`);

            if (haciaAbajo && current.submission.length !== 0 && current.submission[current.submission.length - 1].num >= firstEnvio)
                intervaloEncontrado = true;
            else if (!haciaAbajo && (current.submission.length === 0 || current.submission[0].num <= firstEnvio))
                intervaloEncontrado = true;
        }

        //UNA VEZ YA SE HA ENCONTRADO UN RANGO DONDE ESTA EL COMIENZO SE HACE UNA BUSQUEDA BINARIA
        let ini: number = Math.max(prevPagina, pagina);
        let fin: number = Math.min(prevPagina, pagina);

        console.log(`Se encontro el intervalo de ${ini} a ${fin}`);

        return { ini, fin };
    }

    /**
     * Realiza una busqueda binaria dentro del intervalo `[fin, ini]` para encontrar
     * la pagina exacta que contiene el envio con numero `envio`.
     * @param envio - Numero del envio que se quiere localizar.
     * @param ini - Limite superior del intervalo (numero de pagina mas alto).
     * @param fin - Limite inferior del intervalo (numero de pagina mas bajo).
     * @returns El numero de pagina donde se encuentra el envio buscado.
     */
    private async bucarEnIntervalo(envio: number, ini: number, fin: number): Promise<number> {

        console.log("\nComienza la busqueda binaria:");

        let encontrado: boolean = false;
        let inicioEncontrado = -1;

        while (!encontrado) {
            //se hace la peticion a la mitad del nuevo intervalo
            const mitad = Math.round((ini + (fin - ini) / 2) / 20) * 20 + 1;
            const url = this.generarUrl(mitad);

            const response = await fetch(url);
            const text = await response.text();
            const current: RespuestaApi = JSON.parse(text);

            console.log(`Ini: ${ini}, Pagina: ${mitad}, Fin: ${fin}`);

            //avanza el inicio del intervalo a la mitad del actual 
            if (current.submission.length === 0 || current.submission[0].num < envio)
                ini = Math.trunc((ini + (fin - ini) / 2) / 20) * 20 + 1;

            //se ha pasado del inicio
            else if (current.submission[current.submission.length - 1].num > envio)
                fin = mitad;

            //se encuentra el inicio
            else {
                encontrado = true;
                inicioEncontrado = mitad;
            }
        }

        return inicioEncontrado;
    }

    /**
     * Lanza las peticiones HTTP a la API en paralelo respetando el tamaño del pool.
     * Cuando acumula un bloque lo cede con yield sin pausar el bucle de fetch,
     * de modo que el pool nunca queda ocioso en los limites de bloque.
     * @param firstPagina - Numero de la primera pagina desde la que empezar a pedir.
     * @param firstEnvio - Numero del primer envio que se debe incluir en el resultado.
     * @yields Objeto con la promesa del bloque procesado listo para consumir.
     */
    private async * peticiones(firstPagina: number, firstEnvio: number): AsyncGenerator<{ promesa: Promise<EnvioConPagina[]>, numBloque: number }> {

        console.log(`\nComienza el procesamiento de los envios desde la pagina ${firstPagina}:`);

        let i = 0;
        let contadorBloque = 0;
        const enCurso = new Map<number, Promise<PaginaFetched>>();
        let promesasBloque = new Set<Promise<PaginaFetched>>();
        let colaBloque: Promise<EnvioConPagina[]> = Promise.resolve([]);

        //se va pidiendo urls al generador
        for await (const { url, pagina } of this.generadorUrls(firstPagina)) {

            //crea la promesa en la que se hace la peticion a esta pagina
            const promesa = this.fetchUrl(url, pagina, contadorBloque, i);

            //se pone en curso
            enCurso.set(pagina, promesa);
            this.currentInPool++;

            //se pone tambien con el resto de promesas de su grupo
            promesasBloque.add(promesa);

            //se espera hasta que haya espacio en el pool
            const diferenciaAux = this.ultimoBloquePaginaRecibidas - this.ultimoBloqueProcesado;
            if (this.currentInPool >= this.poolSize || diferenciaAux >= this.diferenciaDeProcesado) {
                const aux = await Promise.race(enCurso.values());
                enCurso.delete(aux.pagina);
                this.currentInPool--;
            }

            i++;

            //si ya se han hecho todas las peticiones de un bloque se encola su procesamiento
            if (i === this.tamanioBloque) {
                const promesasCurrent = promesasBloque;
                const bloqueCurrent = contadorBloque;

                //se encandenan los procesamientos de los bloques para que vayan en serie pero sin bloquear las peticiones
                colaBloque = colaBloque.then(() => this.procesarBloque(firstEnvio, bloqueCurrent, promesasCurrent));
                yield { promesa: colaBloque, numBloque: bloqueCurrent };

                //se reinicia el contador de peticiones por bloque
                promesasBloque = new Set();
                i = 0;
                contadorBloque++;
            }
        }

        if (promesasBloque.size > 0) {
            const promesasCurrent = promesasBloque;
            const bloqueCurrent = contadorBloque;
            colaBloque = colaBloque.then(() => this.procesarBloque(firstEnvio, bloqueCurrent, promesasCurrent));
            yield { promesa: colaBloque, numBloque: bloqueCurrent };
        }

        console.log(" * Procesamiento completado");
    }

    /**
     * Generador asincrono que produce URLs de paginacion en orden descendente
     * desde la pagina `ini` hasta la pagina 0, decrementando de `salto` en `salto`.
     * @param ini - Numero de pagina desde el que empezar a generar URLs.
     * @yields Objeto `{ url, pagina }` con la URL generada y su numero de pagina.
     */
    private async * generadorUrls(ini: number) {
        let contador = ini;
        while (contador > 0) {
            const url = this.generarUrl(contador);
            yield { url: url.toString(), pagina: contador };
            contador -= this.salto;
        }
    }

    /**
     * Construye la URL de la API para una pagina concreta usando las variables de
     * entorno `baseUrl`, `param1Name` y `param2Name`.
     * @param param1 - Valor del primer parametro de paginacion (numero de pagina).
     * @returns Objeto `URL` listo para usar en una peticion `fetch`.
     */
    private generarUrl(param1: number) {
        const baseUrl: string = process.env.baseUrl!;
        const param1Name: string = process.env.param1Name!;
        const param2Name: string = process.env.param2Name!;

        const url = new URL(baseUrl);
        url.searchParams.set(param1Name, String(param1));
        url.searchParams.set(param2Name, String(20));
        return url;
    }

    /**
     * Realiza una peticion HTTP a la URL indicada con reintentos automaticos hasta
     * obtener una respuesta satisfactoria (`res.ok`).
     * @param url - URL a la que realizar la peticion.
     * @param pagina - Numero de pagina asociado a esta peticion (usado para logging).
     * @param bloque - indice del bloque al que pertenece esta peticion (usado para logging).
     * @param posBloque - Posicion dentro del bloque (usado para logging).
     * @returns Objeto `{ data, pagina }` con el JSON parseado y el numero de pagina.
     */
    private async fetchUrl(url: string, pagina: number, bloque: number, posBloque: number): Promise<PaginaFetched> {
        //console.log(`[enviada]  Pagina ${pagina} bloque: ${bloque}, posBloque ${posBloque}`);
        let res;
        do {
            res = await fetch(url);
            if (!res.ok)
                console.error(`Error con url: ${url}, reintentando`);
        } while (!res.ok)

        const data: RespuestaApi = JSON.parse(await res.text());
        console.log(`[recibida] Pagina ${pagina} bloque: ${bloque}, posBloque: ${posBloque}`); //TODO poner un logger donde se pueda configurar que mensajes ver

        return { data, pagina };
    }

    /**
     * Espera a que todas las peticiones de un bloque terminen y extrae los numeros
     * de envio en orden ascendente. Si detecta que falta algun envio, intenta recuperarlo
     * mirando paginas anteriores.
     * @param firstEnvio - Numero del primer envio que se debe incluir (se ignoran los anteriores).
     * @param bloque - indice del bloque (usado para logging).
     * @param promesasBloque - Conjunto de promesas pendientes del bloque actual.
     * @returns Array con envios procesados y la pagina donde estaban.
     */
    private async procesarBloque(
        firstEnvio: number,
        bloque: number,
        promesasBloque: Set<Promise<PaginaFetched>>
    ): Promise<EnvioConPagina[]> {

        //una vez es su turno espera a que todas las peticiones a las paginas del bloque se hayan hecho
        const datosBloque = await Promise.all(promesasBloque);

        //DEBUG para mostrar por consola los que se van procesando
        const tamanioBloque = datosBloque[0].data.submission.length;
        let primerProcesadoIdx = datosBloque[0].data.submission[tamanioBloque - 1].num;
        let ultimoProcesadoIdx = -1;

        //bloque con los envios procesados a devolver
        const datosProcesados = new Array<EnvioConPagina>();

        //se itera por cada pagina del bloque
        for (const pagina of datosBloque) {

            //envios de la pagina y su pagina
            const submissions = pagina.data.submission;
            const numPagina = pagina.pagina;

            //se itera por cada envio
            for (const envio of submissions.reverse()) {

                //si estamos en la pagina correcta pero todavia no es el envio correcto se salta
                if (envio.num < firstEnvio) {
                    primerProcesadoIdx = envio.num + 1;
                    continue;
                }

                //si el que llega es mayor al que se esperaba nos hemos saltado alguno
                else if (this.expected < envio.num) {
                    console.log(`\n - Procesados del ${primerProcesadoIdx} al ${ultimoProcesadoIdx}`)
                    primerProcesadoIdx = envio.num;
                    console.error(` - expected: ${this.expected} current: ${envio.num}`);

                    //se crea un array con los que nos hemos saltado
                    const envios: number[] = new Array();
                    for (let j = this.expected; j < Number(envio.num); j++)
                        envios.push(j);

                    //se recuperan yendo hacia atras los que perdimos
                    const recuperados = await this.recuperarEnvios(envios, numPagina);

                    //los que se encuentran se encuentran se meten en el array de procesados
                    for (const envioRecuperado of recuperados) {
                        console.log(` - Recuperado ${envioRecuperado.num}`);
                        datosProcesados.push({ envio: envioRecuperado, numPagina });
                    }
                    this.expected = envio.num + 1;
                }

                //despues de las excepciones se guarda el envio actual
                datosProcesados.push({ envio, numPagina });
                this.expected++;
                ultimoProcesadoIdx = envio.num; //DEBUG
            }
        }
        console.log(`\n - Procesados del ${primerProcesadoIdx} al ${ultimoProcesadoIdx}`)
        console.log(` + Bloque ${bloque} procesado`);

        return datosProcesados;
    }

    /**
     * Intenta recuperar envios que se saltaron durante el procesamiento normal,
     * buscando hacia atras un maximo de 10 paginas desde la pagina indicada.
     * @param envios - Array con los numeros de envio que hay que recuperar.
     * @param pagina - Numero de pagina desde la que empezar a buscar hacia atras.
     * @returns Array con los objetos de envio recuperados (puede ser menor que `envios` si no se encontraron todos).
     */
    private async recuperarEnvios(envios: number[], pagina: number) {

        //limita a 10 el numero de peticiones que puede haber mientras se recuperan otras paginas
        this.currentInPool += this.numPaginasRecuperar;

        //va como maximo numPaginasRecuperar paginas atras a buscar los envios, lanzando todas las peticiones a la vez
        const pendientes = new Set(envios);
        const promesas = Array.from({ length: this.numPaginasRecuperar }, (_, i) =>
            fetch(this.generarUrl(pagina + i * this.salto))
                .then(r => r.text())
                .then(t => JSON.parse(t) as RespuestaApi)
        );

        const recuperados = new Array();
        for (const promesa of promesas) {
            const json = await promesa;
            for (const currentSubmission of json.submission) {
                if (pendientes.has(currentSubmission.num)) {
                    recuperados.push(currentSubmission);
                    pendientes.delete(currentSubmission.num);
                }
            }
            if (pendientes.size === 0) break;
        }

        //devuelve el pool a su cifra normal
        this.currentInPool -= this.numPaginasRecuperar;

        return recuperados.reverse();
    }
}

export default new InicializarService();
