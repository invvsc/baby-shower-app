// 1. Importar Firebase desde el CDN de Google (Versión 10.x compatible con v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 2. Configuración de Firebase
// (Obtendrás estos datos al registrar tu app web en la consola de Firebase)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TUS_DATOS",
  appId: "TUS_DATOS"
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

        // C. Transición de pantallas (Aquí luego puedes meter GSAP para animarlo)
        pantallaSobre.classList.replace('activa', 'oculta');
        pantallaInvitacion.classList.replace('oculta', 'activa');

    } catch (error) {
        console.error("Error al guardar en Firebase: ", error);
        alert("Hubo un problema de conexión. Intenta de nuevo.");
        btnAbrir.textContent = "Abrir Invitación";
        btnAbrir.disabled = false;
    }
});