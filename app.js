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

// Referencias de fase 1
const faseUno = document.getElementById("fase-uno");
const pasoCarta = document.getElementById("paso-carta");
const cartaInicial = document.getElementById("carta-inicial");
const pasoNombre = document.getElementById("paso-nombre");
const inputNombre = document.getElementById("nombre-invitado");
const btnEnviarNombre = document.getElementById("btn-enviar-nombre");
const pasoCarga = document.getElementById("paso-carga");
const estadoConsulta = document.getElementById("estado-consulta");

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

let idDocumentoInvitado = "";
let nombreInvitadoActual = "";
let enviandoNombre = false;
let musicaPreparada = false;

let indiceCartaActual = 0;
let cartasPreparadas = false;
let navegacionBloqueada = false;
let ignorarSiguienteClick = false;
let inicioToqueY = 0;
let inicioToqueX = 0;
let acumuladoRueda = 0;
let temporizadorRueda = 0;

const esperar = (milisegundos) => new Promise((resolve) => {
    window.setTimeout(resolve, milisegundos);
});

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
        inputNombre.focus({ preventScroll: true });
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
}

/**
 * Registra en Firestore que la persona abrió la invitación.
 */
async function enviarNombre() {
    const nombre = inputNombre.value.trim();

    if (!nombre || enviandoNombre) {
        return;
    }

    // Se prepara durante la interacción directa, pero permanece silenciada.
    void prepararMusica();

    enviandoNombre = true;
    nombreInvitadoActual = nombre;
    btnEnviarNombre.disabled = true;
    inputNombre.disabled = true;

    estadoConsulta.textContent = "Consultando invitados...";
    estadoConsulta.classList.remove("estado--encontrado", "estado--error");
    mostrarPaso(pasoCarga, pasoNombre);

    try {
        const registroFirebase = addDoc(collection(db, "invitados"), {
            nombre,
            abrio_invitacion: true,
            fecha_apertura: new Date(),
            asistencia_confirmada: false
        });

        const [docRef] = await Promise.all([
            registroFirebase,
            esperar(1500)
        ]);

        idDocumentoInvitado = docRef.id;
        saludoInvitado.textContent = `¡Hola, ${nombre}!`;

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

        const tieneNombre = inputNombre.value.trim().length > 0;
        btnEnviarNombre.disabled = !tieneNombre;
        btnEnviarNombre.classList.toggle("btn--habilitado", tieneNombre);
    }
}

/**
 * Activa la cortina de globos. Cuando todos salen de la pantalla,
 * muestra el mazo con la primera hoja.
 */
async function mostrarFaseDos() {
    faseDos.classList.remove("fase--oculta");
    faseDos.classList.add("fase--activa", "fase-dos--globos");
    faseUno.classList.add("fase--saliendo");

    await esperar(750);

    faseUno.classList.remove("fase--activa", "fase--saliendo");
    faseUno.classList.add("fase--oculta");

    // Duración total: último retraso de globo + su vuelo.
    await esperar(3000);

    faseDos.classList.add("globos--finalizados", "fase-dos--cartas");
    prepararMazoCartas();
}

/**
 * Configura la primera hoja y habilita la navegación.
 */
function prepararMazoCartas() {
    indiceCartaActual = 0;
    actualizarEstadoCartas();

    const primeraCarta = cartas[0];
    primeraCarta.classList.add("carta--entrada-inicial");
    primeraCarta.addEventListener("animationend", () => {
        primeraCarta.classList.remove("carta--entrada-inicial");
    }, { once: true });

    cartasPreparadas = true;
    navegacionBloqueada = false;
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
    indiceCartaActual += 1;
    actualizarEstadoCartas();
    actualizarNavegacionVisual();

    const cartaEntrante = cartas[indiceCartaActual];
    cartaEntrante.classList.add("carta--entrando");

    cartaEntrante.addEventListener("animationend", () => {
        cartaEntrante.classList.remove("carta--entrando");
        navegacionBloqueada = false;
        actualizarNavegacionVisual();
    }, { once: true });
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
    const cartaSaliente = cartas[indiceCartaActual];
    cartaSaliente.classList.add("carta--retirando");
    actualizarNavegacionVisual();

    cartaSaliente.addEventListener("animationend", () => {
        cartaSaliente.classList.remove("carta--retirando", "carta--revelada", "carta--activa");
        cartaSaliente.setAttribute("aria-hidden", "true");

        indiceCartaActual -= 1;
        actualizarEstadoCartas();
        navegacionBloqueada = false;
        actualizarNavegacionVisual();
    }, { once: true });
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

    if (evento.target.closest("button, a, input, textarea, select")) {
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
    const toque = evento.changedTouches[0];
    inicioToqueY = toque.clientY;
    inicioToqueX = toque.clientX;
}, { passive: true });

mazoCartas.addEventListener("touchend", (evento) => {
    if (!cartasPreparadas || navegacionBloqueada) {
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

    if (!idDocumentoInvitado) {
        alert("No pudimos identificar tu registro. Recarga la invitación e intenta nuevamente.");
        return;
    }

    const numeroWhatsApp = "529516560060";
    const mensajeWhatsApp =
        `Hola, confirmo mi asistencia al baby shower de Ketsia. ` +
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
// CONTADOR REGRESIVO — 9 de agosto de 2026, 3:00 p. m.
// ==============================================================
const fechaBabyShower = new Date(2026, 7, 9, 15, 0, 0).getTime();

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
