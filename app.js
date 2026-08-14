// Firebase 10.x
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAoKbJH_sbP3r0HPO3u_0tScEmMZDxx9H8",
    authDomain: "invitacion-baby-shower-d5dc5.firebaseapp.com",
    projectId: "invitacion-baby-shower-d5dc5",
    storageBucket: "invitacion-baby-shower-d5dc5.firebasestorage.app",
    messagingSenderId: "378897295677",
    appId: "1:378897295677:web:ac3bd788dab94ff6c1bd54",
    measurementId: "G-EX84WEVFJQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==========================================================================
   MAPA Y UBICACIÓN DEL EVENTO

   Mapa sencillo sin API key. Para cambiar el lugar más adelante, modifica
   únicamente los datos de UBICACION_EVENTO.
========================================================================== */
const UBICACION_EVENTO = {
    nombre: "Salón Casari",
    direccion: "Esquina Privada Emiliano Zapata. Col. Roma, Santa Lucía del Camino, Oaxaca de Juárez, Oaxaca",

    // Puedes pegar aquí una URL específica del lugar si deseas forzarla.
    urlLugar: ""
};

// Referencias de fase 1
const faseUno = document.getElementById("fase-uno");
const pasoCarta = document.getElementById("paso-carta");
const cartaInicial = document.getElementById("carta-inicial");
const pasoNombre = document.getElementById("paso-nombre");
const inputNombre = document.getElementById("nombre-invitado");
const btnEnviarNombre = document.getElementById("btn-enviar-nombre");
const pasoCarga = document.getElementById("paso-carga");
const estadoConsulta = document.getElementById("estado-consulta");
const botonesFotosBebe = Array.from(document.querySelectorAll(".foto-ampliable"));
const visorFoto = document.getElementById("visor-foto");
const visorFotoImagen = document.getElementById("visor-foto-imagen");

// Referencias de fase 2
const faseDos = document.getElementById("fase-dos");
const mazoCartas = document.getElementById("mazo-cartas");
const cartas = Array.from(document.querySelectorAll(".carta-info"));
const indicadores = Array.from(document.querySelectorAll(".indicador"));
const indicacionNavegacion = document.getElementById("indicacion-navegacion");
const btnCartaAnterior = document.getElementById("btn-carta-anterior");
const btnCartaSiguiente = document.getElementById("btn-carta-siguiente");
const saludoInvitado = document.getElementById("saludo-invitado");
const btnConfirmar = document.getElementById("btn-confirmar");
const musica = document.getElementById("musica-fondo");
const decoracionFondo = document.getElementById("decoracion-fondo");
const decoracionesPNG = Array.from(document.querySelectorAll(".decoracion-png"));
const textosUnaLineaPresentacion = Array.from(document.querySelectorAll(
    ".carta-contenido--presentacion #saludo-invitado, " +
    ".carta-contenido--presentacion .titulo-baby-shower, " +
    ".carta-contenido--presentacion .nombre-bebe, " +
    ".carta-contenido--presentacion .texto-secundario"
));
const textosEscritura = Array.from(document.querySelectorAll(".texto-escritura"));
const cartaRegalos = document.querySelector(".carta-info--4");
const carta1Saludo = document.getElementById("carta1-saludo");
const carta1Invitacion = document.getElementById("carta1-invitacion");
const carta2Tiempo = document.getElementById("carta2-tiempo");
const carta2Final = document.getElementById("carta2-final");
const carta5Titulo = document.getElementById("carta5-titulo");
const carta5Tips = [1, 2, 3].map((numero) => document.getElementById(`carta5-tip${numero}`));
const carta5Final = document.getElementById("carta5-final");
const decoracionCarta5 = document.getElementById("decoracion-carta5");

// Referencias de la hoja de ubicación
const mapaEvento = document.getElementById("mapa-evento");
const mapaEventoWrap = document.getElementById("mapa-evento-wrap");
const nombreLugar = document.getElementById("nombre-lugar");
const direccionLugar = document.getElementById("direccion-lugar");
const btnAbrirMaps = document.getElementById("btn-abrir-maps");

let idDocumentoInvitado = "";
let nombreInvitadoActual = "";
let enviandoNombre = false;
let musicaPreparada = false;
let musicaPausadaPorVisibilidad = false;
let temporizadorVisorFoto = 0;
let temporizadorSalidaVisorFoto = 0;
let botonFotoActivo = null;
let escrituraPresentacionIniciada = false;
let temporizadorRegalo = 0;

// Modo de previsualización para revisar la invitación sin escribir en Firebase.
const CLAVE_PREVISUALIZACION = "admin";
const nombresPrevisualizacion = [
    "Sofía",
    "Valentina",
    "Camila",
    "Renata",
    "Daniela",
    "Mariana",
    "Andrea",
    "Fernanda",
    "Alejandra",
    "Regina"
];
let modoPrevisualizacion = false;

