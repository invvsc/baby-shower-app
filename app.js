// 1. Importar Firebase desde el CDN de Google (Versión 10.x compatible con v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. Configuración de Firebase
// (Obtendrás estos datos al registrar tu app web en la consola de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAoKbJH_sbP3r0HPO3u_0tScEmMZDxx9H8",
  authDomain: "invitacion-baby-shower-d5dc5.firebaseapp.com",
  projectId: "invitacion-baby-shower-d5dc5",
  storageBucket: "invitacion-baby-shower-d5dc5.firebasestorage.app",
  messagingSenderId: "378897295677",
  appId: "1:378897295677:web:ac3bd788dab94ff6c1bd54",
  measurementId: "G-EX84WEVFJQ"
};

// 3. Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Referencias al DOM
const btnAbrir = document.getElementById('btn-abrir');
const inputNombre = document.getElementById('nombre-invitado');
const pantallaSobre = document.getElementById('pantalla-sobre');
const pantallaInvitacion = document.getElementById('pantalla-invitacion');
const saludoInvitado = document.getElementById('saludo-invitado');
const musica = document.getElementById('musica-fondo');
const btnConfirmar = document.getElementById('btn-confirmar');

// Espera dos frames para que el navegador registre el estado inicial
// antes de comenzar el fade in.
const esperarSiguientePintado = () => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
});

const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)');

function esperarFinVisual(elemento, evento, tiempoMaximo) {
    if (movimientoReducido.matches) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        let termino = false;

        const finalizar = () => {
            if (termino) return;
            termino = true;
            elemento.removeEventListener(evento, finalizar);
            resolve();
        };

        elemento.addEventListener(evento, finalizar, { once: true });
        window.setTimeout(finalizar, tiempoMaximo);
    });
}

async function mostrarSegundaFase() {
    // Preparamos la nueva pantalla sin hacerla visible todavía.
    pantallaInvitacion.classList.remove('oculta');
    pantallaInvitacion.classList.add('preparando-entrada');

    await esperarSiguientePintado();

    // Ambas animaciones ocurren al mismo tiempo: crossfade.
    pantallaSobre.classList.add('saliendo');
    pantallaInvitacion.classList.replace('preparando-entrada', 'entrando');

    await Promise.all([
        esperarFinVisual(pantallaSobre, 'transitionend', 850),
        esperarFinVisual(btnConfirmar, 'animationend', 1100)
    ]);

    // Dejamos ambos elementos en estados estables al terminar.
    pantallaSobre.classList.remove('activa', 'saliendo');
    pantallaSobre.classList.add('oculta');

    pantallaInvitacion.classList.remove('entrando');
    pantallaInvitacion.classList.add('activa');
}

// Variable global para guardar el ID del documento (lo usarás para confirmar asistencia)
export let idDocumentoInvitado = ""; 

// 5. Lógica al presionar "Abrir Invitación"
btnAbrir.addEventListener('click', async () => {
    const nombre = inputNombre.value.trim();

    if (nombre === "") {
        alert("Por favor, escribe tu nombre para abrir la carta.");
        return;
    }

    try {
        // Bloquear el botón mientras Firebase procesa
        btnAbrir.textContent = "Abriendo...";
        btnAbrir.disabled = true;

        // A. Escribir en la base de datos de Firestore
        const docRef = await addDoc(collection(db, "invitados"), {
            nombre: nombre,
            abrio_invitacion: true,
            fecha_apertura: new Date(), // Registra la hora exacta
            asistencia_confirmada: false // Por defecto es false
        });

        // Guardamos el ID que Firebase generó para este invitado
        idDocumentoInvitado = docRef.id; 
        console.log("Registrado con éxito. ID:", idDocumentoInvitado);

        // B. Personalizar el saludo
        saludoInvitado.textContent = `¡Hola, ${nombre}!`;

        // C. Transición animada entre las dos fases
        await mostrarSegundaFase();

        // D. Inicia la música. Si el navegador la bloquea, la invitación
        // permanece abierta y el resto de la experiencia sigue funcionando.
        musica.play().catch(() => {
            console.info('El navegador bloqueó la reproducción automática del audio.');
        });

    } catch (error) {
        console.error("Error al guardar en Firebase: ", error);
        alert("Hubo un problema de conexión. Intenta de nuevo.");
        btnAbrir.textContent = "Abrir Invitación";
        btnAbrir.disabled = false;
    }
});

