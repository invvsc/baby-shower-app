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

// ==============================================================
// REFERENCIAS DE LA FASE 1
// ==============================================================

const faseUno = document.getElementById("fase-uno");
const pasoCarta = document.getElementById("paso-carta");
const cartaInicial = document.getElementById("carta-inicial");

const pasoNombre = document.getElementById("paso-nombre");
const inputNombre = document.getElementById("nombre-invitado");
const btnEnviarNombre = document.getElementById("btn-enviar-nombre");

const pasoCarga = document.getElementById("paso-carga");
const estadoConsulta = document.getElementById("estado-consulta");

// ==============================================================
// REFERENCIAS DE LA FASE 2
// ==============================================================

const faseDos = document.getElementById("fase-dos");
const saludoInvitado = document.getElementById("saludo-invitado");
const btnConfirmar = document.getElementById("btn-confirmar");
const musica = document.getElementById("musica-fondo");

// ==============================================================
// ESTADO GENERAL
// ==============================================================

let idDocumentoInvitado = "";
let nombreInvitadoActual = "";
let enviandoNombre = false;

/**
 * Crea una pausa utilizable con await.
 */
const esperar = (milisegundos) =>
    new Promise((resolve) => {
        window.setTimeout(resolve, milisegundos);
    });

let musicaPreparada = false;

/**
 * Prepara el audio silenciosamente durante una interacción del usuario.
 * Esto ayuda a evitar bloqueos de reproducción en celulares.
 */
async function prepararMusica() {
    if (!musica || musicaPreparada) {
        return;
    }

    try {
        musica.muted = true;

        await musica.play();

        musica.pause();
        musica.currentTime = 0;
        musica.muted = false;

        musicaPreparada = true;

    } catch (error) {
        musica.muted = false;
        console.info("No fue posible preparar el audio:", error);
    }
}

/**
 * Inicia la música cuando el invitado fue encontrado.
 */
async function reproducirMusica() {
    if (!musica) {
        return;
    }

    try {
        musica.muted = false;
        musica.currentTime = 0;

        await musica.play();

    } catch (error) {
        console.info("El navegador no permitió reproducir la música:", error);
    }
}

/**
 * Cambia entre los pasos internos de la fase 1.
 */
function mostrarPaso(nuevoPaso, pasoAnterior = null) {
    if (pasoAnterior) {
        pasoAnterior.classList.add("paso--cerrando");

        window.setTimeout(() => {
            pasoAnterior.classList.remove(
                "paso--visible",
                "paso--cerrando"
            );
        }, 500);
    }

    nuevoPaso.classList.add("paso--visible");
}

// ==============================================================
// APARICIÓN INICIAL DE LA CARTA
// ==============================================================

/**
 * La página comienza vacía.
 * Después de dos segundos aparece la carta.
 */
window.setTimeout(() => {
    mostrarPaso(pasoCarta);
}, 2000);

// ==============================================================
// ABRIR LA CARTA
// ==============================================================

/**
 * Al tocar la carta se muestra el formulario del nombre.
 */
function abrirCarta() {
    mostrarPaso(pasoNombre, pasoCarta);

    window.setTimeout(() => {
        inputNombre.focus({ preventScroll: true });
    }, 850);
}

cartaInicial.addEventListener("click", abrirCarta);

// ==============================================================
// CAMPO DEL NOMBRE
// ==============================================================

/**
 * El botón Enviar aparece y se habilita cuando existe un nombre.
 */
inputNombre.addEventListener("input", () => {
    const tieneNombre =
        inputNombre.value.trim().length > 0;

    btnEnviarNombre.disabled =
        !tieneNombre || enviandoNombre;

    btnEnviarNombre.classList.toggle(
        "btn--habilitado",
        tieneNombre
    );
});

/**
 * Permite enviar el nombre presionando Enter.
 */