function obtenerNombrePrevisualizacion() {
    const indice = Math.floor(Math.random() * nombresPrevisualizacion.length);
    return nombresPrevisualizacion[indice];
}

let indiceCartaActual = 0;
let cartasPreparadas = false;
let navegacionBloqueada = false;
let ignorarSiguienteClick = false;
let inicioToqueY = 0;
let inicioToqueX = 0;
let acumuladoRueda = 0;
let temporizadorRueda = 0;
let gestoIniciadoEnZonaInteractiva = false;


const esperar = (milisegundos) => new Promise((resolve) => {
    window.setTimeout(resolve, milisegundos);
});

function prepararTextosEscritura() {
    textosEscritura.forEach((elemento) => {
        const visible = elemento.querySelector(".texto-escritura-visible");
        if (visible) {
            visible.textContent = "";
        }
    });
}

async function escribirTexto(elemento, pausaLetra) {
    const visible = elemento.querySelector(".texto-escritura-visible");
    const texto = elemento.dataset.textoCompleto || "";

    if (!visible) return;

    for (const caracter of Array.from(texto)) {
        visible.textContent += caracter;
        await esperar(caracter === " " ? Math.max(18, pausaLetra * 0.45) : pausaLetra);
    }
}

async function iniciarEscrituraPresentacion() {
    if (escrituraPresentacionIniciada || textosEscritura.length < 2) return;

    escrituraPresentacionIniciada = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        textosEscritura.forEach((elemento) => {
            const visible = elemento.querySelector(".texto-escritura-visible");
            if (visible) visible.textContent = elemento.dataset.textoCompleto || "";
        });
        return;
    }

    await escribirTexto(textosEscritura[0], 92);
    await esperar(220);
    await escribirTexto(textosEscritura[1], 36);
}

function animarCartaRegalos() {
    if (!cartaRegalos) return 0;

    window.clearTimeout(temporizadorRegalo);
    cartaRegalos.classList.remove("carta-regalo--animando", "carta-regalo--preparada");
    void cartaRegalos.offsetWidth;
    cartaRegalos.classList.add("carta-regalo--animando");

    const duracion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 80
        : 4300;

    temporizadorRegalo = window.setTimeout(() => {
        cartaRegalos.classList.remove("carta-regalo--animando");
    }, duracion);

    return duracion;
}

function duracionSecuencia(milisegundos) {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? Math.min(50, milisegundos)
        : milisegundos;
}

async function mostrarEscenaCarta(escena, duracion = 700) {
    if (!escena) return;

    escena.classList.remove("escena-carta--visible", "escena-carta--saliendo");
    void escena.offsetWidth;
    escena.classList.add("escena-carta--visible");
    await esperar(duracionSecuencia(duracion));
}

async function ocultarEscenaCarta(escena, duracion = 600) {
    if (!escena) return;

    escena.classList.remove("escena-carta--visible");
    escena.classList.add("escena-carta--saliendo");
    await esperar(duracionSecuencia(duracion));
    escena.classList.remove("escena-carta--saliendo");
}

function prepararSecuenciaCarta(indice) {
    const carta = cartas[indice];

    carta?.querySelectorAll(".escena-carta").forEach((escena) => {
        escena.classList.remove(
            "escena-carta--visible",
            "escena-carta--saliendo",
            "escena-fecha--completa",
            "escena-presentacion--completa"
        );
    });

    if (indice === 4) {
        decoracionCarta5?.classList.remove("decoracion-carta5--visible");
    }

    if (indice === 3 && cartaRegalos) {
        window.clearTimeout(temporizadorRegalo);
        cartaRegalos.classList.remove("carta-regalo--animando");
        cartaRegalos.classList.add("carta-regalo--preparada");
    }
}

async function ejecutarSecuenciaCartaUno() {
    await mostrarEscenaCarta(carta1Saludo);
    await esperar(duracionSecuencia(1350));
    await ocultarEscenaCarta(carta1Saludo, 560);

    await mostrarEscenaCarta(carta1Invitacion);
    await esperar(duracionSecuencia(420));
    carta1Invitacion?.classList.add("escena-presentacion--completa");
    await esperar(duracionSecuencia(900));
    programarAjusteTextosPresentacion();
    await esperar(duracionSecuencia(180));
    await iniciarEscrituraPresentacion();
}

async function ejecutarSecuenciaCartaDos() {
    await mostrarEscenaCarta(carta2Tiempo);
    await esperar(duracionSecuencia(1450));
    await ocultarEscenaCarta(carta2Tiempo, 560);

    await mostrarEscenaCarta(carta2Final);
    await esperar(duracionSecuencia(520));
    carta2Final?.classList.add("escena-fecha--completa");
    await esperar(duracionSecuencia(1050));
}

