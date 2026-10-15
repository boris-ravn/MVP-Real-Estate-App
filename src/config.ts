// Configuración única del prototipo. Cambia estos valores antes de compartir el link.

/** Nombre visible del producto (placeholder hasta definirlo). */
export const PRODUCT_NAME = '[NOMBRE_PRODUCTO]'

/** Con DEMO_MODE, antes de abrir WhatsApp se muestra un aviso con el mensaje (los números de prueba son ficticios). */
export const DEMO_MODE = true

/**
 * Número que recibe el feedback, formato internacional sin "+" (ej. "59170000000").
 * Vacío (por defecto) = no se abre WhatsApp: se muestra un aviso de prototipo con el mensaje
 * que se enviaría, y las respuestas quedan en /#/debug del teléfono del participante.
 */
export const FEEDBACK_WHATSAPP_NUMBER = ''
