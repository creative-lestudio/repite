# G · Registro de riesgos

| ID | Tipo | Riesgo | Prob. | Impacto | Mitigación | Responsable |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | Técnico | Un repositorio con `service_role` olvida filtrar por organización | Media | Crítico | Pruebas de aislamiento por repositorio (P0-T4); revisión en cada PR | T |
| R2 | Técnico | Sin entorno de pruebas se rompe producción | Alta | Alto | `staging` separado (P0-T2) | P + T |
| R3 | Técnico | Pérdida de datos sin copia restaurable | Baja | Crítico | Plan con copias + prueba de restauración (P0-T3) | P |
| R4 | Técnico | Carga concurrente duplica sellos/canjes | Baja | Alto | Bloqueos + idempotencia + prueba concurrente (P0-T1) | T |
| R5 | Proveedor | Apple/Google rechazan o retrasan los pases | Media | Medio | Tarjeta web siempre funcional; no vender Wallet hasta verificarlo | T |
| R6 | Proveedor | Límite y reputación del correo transaccional | Alta | Alto | SMTP propio con dominio verificado (P0-B1) | P |
| R7 | Legal | Tratar datos reales sin revisión jurídica | Media | Crítico | No captar clientes reales hasta revisar RGPD/LSSI y firmar encargos (P0-L3) | P |
| R8 | Legal | Comunicaciones comerciales sin base adecuada | Media | Alto | Consentimiento con historial; separar programa y publicidad (P0-L1) | T + P |
| R9 | Legal | Incentivos por reseñas | Alta (hoy) | Alto | Eliminar sello por reseña (P0-R1) | T |
| R10 | Comercial | Promesas no verificadas en la web | Alta (hoy) | Alto | Revisión de textos (P0-C1) | T + P |
| R11 | Comercial | Disposición a pagar menor a 25 € | Media | Alto | Pilotos y precios revisables sin tocar código | P |
| R12 | Comercial | Soporte consume el margen | Media | Medio | Medir tickets por local; autoservicio y guías | P |
| R13 | Operativo | Dependencia de una sola persona (titular) | Alta | Medio | Documentación en `docs/`, decisiones registradas | P + T |
| R14 | Producto | El empleado no usa la tablet en hora punta | Media | Alto | Medir tiempo por operación; simplificar | T |
| R15 | Venezuela | Cobros, legalidad y conectividad no validados | Alta | Medio | Solo piloto; sin cobro real hasta validar | P |
| R16 | Seguridad | Sin CSP ni MFA del dueño | Media | Medio | P1-T6 y MFA en P2 | T |