async function ejecutarSecuenciaCartaCinco() {
    await mostrarEscenaCarta(carta5Titulo);
    await esperar(duracionSecuencia(1250));
    await ocultarEscenaCarta(carta5Titulo, 520);

    for (const tip of carta5Tips) {
        await mostrarEscenaCarta(tip, 620);
        await esperar(duracionSecuencia(1300));
        await ocultarEscenaCarta(tip, 500);
    }

    await mostrarEscenaCarta(carta5Final, 800);
    await esperar(duracionSecuencia(320));
    decoracionCarta5?.classList.add("decoracion-carta5--visible");
    await esperar(duracionSecuencia(1050));
}

async function ejecutarSecuenciaCarta(indice) {
    navegacionBloqueada = true;
    actualizarNavegacionVisual();

    try {
        if (indice === 0) {
            await ejecutarSecuenciaCartaUno();
        } else if (indice === 1) {
            await ejecutarSecuenciaCartaDos();
        } else if (indice === 3) {
            await esperar(animarCartaRegalos());
        } else if (indice === 4) {
            await ejecutarSecuenciaCartaCinco();
        }
    } finally {
        navegacionBloqueada = false;
        actualizarNavegacionVisual();
    }
}

prepararTextosEscritura();

/**
 * Conserva cada texto de la primera hoja en una sola línea. En pantallas
 * angostas (o con nombres largos) reduce sólo lo indispensable para evitar
 * que el contenido rebase los márgenes de la carta.
 */
function ajustarTextosPresentacion() {
    const minimos = [16, 10, 34, 8];

    textosUnaLineaPresentacion.forEach((elemento, indice) => {
        elemento.style.removeProperty("font-size");

        const anchoDisponible = elemento.parentElement?.clientWidth || 0;
        let tamano = Number.parseFloat(window.getComputedStyle(elemento).fontSize);
        const minimo = minimos[indice] || 8;

        if (!anchoDisponible || !Number.isFinite(tamano)) {
            return;
        }

        while (elemento.scrollWidth > anchoDisponible && tamano > minimo) {
            tamano = Math.max(minimo, tamano - 0.5);
            elemento.style.fontSize = `${tamano}px`;
        }
    });
}

let ajusteTextosPendiente = 0;
function programarAjusteTextosPresentacion() {
    window.cancelAnimationFrame(ajusteTextosPendiente);
    ajusteTextosPendiente = window.requestAnimationFrame(ajustarTextosPresentacion);
}

window.addEventListener("resize", programarAjusteTextosPresentacion, { passive: true });
window.addEventListener("orientationchange", programarAjusteTextosPresentacion, { passive: true });
programarAjusteTextosPresentacion();

if (document.fonts?.ready) {
    document.fonts.ready.then(programarAjusteTextosPresentacion).catch(() => {});
}

function cerrarVisorFoto() {
    if (!visorFoto?.classList.contains("visor-foto--visible") ||
        visorFoto.classList.contains("visor-foto--saliendo")) {
        return;
    }

    window.clearTimeout(temporizadorVisorFoto);
    visorFoto.classList.add("visor-foto--saliendo");

    temporizadorSalidaVisorFoto = window.setTimeout(() => {
        visorFoto.classList.remove("visor-foto--visible", "visor-foto--saliendo");
        visorFoto.setAttribute("aria-hidden", "true");

        if (botonFotoActivo?.isConnected) {
            botonFotoActivo?.focus({ preventScroll: true });
        }

        botonFotoActivo = null;
    }, 480);
}

function abrirVisorFoto(boton) {
    if (!visorFoto || !visorFotoImagen ||
        visorFoto.classList.contains("visor-foto--visible")) {
        return;
    }

    const imagen = boton.querySelector("img");

    if (!imagen) {
        return;
    }

    window.clearTimeout(temporizadorVisorFoto);
    window.clearTimeout(temporizadorSalidaVisorFoto);
    botonFotoActivo = boton;
    visorFotoImagen.src = imagen.currentSrc || imagen.src;
    visorFotoImagen.alt = imagen.alt;
    visorFoto.classList.remove("visor-foto--saliendo");
    visorFoto.classList.add("visor-foto--visible");
    visorFoto.setAttribute("aria-hidden", "false");
    visorFoto.focus({ preventScroll: true });

    // La foto permanece ampliada 5.2 segundos y vuelve suavemente al formulario.
    temporizadorVisorFoto = window.setTimeout(cerrarVisorFoto, 5200);
}

botonesFotosBebe.forEach((boton) => {
    boton.addEventListener("click", (evento) => {
        evento.stopPropagation();
        abrirVisorFoto(boton);
    });
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && visorFoto?.classList.contains("visor-foto--visible")) {
        cerrarVisorFoto();
    }
});

