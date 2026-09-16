# Sistema de Finanzas Personales y Compartidas

Actúa como arquitecto de software y desarrollador senior responsable de diseñar e implementar una aplicación web para la gestión completa de finanzas personales y compartidas.

No debes limitarte a generar código que funcione. Debes preservar la integridad financiera, mantener una arquitectura sencilla y consistente y evitar introducir complejidad innecesaria.

Antes de implementar funcionalidades importantes, analiza sus implicaciones sobre el modelo financiero y de datos.

---

# 1. Objetivo

Construir una aplicación que permita a múltiples usuarios gestionar:

* ingresos;
* gastos;
* gastos recurrentes;
* deudas;
* tarjetas de crédito;
* compras a cuotas;
* ahorros;
* obligaciones compartidas;
* ahorros compartidos;
* balances entre personas.

Cada usuario debe tener sus finanzas privadas, pero debe poder compartir elementos financieros específicos con otros usuarios registrados.

El sistema debe permitir responder fácilmente preguntas como:

* ¿Cuánto dinero he gastado este mes?
* ¿En qué estoy gastando?
* ¿Cuánto debo actualmente?
* ¿Cuánto debo pagar este mes?
* ¿Cuánto debo en tarjetas de crédito?
* ¿Cuánto cupo tengo disponible?
* ¿Qué cuotas vienen próximamente?
* ¿Cuánto he ahorrado?
* ¿Cuánto ha aportado cada persona a un ahorro compartido?
* ¿Cuánto le debo a otra persona?
* ¿Cuánto me deben?
* ¿Qué gastos compartimos?
* ¿Qué parte de una compra con tarjeta corresponde a cada persona?
* ¿Cuáles son mis obligaciones recurrentes?

La aplicación debe ofrecer una visión clara del estado financiero actual y conservar el historial necesario para explicar cómo se llegó a ese estado.

---

# 2. Stack obligatorio

Utilizar:

* Next.js;
* TypeScript;
* PostgreSQL;
* Prisma ORM.

Next.js manejará frontend y backend dentro del mismo proyecto.

No introducir otro backend independiente.

## TypeScript

Todo el proyecto debe utilizar TypeScript estricto.

Debe estar habilitado:

`"strict": true`

Está prohibido utilizar:

* `any`;
* `as any`;
* `@ts-ignore`;
* `@ts-nocheck`;
* tipos artificialmente genéricos para evitar errores;
* casts innecesarios para silenciar TypeScript.

Preferir inferencia cuando sea clara y tipos explícitos cuando mejoren el contrato entre componentes.

Toda información proveniente del cliente debe considerarse no confiable y validarse en el backend.

---

# 3. Arquitectura obligatoria

Utilizar exclusivamente MVC.

No mezclar MVC con otras arquitecturas.

No introducir:

* Clean Architecture;
* Hexagonal Architecture;
* Onion Architecture;
* CQRS;
* Event Sourcing;
* DDD estructural;
* Repository Pattern innecesario;
* Mediator;
* buses de comandos;
* capas abstractas sin necesidad real.

Aplicar:

* KISS;
* DRY;
* Single Responsibility Principle.

No sobreingenierizar.

Una abstracción solamente debe existir cuando resuelva un problema real.

---

# 4. Responsabilidades MVC

## Models

Representan los datos y reglas relacionadas con las entidades financieras.

Prisma forma parte de la capa de datos/modelo.

La lógica financiera reutilizable debe mantenerse fuera de componentes visuales y controllers gigantes.

## Controllers

Los controllers coordinan las operaciones.

Responsabilidades:

* recibir solicitudes;
* validar datos;
* comprobar autorización;
* ejecutar la operación correspondiente;
* manejar errores;
* devolver respuestas.

Los controllers deben ser pequeños.

No colocar fórmulas financieras complejas directamente en controllers.

## Views

Las Views corresponden a la interfaz construida con Next.js/React.

Responsabilidades:

* mostrar información;
* capturar acciones;
* gestionar estado estrictamente visual;
* presentar errores;
* interactuar con controllers/endpoints.

Las Views no deben decidir reglas financieras.

---

# 5. Organización

Organizar el proyecto de forma predecible.

Una estructura inicial razonable puede ser:

src/
app/
controllers/
models/
lib/
validations/
types/
components/

prisma/
schema.prisma
migrations/

tests/

No crear carpetas únicamente para satisfacer patrones arquitectónicos.

Si una nueva carpeta o capa no tiene una responsabilidad claramente distinta, no crearla.

Mantener archivos pequeños y enfocados.

Evitar archivos "utils" gigantes.

Las utilidades financieras deben tener nombres y responsabilidades específicas.

---

# 6. Usuarios

El sistema soporta múltiples usuarios independientes.

Cada usuario puede tener:

* cuentas;
* ingresos;
* gastos;
* deudas;
* tarjetas;
* ahorros;
* gastos recurrentes.

Los recursos son privados por defecto.

Un usuario solamente puede acceder a recursos:

1. que le pertenecen; o
2. en los cuales participa explícitamente.

Compartir un gasto o ahorro NO significa compartir toda la información financiera entre usuarios.

Todos los permisos deben comprobarse en backend.

Nunca confiar en IDs enviados por frontend para determinar propiedad.

---

# 7. Concepto financiero fundamental

El sistema debe diferenciar siempre:

1. quién realizó un pago;
2. quién tiene responsabilidad económica sobre ese pago;
3. cuánto corresponde a cada participante;
4. cuánto ha pagado cada participante;
5. cuánto queda pendiente;
6. quién le debe a quién.

No asumir que quien realiza el pago es necesariamente quien soporta económicamente todo el gasto.

Esta regla es fundamental para gastos compartidos y tarjetas de crédito.

---

# 8. Ingresos

Permitir registrar ingresos.

Cada ingreso debe poder contener:

* descripción;
* categoría;
* valor;
* fecha;
* usuario;
* cuenta destino;
* notas opcionales.

Ejemplos:

* salario;
* honorarios;
* devolución;
* venta;
* ingreso adicional;
* otros.

Los ingresos deben formar parte del historial financiero.

---

# 9. Gastos

Permitir registrar gastos personales y compartidos.

Cada gasto debe poder almacenar:

* descripción;
* categoría;
* valor total;
* fecha;
* usuario que realizó el pago;
* cuenta o medio de pago;
* participantes;
* distribución;
* notas;
* estado cuando sea necesario.

Una distribución puede realizarse:

* en partes iguales;
* por porcentaje;
* por valores específicos.

La suma de las participaciones siempre debe coincidir exactamente con el total.

## Ejemplo

Arriendo:

$2.000.000

Usuario A paga todo.

Responsabilidad:

Usuario A: $1.000.000
Usuario B: $1.000.000

Resultado:

El proveedor recibió $2.000.000.

El gasto económico de A es $1.000.000.

El gasto económico de B es $1.000.000.

B tiene una obligación de $1.000.000 con A.

No registrar incorrectamente $2.000.000 como gasto económico exclusivo de A.

---

# 10. Gastos recurrentes

Permitir configurar obligaciones recurrentes como:

* arriendo;
* servicios;
* suscripciones;
* transporte;
* alimentación;
* cuotas periódicas.

Configurar:

* descripción;
* categoría;
* valor;
* frecuencia;
* fecha inicial;
* próxima fecha;
* participantes;
* distribución;
* estado.

Frecuencias:

* semanal;
* quincenal;
* mensual;
* bimestral;
* trimestral;
* semestral;
* anual.

El gasto recurrente representa la regla/programación.

Los movimientos financieros reales deben quedar registrados individualmente.

No perder historial cuando cambie una recurrencia.

---

# 11. Deudas

Permitir administrar deudas.

Una deuda debe contemplar:

* acreedor;
* deudor;
* descripción;
* monto original;
* saldo;
* fecha;
* vencimiento;
* cuotas cuando corresponda;
* pagos;
* estado.

Estados posibles:

* pendiente;
* parcialmente pagada;
* pagada;
* vencida.

Mantener historial de pagos.

Nunca eliminar los pagos anteriores simplemente porque la deuda haya sido completada.

---

# 12. Tarjetas de crédito

Las tarjetas requieren tratamiento especializado.

Cada tarjeta debe permitir configurar:

* nombre;
* banco;
* titular;
* cupo;
* tasa efectiva anual;
* fecha/día de corte;
* fecha/día límite de pago;
* estado.

Una tarjeta siempre pertenece a un titular.

Las compras realizadas con ella pueden tener varios responsables económicos.

---

# 13. Compras con tarjeta

Registrar:

* tarjeta;
* descripción;
* valor;
* fecha;
* cuotas;
* tasa aplicable;
* participantes;
* distribución;
* cronograma;
* estado.

Debe existir un cronograma de cuotas.

Cada cuota debe poder representar:

* número;
* capital;
* interés;
* valor total;
* vencimiento;
* saldo;
* estado.

Los cálculos deben ser determinísticos y testeables.

No utilizar aproximaciones arbitrarias.

---

# 14. Tasas de interés

La tarjeta puede configurarse mediante tasa efectiva anual (EA).

Cuando sea necesario obtener una tasa efectiva mensual:

TEM = (1 + EA)^(1/12) - 1

No dividir simplemente la tasa EA entre 12.

Centralizar todas las fórmulas financieras.

Las funciones financieras deben ser:

* puras cuando sea posible;
* testeables;
* independientes de UI;
* independientes del transporte HTTP.

Definir explícitamente reglas de redondeo monetario.

---

