# Gestor de Gastos

Aplicación web para gestión personal y compartida de finanzas, construida con Next.js, TypeScript, PostgreSQL y Prisma.

## Requisitos del proyecto

- Node.js 20+
- PostgreSQL 14+
- Prisma ORM

## Configuración inicial

1. Crear el archivo `.env` a partir de `.env.example`.
2. Ajustar `DATABASE_URL`.
3. Ejecutar:

```bash
npm install
npx prisma generate
npx prisma db push
npm run test
npm run dev
```

## Principios del dominio financiero

- No se usan floats ni doubles para dinero.
- Todo valor monetario se maneja con `Decimal` y redondeo explícito.
- Los eventos del historial se conservan.
- La relación de pago, responsabilidad económica y deuda entre usuarios se mantienen separadas.
- Las fórmulas financieras se centralizan fuera de componentes y controladores.

## Modelo financiero base

El proyecto incluye una base de datos Prisma con modelos para usuarios, cuentas, ingresos, gastos, gastos recurrentes, deudas, tarjetas, compras con cuotas, ahorros y liquidaciones.

El diseño prioriza trazabilidad del historial y claridad del modelo financiero sobre abstracciones innecesarias.