function configurarDecoracionFondo() {
    if (!decoracionFondo || decoracionesPNG.length < 6) return;

    let fotogramaPendiente = 0;
    const ajustarTamano = () => {
        window.cancelAnimationFrame(fotogramaPendiente);
        fotogramaPendiente = window.requestAnimationFrame(() => {
            const ancho = window.visualViewport?.width || window.innerWidth;
            const alto = window.visualViewport?.height || window.innerHeight;
            const movil = ancho <= 560;
            const tableta = ancho > 560 && ancho <= 900;
            const minimo = movil ? 62 : (tableta ? 76 : 88);
            const maximo = movil ? 92 : (tableta ? 112 : 132);
            const proporcionAncho = movil ? 0.19 : (tableta ? 0.12 : 0.09);
            const tamanoBase = Math.round(Math.min(maximo, Math.max(
                minimo,
                Math.min(ancho * proporcionAncho, alto * (movil ? 0.12 : 0.14))
            )));

            decoracionFondo.style.setProperty("--tam-base-decoracion", `${tamanoBase}px`);
            decoracionesPNG.forEach((adorno) => {
                const escala = Number.parseFloat(adorno.dataset.escala || "1");
                adorno.style.setProperty("--tam-png", `${Math.round(tamanoBase * escala)}px`);
            });
        });
    };

    ajustarTamano();
    window.addEventListener("resize", ajustarTamano, { passive: true });
    window.addEventListener("orientationchange", ajustarTamano, { passive: true });
    window.visualViewport?.addEventListener("resize", ajustarTamano, { passive: true });
}

/**
 * Configura el mapa sencillo del evento y el botón externo.
 * No utiliza API key ni solicita la ubicación del invitado.
 */
function configurarUbicacionEvento() {
    if (!mapaEvento || !btnAbrirMaps) {
        return;
    }

    nombreLugar.textContent = UBICACION_EVENTO.nombre;
    direccionLugar.textContent = UBICACION_EVENTO.direccion;

    const consulta = `${UBICACION_EVENTO.nombre}, ${UBICACION_EVENTO.direccion}`;

    mapaEvento.innerHTML = "";

    const iframe = document.createElement("iframe");
    iframe.title = `Mapa de ${UBICACION_EVENTO.nombre}`;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.allowFullscreen = true;
    iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(consulta)}&z=17&output=embed`;

    mapaEvento.appendChild(iframe);

    btnAbrirMaps.addEventListener("click", (evento) => {
        evento.stopPropagation();
        abrirEnMaps();
    });
}

/**
 * Abre el lugar en la opción de mapas más natural disponible.
 * En iPhone/iPad usa Apple Maps, en Android intenta el selector del sistema
 * mediante geo:, y en escritorio usa el navegador como respaldo.
 */
function abrirEnMaps() {
    const consulta = `${UBICACION_EVENTO.nombre}, ${UBICACION_EVENTO.direccion}`;
    const consultaCodificada = encodeURIComponent(consulta);
    const urlWeb = UBICACION_EVENTO.urlLugar.trim() ||
        `https://www.google.com/maps/search/?api=1&query=${consultaCodificada}`;

    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const esAndroid = /Android/i.test(navigator.userAgent);

    if (esIOS) {
        window.open(`https://maps.apple.com/?q=${consultaCodificada}`, "_blank", "noopener,noreferrer");
        return;
    }

    if (esAndroid) {
        let aplicacionAbierta = false;

        const detectarSalida = () => {
            aplicacionAbierta = true;
        };

        window.addEventListener("blur", detectarSalida, { once: true });
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                aplicacionAbierta = true;
            }
        }, { once: true });

        window.location.href = `geo:0,0?q=${consultaCodificada}`;

        window.setTimeout(() => {
            if (!aplicacionAbierta && document.visibilityState === "visible") {
                window.open(urlWeb, "_blank", "noopener,noreferrer");
            }
        }, 1400);
        return;
    }

    window.open(urlWeb, "_blank", "noopener,noreferrer");
}

configurarUbicacionEvento();
configurarDecoracionFondo();

/**
 * Los gestos iniciados dentro del mapa o sus botones pertenecen al mapa,
 * no al sistema de navegación entre hojas.
 */
function esZonaInteractiva(elemento) {
    return Boolean(elemento?.closest?.(
        '[data-interactivo="true"], iframe, button, a, input, textarea, select'
    ));
}

/**
 * Cambia entre los pasos internos de la fase 1.
 */
function mostrarPaso(nuevoPaso, pasoAnterior = null) {
    if (pasoAnterior) {
        pasoAnterior.classList.add("paso--cerrando");

        window.setTimeout(() => {
            pasoAnterior.classList.remove("paso--visible", "paso--cerrando");
        }, 500);
    }

    nuevoPaso.classList.add("paso--visible");
}

/**
 * La página comienza vacía y muestra la carta después de 2 segundos.
 */
window.setTimeout(() => {
    mostrarPaso(pasoCarta);
}, 2000);

/**
 * Al tocar la carta se muestra el formulario. La música aún no inicia.
 */
