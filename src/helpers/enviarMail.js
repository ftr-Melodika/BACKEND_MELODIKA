// Envío de mails por SMTP (Gmail). Variables de entorno:
//   SMTP_USER  cuenta que envía (ej: melodika.learn@gmail.com)
//   SMTP_PASS  contraseña de aplicación de esa cuenta (no la contraseña normal)
//   MAIL_DESTINO  quién recibe las consultas (por defecto, SMTP_USER)
import nodemailer from 'nodemailer';

let transporte = null;

const obtenerTransporte = () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('El envío de mails no está configurado.');
    }
    if (!transporte) {
        transporte = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    }
    return transporte;
};

export const enviarMail = async ({ asunto, texto, replyTo }) => {
    try {
        await obtenerTransporte().sendMail({
            from: `"Melodika" <${process.env.SMTP_USER}>`,
            to: process.env.MAIL_DESTINO || process.env.SMTP_USER,
            replyTo,
            subject: asunto,
            text: texto,
        });
    } catch (error) {
        console.error('Error al enviar mail:', error);
        throw new Error('No se pudo enviar el mensaje. Probá de nuevo en unos minutos.', { cause: error });
    }
};