inputNombre.addEventListener("keydown", (evento) => {
    if (
        evento.key === "Enter" &&
        !btnEnviarNombre.disabled
    ) {
        enviarNombre();
    }
});

btnEnviarNombre.addEventListener(
    "click",
    enviarNombre
);

// ==============================================================
// CONSULTAR Y REGISTRAR INVITADO
// ==============================================================

/**
 * Registra en Firestore que la persona abrió la invitación.
 * El cargador permanece visible el tiempo suficiente para
 * apreciar su animación.
 */
async function enviarNombre() {
    const nombre = inputNombre.value.trim();

    if (!nombre || enviandoNombre) {
        return;
    }

    // Se prepara silenciosamente mientras todavía existe
    // una interacción directa del usuario.
    prepararMusica();

    enviandoNombre = true;
    nombreInvitadoActual = nombre;

    btnEnviarNombre.disabled = true;
    inputNombre.disabled = true;

    estadoConsulta.textContent =
        "Consultando invitados...";

    estadoConsulta.classList.remove(
        "estado--encontrado",
        "estado--error"
    );

    mostrarPaso(
        pasoCarga,
        pasoNombre
    );

    try {
        /**
         * Registramos la apertura de la invitación.
         */
        const registroFirebase = addDoc(
            collection(db, "invitados"),
            {
                nombre: nombre,
                abrio_invitacion: true,
                fecha_apertura: new Date(),
                asistencia_confirmada: false
            }
        );

        /**
         * Firebase trabaja mientras mostramos la animación
         * durante al menos 1.5 segundos.
         */
        const [docRef] = await Promise.all([
            registroFirebase,
            esperar(1500)
        ]);

        idDocumentoInvitado = docRef.id;

        saludoInvitado.textContent =
            `¡Hola, ${nombre}!`;

        estadoConsulta.textContent = "Invitado encontrado";
        estadoConsulta.classList.add("estado--encontrado");

        // La música comienza exactamente cuando aparece
        // el mensaje "Invitado encontrado".
        await reproducirMusica();

        await esperar(950);
        await mostrarFaseDos();

    } catch (error) {
        console.error(
            "Error al registrar la apertura:",
            error
        );

        estadoConsulta.textContent =
            "No pudimos conectar. Intenta nuevamente.";

        estadoConsulta.classList.add(
            "estado--error"
        );

        await esperar(1700);

        pasoCarga.classList.remove(
            "paso--visible"
        );

        pasoNombre.classList.add(
            "paso--visible"
        );

        inputNombre.disabled = false;
        enviandoNombre = false;

        const tieneNombre =
            inputNombre.value.trim().length > 0;

        btnEnviarNombre.disabled =
            !tieneNombre;

        btnEnviarNombre.classList.toggle(
            "btn--habilitado",
            tieneNombre
        );
    }
}

// ==============================================================
// TRANSICIÓN A LA FASE 2
// ==============================================================

/**
 * Hace fade out de toda la fase 1 y activa
 * la secuencia animada de la fase 2.
 */
async function mostrarFaseDos() {
    faseDos.classList.remove(
        "fase--oculta"
    );

    faseDos.classList.add(
        "fase--activa",
        "fase-dos--entrando"
    );

    faseUno.classList.add(
        "fase--saliendo"
    );

    await esperar(750);

    faseUno.classList.remove(
        "fase--activa",
        "fase--saliendo"
    );

    faseUno.classList.add(
        "fase--oculta"
    );
}

// ==============================================================
// CONFIRMAR ASISTENCIA
// ==============================================================

/**
 * Confirma la asistencia en Firestore y abre WhatsApp
 * con el mensaje preparado.
 */