function abrirCarta() {
    mostrarPaso(pasoNombre, pasoCarta);

    window.setTimeout(() => {
        if (!visorFoto?.classList.contains("visor-foto--visible")) {
            inputNombre.focus({ preventScroll: true });
        }
    }, 850);
}

cartaInicial.addEventListener("click", abrirCarta);

/**
 * El botón Enviar aparece únicamente cuando hay un nombre escrito.
 */
inputNombre.addEventListener("input", () => {
    const tieneNombre = inputNombre.value.trim().length > 0;

    btnEnviarNombre.disabled = !tieneNombre || enviandoNombre;
    btnEnviarNombre.classList.toggle("btn--habilitado", tieneNombre);
});

inputNombre.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" && !btnEnviarNombre.disabled) {
        enviarNombre();
    }
});

btnEnviarNombre.addEventListener("click", enviarNombre);

/**
 * Inicia el audio silenciado durante el clic del usuario. Esto permite
 * desbloquearlo en celulares sin que la canción se escuche todavía.
 */
async function prepararMusica() {
    if (!musica || musicaPreparada) {
        return;
    }

    try {
        musica.muted = true;
        musica.volume = 0.75;
        await musica.play();
        musicaPreparada = true;
    } catch (error) {
        musica.muted = false;
        console.info("El navegador no permitió preparar el audio:", error);
    }
}

/**
 * La canción comienza cuando la pantalla indica «Invitado encontrado».
 */
async function reproducirMusica() {
    if (!musica) {
        return;
    }

    try {
        musica.currentTime = 0;
        musica.muted = false;

        if (document.visibilityState === "hidden") {
            musicaPausadaPorVisibilidad = true;
            musica.pause();
            return;
        }

        if (musica.paused) {
            await musica.play();
        }
    } catch (error) {
        console.info("El navegador no permitió reproducir la música:", error);
    }
}

function cancelarMusicaPreparada() {
    if (!musica || !musicaPreparada) {
        return;
    }

    musica.pause();
    musica.currentTime = 0;
    musica.muted = false;
    musicaPreparada = false;
    musicaPausadaPorVisibilidad = false;
}

function pausarMusicaPorVisibilidad() {
    if (!musica || musica.paused) {
        return;
    }

    musicaPausadaPorVisibilidad = true;
    musica.pause();
}

async function reanudarMusicaPorVisibilidad() {
    if (!musica || !musicaPausadaPorVisibilidad || document.visibilityState === "hidden") {
        return;
    }

    try {
        await musica.play();
        musicaPausadaPorVisibilidad = false;
    } catch (error) {
        console.info("El navegador no permitió reanudar la música:", error);
    }
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        pausarMusicaPorVisibilidad();
        return;
    }

    reanudarMusicaPorVisibilidad();
});

window.addEventListener("pagehide", pausarMusicaPorVisibilidad);
window.addEventListener("pageshow", reanudarMusicaPorVisibilidad);

/**
 * Registra en Firestore que la persona abrió la invitación.
 */
async function enviarNombre() {
    const nombreIngresado = inputNombre.value.trim();

    if (!nombreIngresado || enviandoNombre) {
        return;
    }

    // La palabra "admin" activa una previsualización local sin guardar datos.
    modoPrevisualizacion = nombreIngresado.toLocaleLowerCase("es-MX") === CLAVE_PREVISUALIZACION;
    const nombreVisible = modoPrevisualizacion
        ? obtenerNombrePrevisualizacion()
        : nombreIngresado;

    // Se prepara durante la interacción directa, pero permanece silenciada.
    void prepararMusica();

    enviandoNombre = true;
    nombreInvitadoActual = nombreVisible;
    btnEnviarNombre.disabled = true;
    inputNombre.disabled = true;

    estadoConsulta.textContent = "Consultando invitados...";
    estadoConsulta.classList.remove("estado--encontrado", "estado--error");
    mostrarPaso(pasoCarga, pasoNombre);

    try {
        if (modoPrevisualizacion) {
            // Conserva la misma duración visual sin realizar lecturas ni escrituras.
            await esperar(1500);
            idDocumentoInvitado = "";
        } else {
            const docRef = await Promise.all([
                addDoc(collection(db, "invitados"), {
                    nombre: nombreIngresado,
                    abrio_invitacion: true,
                    fecha_apertura: new Date(),
                    asistencia_confirmada: false
                }),
                esperar(1500)
            ]).then(([referencia]) => referencia);

            idDocumentoInvitado = docRef.id;
        }

        saludoInvitado.textContent = `¡Hola, ${nombreVisible}!`;
        programarAjusteTextosPresentacion();

        estadoConsulta.textContent = "Invitado encontrado";
        estadoConsulta.classList.add("estado--encontrado");

        await reproducirMusica();
        await esperar(950);
        await mostrarFaseDos();

    } catch (error) {
        console.error("Error al registrar la apertura:", error);
        cancelarMusicaPreparada();

        estadoConsulta.textContent = "No pudimos conectar. Intenta nuevamente.";
        estadoConsulta.classList.add("estado--error");

        await esperar(1700);

        pasoCarga.classList.remove("paso--visible");
        pasoNombre.classList.add("paso--visible");
        inputNombre.disabled = false;
        enviandoNombre = false;
        modoPrevisualizacion = false;

        const tieneNombre = inputNombre.value.trim().length > 0;
        btnEnviarNombre.disabled = !tieneNombre;
        btnEnviarNombre.classList.toggle("btn--habilitado", tieneNombre);
    }
}