# 15. Compras compartidas con tarjeta

Ejemplo:

Usuario A es titular de una tarjeta.

Compra:

$1.200.000

6 cuotas.

Participantes:

A: 50 %
B: 50 %

El sistema debe diferenciar dos relaciones.

## Frente al banco

El responsable continúa siendo A porque es el titular.

## Entre usuarios

B es responsable económicamente por su porcentaje correspondiente.

El sistema debe determinar cuánto corresponde a cada participante en cada cuota, incluyendo el tratamiento definido para intereses.

No duplicar la deuda.

La obligación con el banco y la obligación interna entre usuarios representan relaciones diferentes sobre el mismo hecho financiero.

---

# 16. Ahorros

Permitir crear ahorros individuales y compartidos.

Cada ahorro puede contener:

* nombre;
* descripción;
* meta;
* fecha objetivo;
* participantes;
* estado.

Cada aporte debe registrar:

* usuario;
* valor;
* fecha;
* ahorro;
* descripción opcional.

Nunca perder la identidad del aportante.

## Ejemplo

Meta:

$10.000.000

A aportó:

$3.000.000

B aportó:

$2.000.000

Mostrar:

Total: $5.000.000

A: $3.000.000

B: $2.000.000

Faltante: $5.000.000

No convertir los aportes en un único saldo sin trazabilidad.

---

# 17. Balances entre usuarios

El sistema debe determinar cuánto se deben los usuarios entre sí.

Ejemplo:

A pagó $500.000 correspondientes a B.

Después B pagó $200.000 correspondientes a A.

Balance neto:

B debe $300.000 a A.

Sin embargo, conservar ambos movimientos originales.

La optimización o compensación del balance no debe destruir el historial.

Diferenciar:

* obligaciones;
* pagos;
* compensaciones;
* saldo neto.

---

# 18. Liquidación

Permitir registrar cuando un usuario paga parcial o totalmente lo que debe a otro.

Ejemplo:

B debe $300.000 a A.

B transfiere $200.000.

El sistema debe conservar:

Deuda anterior: $300.000
Pago: $200.000
Pendiente: $100.000

La liquidación debe poder relacionarse con las obligaciones que está pagando.

---

# 19. Dashboard

Construir un dashboard que responda rápidamente al estado financiero del usuario.

Debe contemplar:

* ingresos;
* gastos;
* balance del período;
* gastos por categoría;
* deuda total;
* deuda de tarjetas;
* próximas cuotas;
* gastos recurrentes próximos;
* cupo de tarjetas;
* ahorros;
* progreso de metas;
* cuentas por pagar a personas;
* cuentas por cobrar a personas.

Permitir filtros:

* mes actual;
* mes anterior;
* últimos 3 meses;
* año;
* rango personalizado.

No calcular reglas financieras complejas en React.

---

# 20. Historial y trazabilidad

Las operaciones financieras deben conservar historial.

Preferir un modelo basado en movimientos sobre simplemente actualizar números acumulados.

Debe ser posible explicar de dónde proviene un saldo.

Evitar depender exclusivamente de campos como:

`currentBalance`

cuando el valor pueda derivarse de movimientos históricos.

Se pueden utilizar valores derivados/caches cuando exista una justificación concreta de rendimiento, pero la fuente financiera debe permanecer trazable.

---

# 21. Dinero y precisión

Nunca utilizar `float` o `double` para almacenar dinero.

Utilizar `Decimal` mediante Prisma/PostgreSQL.

Definir una precisión apropiada.

Todos los cálculos monetarios deben manejar explícitamente:

* precisión;
* redondeo;
* moneda.

Diseñar inicialmente el sistema para una moneda principal por usuario o cuenta sin introducir un sistema complejo de conversión multidivisa salvo que sea requerido.

---

# 22. Base de datos

Diseñar cuidadosamente las relaciones Prisma.

Considerar entidades equivalentes a:

* User
* Account
* Income
* Expense
* ExpenseParticipant
* RecurringExpense
* Debt
* DebtPayment
* CreditCard
* CreditCardPurchase
* PurchaseInstallment
* PurchaseParticipant
* SavingGoal
* SavingParticipant
* SavingContribution
* Settlement

Estos nombres son una referencia conceptual.

No debes crear todas estas tablas automáticamente si existe una representación más simple y correcta.

Antes de implementar el schema definitivo:

1. analizar las entidades;
2. analizar cardinalidades;
3. identificar propiedad;
4. identificar participación;
5. identificar historial;
6. evitar duplicación;
7. presentar el modelo propuesto.

---

# 23. Transacciones de base de datos

Utilizar transacciones Prisma cuando una operación modifique varios registros que deben mantenerse consistentes.

Ejemplos:

* crear gasto compartido;
* registrar pago de deuda;
* registrar liquidación;
* crear compra con cuotas;
* registrar pago relacionado con varias obligaciones.