// Lógica al presionar "Confirmar Asistencia"
btnConfirmar.addEventListener('click', async () => {
    // Verificamos que exista el registro del invitado
    if (!idDocumentoInvitado) {
        alert("Hubo un error al identificar tu registro.");
        return;
    }

    const nombreInvitado = inputNombre.value.trim() || "Invitado/a";

    // El número debe escribirse sin espacios, signos ni guiones
    const numeroWhatsApp = "529516560060";

    const mensajeWhatsApp =
        `Hola, confirmo mi asistencia al baby shower de Ketsia. ` +
        `Mi nombre es ${nombreInvitado}. ` +
        `¡Muchas gracias por la invitación!`;

    const enlaceWhatsApp =
        `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensajeWhatsApp)}`;

    // Abrimos una pestaña durante el clic para evitar que sea bloqueada
    const ventanaWhatsApp = window.open('', '_blank');

    try {
        btnConfirmar.textContent = "Confirmando...";
        btnConfirmar.disabled = true;

        const invitadoRef = doc(
            db,
            "invitados",
            idDocumentoInvitado
        );

        // Guardamos primero la confirmación en Firebase
        await updateDoc(invitadoRef, {
            asistencia_confirmada: true,
            fecha_confirmacion: new Date()
        });

        console.log(
            "Asistencia confirmada para el ID:",
            idDocumentoInvitado
        );

        btnConfirmar.textContent = "¡Asistencia Confirmada!";
        btnConfirmar.style.backgroundColor = "#4CAF50";

        // Abrimos WhatsApp con el mensaje preparado
        if (ventanaWhatsApp) {
            ventanaWhatsApp.location.href = enlaceWhatsApp;
        } else {
            // Respaldo si el navegador bloquea la pestaña
            window.location.href = enlaceWhatsApp;
        }

    } catch (error) {
        console.error(
            "Error al actualizar la base de datos:",
            error
        );

        if (ventanaWhatsApp) {
            ventanaWhatsApp.close();
        }

        alert("Hubo un problema al confirmar. Intenta de nuevo.");

        btnConfirmar.textContent = "Confirmar Asistencia";
        btnConfirmar.disabled = false;
    }
});

// --- LÓGICA DEL CONTADOR REGRESIVO ---

// Definimos la fecha límite: 22 de Agosto a las 15:00:00 (3 PM)
// Nota: En JavaScript los meses empiezan en 0 (0 = Enero, 7 = Agosto)
const fechaBabyShower = new Date(2026, 7, 22, 15, 0, 0).getTime();

// Función que actualiza el reloj cada segundo
const intervaloReloj = setInterval(() => {
    
    // Obtener la fecha y hora actual
    const ahora = new Date().getTime();
    
    // Encontrar la diferencia entre la fecha del evento y ahora
    const distancia = fechaBabyShower - ahora;
    
    // Cálculos matemáticos para Días, Horas, Minutos y Segundos
    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);
    
    // Inyectar los resultados en el HTML
    // (Usamos padStart para que siempre haya 2 dígitos: "09" en vez de "9")
    document.getElementById("dias").innerText = String(dias).padStart(2, '0');
    document.getElementById("horas").innerText = String(horas).padStart(2, '0');
    document.getElementById("minutos").innerText = String(minutos).padStart(2, '0');
    document.getElementById("segundos").innerText = String(segundos).padStart(2, '0');
    
    // Si la fecha ya llegó, detenemos el reloj y mostramos un mensaje
    if (distancia < 0) {
        clearInterval(intervaloReloj);
        document.getElementById("contenedor-contador").innerHTML = "<h2>¡Hoy es el gran día!</h2>";
    }
    
}, 1000);