/**
 * Lanza 30 globos desde abajo. Al salir por arriba, presenta el
 * versículo sobre el fondo limpio y después muestra el mazo de cartas.
 */
async function mostrarFaseDos() {
    faseDos.classList.remove(
        "fase--oculta",
        "globos--finalizados",
        "fase-dos--versiculo",
        "fase-dos--cartas",
        "decoracion--visible"
    );
    faseDos.classList.add("fase--activa", "fase-dos--globos");
    faseUno.classList.add("fase--saliendo");

    await esperar(750);

    faseUno.classList.remove("fase--activa", "fase--saliendo");
    faseUno.classList.add("fase--oculta");

    // Esperamos a que los 30 globos terminen de subir y salgan por arriba.
    await esperar(6200);

    faseDos.classList.add("globos--finalizados");

    // Primero dejamos que los globos desaparezcan por completo.
    await esperar(360);
    // Pausa mínima con el fondo limpio antes de revelar el versículo.
    await esperar(100);

    // Una sola animación continua evita saltos entre la entrada y la salida:
    // aparece con delicadeza, mantiene un movimiento casi imperceptible y se desvanece.
    faseDos.classList.add("fase-dos--versiculo");
    await esperar(8000);
    faseDos.classList.remove("fase-dos--versiculo");

    // Los doce adornos terminan su caída rápida y escalonada antes de que
    // aparezca la primera carta; después continúan balanceándose en conjunto.
    faseDos.classList.add("decoracion--visible");
    await esperar(1400);

    // Después del versículo y la decoración comienza el flujo de las hojas.
    faseDos.classList.add("fase-dos--cartas");
    prepararMazoCartas();
}

/**
 * Configura la primera hoja y habilita la navegación.
 */
function prepararMazoCartas() {
    indiceCartaActual = 0;
    prepararSecuenciaCarta(0);
    actualizarEstadoCartas();
    programarAjusteTextosPresentacion();

    const primeraCarta = cartas[0];
    primeraCarta.classList.add("carta--entrada-inicial");

    const alTerminarPrimeraCarta = (evento) => {
        if (evento.target !== primeraCarta || evento.animationName !== "entrada-primera-hoja") {
            return;
        }

        primeraCarta.removeEventListener("animationend", alTerminarPrimeraCarta);
        primeraCarta.classList.remove("carta--entrada-inicial");
        ejecutarSecuenciaCarta(0);
    };

    primeraCarta.addEventListener("animationend", alTerminarPrimeraCarta);

    cartasPreparadas = true;
    navegacionBloqueada = true;
    actualizarNavegacionVisual();

    window.setTimeout(() => {
        mazoCartas.focus({ preventScroll: true });
    }, 750);

}

/**
 * Calcula la posición de cada hoja revelada para que se vean apiladas.
 */
function actualizarEstadoCartas() {
    const rotaciones = [-2.1, 1.5, -1.2, 1.9, -0.7];

    cartas.forEach((carta, indice) => {
        carta.classList.remove("carta--activa", "carta--atras");
        carta.style.zIndex = String(10 + indice);

        if (indice > indiceCartaActual) {
            carta.classList.remove("carta--revelada");
            carta.setAttribute("aria-hidden", "true");
            return;
        }

        const distancia = indiceCartaActual - indice;
        const desplazamientoX = distancia === 0
            ? 0
            : (distancia % 2 === 0 ? -1 : 1) * (4 + distancia * 3);
        const desplazamientoY = distancia * 8;
        const escala = Math.max(0.93, 1 - distancia * 0.012);
        const rotacion = distancia === 0 ? 0 : rotaciones[indice] * Math.min(distancia, 2);

        carta.style.setProperty("--offset-x", `${desplazamientoX}px`);
        carta.style.setProperty("--offset-y", `${desplazamientoY}px`);
        carta.style.setProperty("--escala", String(escala));
        carta.style.setProperty("--rotacion", `${rotacion}deg`);
        carta.classList.add("carta--revelada");
        carta.classList.toggle("carta--activa", indice === indiceCartaActual);
        carta.classList.toggle("carta--atras", indice < indiceCartaActual);
        carta.setAttribute("aria-hidden", indice === indiceCartaActual ? "false" : "true");
    });
}