Una operación financiera debe completarse completamente o no completarse.

Evitar estados parcialmente actualizados.

---

# 24. Idempotencia

Analizar operaciones susceptibles de ejecutarse dos veces por:

* doble clic;
* reintentos HTTP;
* problemas de red;
* reenvío de formularios.

Las operaciones financieras críticas deben protegerse contra duplicación cuando sea necesario.

No implementar infraestructura de idempotencia global si no es necesaria.

---

# 25. Autorización

Cada operación debe validar:

* usuario autenticado;
* propiedad del recurso;
* participación cuando sea compartido;
* permiso para realizar la operación.

Nunca permitir algo equivalente a:

GET /expenses/{id}

sin comprobar que el usuario tenga derecho a consultar ese gasto.

Aplicar la misma regla a modificaciones y eliminaciones.

---

# 26. Validación

Validar en backend:

* IDs;
* fechas;
* cantidades;
* porcentajes;
* participantes;
* distribuciones;
* estados;
* tasas;
* número de cuotas.

Ejemplos de invariantes:

valor > 0

cuotas >= 1

0 <= tasa

suma(participaciones) == total

No permitir participantes duplicados.

No aceptar fechas imposibles.

No confiar únicamente en validaciones del formulario.

---

# 27. Eliminación de información financiera

Evitar eliminar físicamente movimientos financieros importantes.

Cuando sea apropiado utilizar:

* cancelación;
* reversión;
* archivado;
* estado inactivo.

Una operación financiera histórica no debería desaparecer silenciosamente.

Si se necesita corregir un movimiento importante, preferir mecanismos que mantengan trazabilidad.

No implementar un sistema contable complejo de doble partida salvo que sea necesario.

---

# 28. Testing obligatorio

Las reglas financieras deben tener pruebas automatizadas.

Prioridad alta:

* conversión EA → tasa mensual;
* cálculo de intereses;
* cuotas;
* redondeos;
* gastos divididos;
* porcentajes;
* valores específicos;
* compras compartidas;
* pagos parciales;
* deuda restante;
* balances entre usuarios;
* liquidaciones;
* aportes compartidos;
* autorización;
* transacciones críticas.

Incluir casos límite.

Ejemplo:

$100 dividido entre 3 personas no puede generar mágicamente $99.99 o $100.02.

Definir una regla determinística para distribuir diferencias de redondeo.

---

# 29. UI/UX

La complejidad del modelo no debe trasladarse al usuario.

Las acciones principales deben ser claras:

* Registrar ingreso
* Registrar gasto
* Registrar compra
* Crear deuda
* Registrar pago
* Crear ahorro
* Agregar aporte
* Pagar a una persona
* Ver próximos pagos

Cuando un gasto sea compartido, la UI debe permitir seleccionar participantes y definir fácilmente:

* partes iguales;
* porcentajes;
* valores.

Mostrar claramente quién pagó y cuánto corresponde a cada persona.

---

# 30. Manejo de errores

Los errores deben ser claros y tipados.

Diferenciar como mínimo:

* validación;
* autenticación;
* autorización;
* recurso inexistente;
* conflicto;
* error interno.

No exponer errores internos de PostgreSQL o Prisma directamente al usuario.

Registrar información suficiente para depuración sin exponer información sensible.

---

# 31. Reglas para el agente

Estas reglas son obligatorias durante todo el desarrollo.

## Antes de escribir código

Primero inspecciona el proyecto existente.

No asumas que un archivo, dependencia, modelo o función no existe sin comprobarlo.

Antes de realizar cambios importantes:

1. identifica los archivos involucrados;
2. entiende la implementación actual;
3. determina el cambio mínimo necesario;
4. identifica posibles efectos secundarios.

---

## No inventes requisitos

Si una decisión funcional tiene varias interpretaciones y afecta significativamente:

* dinero;
* intereses;
* deuda;
* propiedad;
* permisos;
* modelo de datos;

NO elijas arbitrariamente.

Presenta las alternativas brevemente y solicita una decisión.

Para decisiones técnicas menores y reversibles, utiliza la alternativa más simple y continúa.

---

## No sobreingenierices

No crear:

* interfaces con una sola implementación sin motivo;
* factories innecesarias;
* wrappers de Prisma sin beneficio;
* abstracciones anticipadas;
* sistemas de eventos internos innecesarios;
* capas adicionales;
* microservicios;
* paquetes separados sin necesidad.

Resolver primero el problema actual.

---

## No hagas refactors fuera del alcance

Cuando implementes una funcionalidad:

modifica únicamente lo necesario.

No reformatees o reestructures módulos no relacionados.

Si detectas un problema fuera del alcance, indícalo pero no lo modifiques automáticamente salvo que impida la tarea actual.

---

## No ocultes errores

Está prohibido solucionar problemas

