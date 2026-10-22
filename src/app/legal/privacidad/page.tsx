import { LegalPage } from "@/components/landing/legal-page";

export const metadata = { title: "Política de privacidad", robots: { index: false } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Esta política explica cómo trata Repite los datos personales de los dueños de locales y de los clientes finales
        que usan una tarjeta de sellos.
      </p>
      <h2>Quién es el responsable</h2>
      <p>
        Para los datos de las cuentas de negocio, el responsable es Repite (titular y datos fiscales: por definir). Para
        los datos de los clientes finales, el responsable es cada local que usa Repite; Repite actúa como encargado del
        tratamiento y los trata solo siguiendo sus instrucciones.
      </p>
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>Dueños y equipo: correo, nombre, PIN (guardado cifrado) y registro de las acciones realizadas.</li>
        <li>
          Clientes: nombre, número de WhatsApp, cumpleaños (día y mes, opcional), idioma, visitas, sellos, premios y
          notas del local.
        </li>
        <li>Permiso de mensajes: si el cliente lo ha dado, cuándo y de qué forma.</li>
      </ul>
      <h2>Para qué los usamos</h2>
      <ul>
        <li>Gestionar la tarjeta de sellos y los premios (ejecución del servicio).</li>
        <li>
          Enviar mensajes del local por WhatsApp, solo a quien ha dado su consentimiento y siempre con la aprobación del
          dueño.
        </li>
        <li>Mantener la seguridad del servicio y prevenir fraudes, como los sellos duplicados.</li>
      </ul>
      <h2>Cuánto tiempo los conservamos</h2>
      <p>
        Mientras la cuenta esté activa y el cliente no pida su supresión. Al cerrar una cuenta, los datos se eliminan o
        se anonimizan en un plazo razonable (plazo exacto: por definir).
      </p>
      <h2>Tus derechos</h2>
      <p>
        Puedes acceder a tus datos, rectificarlos, pedir su supresión, limitar u oponerte a su tratamiento, y retirar tu
        consentimiento en cualquier momento. Los clientes pueden darse de baja de los mensajes desde los ajustes de su
        tarjeta. Contacto: por definir.
      </p>
      <h2>Con quién compartimos los datos</h2>
      <p>
        Solo con los proveedores necesarios para prestar el servicio (alojamiento, base de datos y envío de mensajes).
        No vendemos datos personales.
      </p>
    </LegalPage>
  );
}