/**
 * Actualiza flechas, puntos e instrucciones de uso.
 */
function actualizarNavegacionVisual() {
    btnCartaAnterior.disabled = indiceCartaActual === 0 || navegacionBloqueada;
    btnCartaSiguiente.disabled = indiceCartaActual === cartas.length - 1 || navegacionBloqueada;

    indicadores.forEach((indicador, indice) => {
        indicador.classList.toggle("indicador--activo", indice === indiceCartaActual);
    });

    if (navegacionBloqueada) {
        indicacionNavegacion.textContent = "Un momento, estamos preparando esta hoja...";
        return;
    }

    if (indiceCartaActual === cartas.length - 1) {
        indicacionNavegacion.textContent = window.matchMedia("(pointer: coarse)").matches
            ? "Desliza arriba para revisar las hojas anteriores"
            : "Usa la rueda hacia arriba para revisar las hojas anteriores";
    } else if (window.matchMedia("(pointer: coarse)").matches) {
        indicacionNavegacion.textContent =
            "Toca o desliza abajo para avanzar · arriba para volver";
    } else {
        indicacionNavegacion.textContent =
            "Haz clic o usa la rueda del mouse";
    }
}

/**
 * Añade la siguiente hoja con animación de caída.
 */
function irSiguiente() {
    if (
        !cartasPreparadas ||
        navegacionBloqueada ||
        indiceCartaActual >= cartas.length - 1
    ) {
        return;
    }

    navegacionBloqueada = true;
    const indiceDestino = indiceCartaActual + 1;
    prepararSecuenciaCarta(indiceDestino);
    indiceCartaActual = indiceDestino;
    actualizarEstadoCartas();
    actualizarNavegacionVisual();

    const cartaEntrante = cartas[indiceCartaActual];
    cartaEntrante.classList.add("carta--entrando");

    const alTerminarEntrada = (evento) => {
        if (evento.target !== cartaEntrante || evento.animationName !== "caer-hoja") {
            return;
        }

        cartaEntrante.removeEventListener("animationend", alTerminarEntrada);
        cartaEntrante.classList.remove("carta--entrando");
        ejecutarSecuenciaCarta(indiceDestino);
    };

    cartaEntrante.addEventListener("animationend", alTerminarEntrada);
}

/**
 * Retira la hoja superior para mostrar la anterior.
 */
function irAnterior() {
    if (
        !cartasPreparadas ||
        navegacionBloqueada ||
        indiceCartaActual <= 0
    ) {
        return;
    }

    navegacionBloqueada = true;
    const indiceDestino = indiceCartaActual - 1;
    prepararSecuenciaCarta(indiceDestino);
    const cartaSaliente = cartas[indiceCartaActual];
    cartaSaliente.classList.add("carta--retirando");
    actualizarNavegacionVisual();

    const alTerminarRetiro = (evento) => {
        if (evento.target !== cartaSaliente || evento.animationName !== "retirar-hoja") {
            return;
        }

        cartaSaliente.removeEventListener("animationend", alTerminarRetiro);
        cartaSaliente.classList.remove("carta--retirando", "carta--revelada", "carta--activa");
        cartaSaliente.setAttribute("aria-hidden", "true");

        indiceCartaActual = indiceDestino;
        actualizarEstadoCartas();
        ejecutarSecuenciaCarta(indiceDestino);
    };

    cartaSaliente.addEventListener("animationend", alTerminarRetiro);
}

btnCartaAnterior.addEventListener("click", (evento) => {
    evento.stopPropagation();
    irAnterior();
});

btnCartaSiguiente.addEventListener("click", (evento) => {
    evento.stopPropagation();
    irSiguiente();
});

// Tocar o hacer clic sobre una hoja avanza a la siguiente.
mazoCartas.addEventListener("click", (evento) => {
    if (ignorarSiguienteClick) {
        ignorarSiguienteClick = false;
        return;
    }

    if (esZonaInteractiva(evento.target)) {
        return;
    }

    irSiguiente();
});

/**
 * Computadora: rueda hacia abajo = siguiente; rueda hacia arriba = anterior.
 */
faseDos.addEventListener("wheel", (evento) => {
    if (!cartasPreparadas || navegacionBloqueada) {
        return;
    }

    // Sobre el mapa, la rueda queda libre para el zoom de Google Maps.
    if (esZonaInteractiva(evento.target)) {
        return;
    }

    evento.preventDefault();
    acumuladoRueda += evento.deltaY;

    window.clearTimeout(temporizadorRueda);
    temporizadorRueda = window.setTimeout(() => {
        acumuladoRueda = 0;
    }, 180);

    if (Math.abs(acumuladoRueda) < 48) {
        return;
    }

    if (acumuladoRueda > 0) {
        irSiguiente();
    } else {
        irAnterior();
    }

    acumuladoRueda = 0;
}, { passive: false });

