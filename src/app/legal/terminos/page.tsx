import { LegalPage } from "@/components/landing/legal-page";

export const metadata = { title: "Términos de uso", robots: { index: false } };

export default function TermsPage() {
  return (
    <LegalPage title="Términos de uso">
      <p>Estos términos regulan el uso de Repite por parte de negocios (en adelante, «el local»).</p>
      <h2>El servicio</h2>
      <p>
        Repite ofrece una tarjeta de sellos digital, un panel para el equipo y el dueño, y herramientas para preparar
        mensajes a clientes.
      </p>
      <h2>Prueba gratuita y precio</h2>
      <p>
        Todas las cuentas incluyen 30 días de prueba gratuita sin necesidad de tarjeta. Al terminar, el uso continuado
        requiere activar el plan de pago vigente. El precio se mostrará antes de contratar.
      </p>
      <h2>Obligaciones del local</h2>
      <ul>
        <li>Informar a sus clientes del uso de sus datos y respetar su decisión sobre recibir mensajes.</li>
        <li>No enviar comunicaciones a quien no haya dado su consentimiento ni usar el servicio para spam.</li>
        <li>Custodiar los accesos de su equipo (correo y PIN) y dar de baja a quien deje de trabajar con ellos.</li>
      </ul>
      <h2>Disponibilidad y cambios</h2>
      <p>
        Trabajamos para que el servicio esté siempre disponible, aunque no podemos garantizarlo sin interrupciones.
        Avisaremos de los cambios importantes.
      </p>
      <h2>Baja</h2>
      <p>
        El local puede dejar de usar Repite cuando quiera. Podrá exportar sus clientes a CSV desde el panel antes de
        cerrar la cuenta.
      </p>
    </LegalPage>
  );
}