btnConfirmar.addEventListener(
    "click",
    async () => {
        if (!idDocumentoInvitado) {
            alert(
                "No pudimos identificar tu registro. " +
                "Recarga la invitación e intenta nuevamente."
            );

            return;
        }

        /**
         * Número de WhatsApp:
         * +52 951 656 0060
         *
         * Se escribe sin espacios, guiones ni el signo +.
         */
        const numeroWhatsApp =
            "529516560060";

        const mensajeWhatsApp =
            `Hola, confirmo mi asistencia al baby shower de Ketsia. ` +
            `Mi nombre es ${nombreInvitadoActual}. ` +
            `¡Muchas gracias por la invitación!`;

        const enlaceWhatsApp =
            `https://wa.me/${numeroWhatsApp}` +
            `?text=${encodeURIComponent(mensajeWhatsApp)}`;

        /**
         * Abrimos la pestaña durante el clic para reducir
         * la posibilidad de que el navegador la bloquee.
         */
        const ventanaWhatsApp =
            window.open("", "_blank");

        try {
            btnConfirmar.disabled = true;
            btnConfirmar.textContent =
                "Confirmando...";

            const invitadoRef = doc(
                db,
                "invitados",
                idDocumentoInvitado
            );

            await updateDoc(
                invitadoRef,
                {
                    asistencia_confirmada: true,
                    fecha_confirmacion: new Date()
                }
            );

            btnConfirmar.textContent =
                "¡Asistencia confirmada!";

            if (ventanaWhatsApp) {
                ventanaWhatsApp.location.href =
                    enlaceWhatsApp;
            } else {
                window.location.href =
                    enlaceWhatsApp;
            }

        } catch (error) {
            console.error(
                "Error al confirmar asistencia:",
                error
            );

            if (ventanaWhatsApp) {
                ventanaWhatsApp.close();
            }

            btnConfirmar.disabled = false;

            btnConfirmar.textContent =
                "Confirmar asistencia";

            alert(
                "Hubo un problema al confirmar. " +
                "Intenta nuevamente."
            );
        }
    }
);

// ==============================================================
// CONTADOR REGRESIVO
// ==============================================================

/**
 * Los meses en JavaScript comienzan desde cero:
 *
 * Enero = 0
 * Febrero = 1
 * ...
 * Agosto = 7
 *
 * Esta fecha corresponde al 22 de agosto de 2026,
 * a las 3:00 p. m.
 */
const fechaBabyShower =
    new Date(
        2026,
        7,
        9,
        15,
        0,
        0
    ).getTime();

/**
 * Actualiza los días, horas, minutos y segundos restantes.
 */
function actualizarContador() {
    const ahora = Date.now();

    const distancia =
        fechaBabyShower - ahora;

    if (distancia <= 0) {
        const contenedorContador =
            document.getElementById(
                "contenedor-contador"
            );

        contenedorContador.innerHTML =
            "<h2>¡Hoy es el gran día!</h2>";

        return false;
    }

    const dias = Math.floor(
        distancia /
        (1000 * 60 * 60 * 24)
    );

    const horas = Math.floor(
        (
            distancia %
            (1000 * 60 * 60 * 24)
        ) /
        (1000 * 60 * 60)
    );

    const minutos = Math.floor(
        (
            distancia %
            (1000 * 60 * 60)
        ) /
        (1000 * 60)
    );

    const segundos = Math.floor(
        (
            distancia %
            (1000 * 60)
        ) /
        1000
    );

    document.getElementById(
        "dias"
    ).textContent =
        String(dias).padStart(2, "0");

    document.getElementById(
        "horas"
    ).textContent =
        String(horas).padStart(2, "0");

    document.getElementById(
        "minutos"
    ).textContent =
        String(minutos).padStart(2, "0");

    document.getElementById(
        "segundos"
    ).textContent =
        String(segundos).padStart(2, "0");

    return true;
}

actualizarContador();

/**
 * Actualizamos el contador cada segundo.
 */
const intervaloReloj =
    window.setInterval(() => {
        const continuar =
            actualizarContador();

        if (!continuar) {
            window.clearInterval(
                intervaloReloj
            );
        }
    }, 1000);