/**
 * Celular, según lo solicitado:
 * - deslizar hacia arriba: hoja anterior
 * - deslizar hacia abajo: hoja siguiente
 */
mazoCartas.addEventListener("touchstart", (evento) => {
    gestoIniciadoEnZonaInteractiva = esZonaInteractiva(evento.target);

    if (gestoIniciadoEnZonaInteractiva) {
        return;
    }

    const toque = evento.changedTouches[0];
    inicioToqueY = toque.clientY;
    inicioToqueX = toque.clientX;
}, { passive: true });

mazoCartas.addEventListener("touchend", (evento) => {
    if (!cartasPreparadas || navegacionBloqueada) {
        return;
    }

    if (gestoIniciadoEnZonaInteractiva) {
        gestoIniciadoEnZonaInteractiva = false;
        return;
    }

    const toque = evento.changedTouches[0];
    const diferenciaY = toque.clientY - inicioToqueY;
    const diferenciaX = toque.clientX - inicioToqueX;
    const esGestoVertical = Math.abs(diferenciaY) > 55 &&
        Math.abs(diferenciaY) > Math.abs(diferenciaX) * 1.15;

    if (!esGestoVertical) {
        return;
    }

    evento.preventDefault();
    ignorarSiguienteClick = true;

    window.setTimeout(() => {
        ignorarSiguienteClick = false;
    }, 450);

    if (diferenciaY < 0) {
        irAnterior();
    } else {
        irSiguiente();
    }
}, { passive: false });

// Respaldo accesible con teclado.
mazoCartas.addEventListener("keydown", (evento) => {
    if (["ArrowDown", "PageDown", "ArrowRight", "Enter", " "].includes(evento.key)) {
        evento.preventDefault();
        irSiguiente();
    }

    if (["ArrowUp", "PageUp", "ArrowLeft"].includes(evento.key)) {
        evento.preventDefault();
        irAnterior();
    }
});

/**
 * Confirmación en Firestore y apertura del mensaje de WhatsApp.
 */
btnConfirmar.addEventListener("click", async (evento) => {
    evento.stopPropagation();

    // En modo admin la confirmación también es simulada: no toca Firebase ni WhatsApp.
    if (modoPrevisualizacion) {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "¡Vista previa confirmada!";
        return;
    }

    if (!idDocumentoInvitado) {
        alert("No pudimos identificar tu registro. Recarga la invitación e intenta nuevamente.");
        return;
    }

    const numeroWhatsApp = "529513570663";
    const mensajeWhatsApp =
        `Hola, confirmo mi asistencia al baby shower de Ketzia Hazel. ` +
        `Mi nombre es ${nombreInvitadoActual}. ` +
        `¡Muchas gracias por la invitación!`;

    const enlaceWhatsApp =
        `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWhatsApp)}`;

    const ventanaWhatsApp = window.open("", "_blank");

    try {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "Confirmando...";

        const invitadoRef = doc(db, "invitados", idDocumentoInvitado);

        await updateDoc(invitadoRef, {
            asistencia_confirmada: true,
            fecha_confirmacion: new Date()
        });

        btnConfirmar.textContent = "¡Asistencia confirmada!";

        if (ventanaWhatsApp) {
            ventanaWhatsApp.location.href = enlaceWhatsApp;
        } else {
            window.location.href = enlaceWhatsApp;
        }

    } catch (error) {
        console.error("Error al confirmar asistencia:", error);

        if (ventanaWhatsApp) {
            ventanaWhatsApp.close();
        }

        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "Confirmar asistencia";
        alert("Hubo un problema al confirmar. Intenta nuevamente.");
    }
});

// ==============================================================
// CONTADOR REGRESIVO — domingo 6 de septiembre de 2026, 4:00 p. m.
// ==============================================================
const fechaBabyShower = new Date(2026, 8, 6, 16, 0, 0).getTime();

function actualizarContador() {
    const ahora = Date.now();
    const distancia = fechaBabyShower - ahora;

    if (distancia <= 0) {
        document.getElementById("contenedor-contador").innerHTML =
            "<h2>¡Hoy es el gran día!</h2>";
        return false;
    }

    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor(
        (distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutos = Math.floor(
        (distancia % (1000 * 60 * 60)) / (1000 * 60)
    );
    const segundos = Math.floor(
        (distancia % (1000 * 60)) / 1000
    );

    document.getElementById("dias").textContent = String(dias).padStart(2, "0");
    document.getElementById("horas").textContent = String(horas).padStart(2, "0");
    document.getElementById("minutos").textContent = String(minutos).padStart(2, "0");
    document.getElementById("segundos").textContent = String(segundos).padStart(2, "0");

    return true;
}

actualizarContador();

const intervaloReloj = window.setInterval(() => {
    const continuar = actualizarContador();

    if (!continuar) {
        window.clearInterval(intervaloReloj);
    }
}, 1000);
