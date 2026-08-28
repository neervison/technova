# TechNova — Landing page + Panel de pedidos y facturación

Proyecto web profesional para una empresa de servicios tecnológicos (mantenimiento de PCs y
desarrollo web). Incluye:

- **Landing page** responsiva y animada (`/`) que captura los pedidos de los clientes.
- **API** en Node/Express que guarda **clientes** y **pedidos** en **MongoDB**.
- **Panel del vendedor** (`/admin`) protegido por contraseña, con la base de datos de clientes,
  seguimiento de pedidos y **generación de facturas** (HTML imprimible + PDF descargable).

Todo se sirve desde un único proceso Node; no requiere servidor de base de datos externo.

## Estructura

```
technova/
├── package.json            # Dependencias y scripts (start / dev)
├── .env.example            # Plantilla de variables de entorno
├── .gitignore
├── server/
│   ├── index.js            # Servidor Express: rutas públicas, API y panel
│   ├── db.js               # Conexión a MongoDB (driver oficial)
│   ├── auth.js             # Sesión del vendedor (cookie + token en memoria)
│   └── invoice.js          # Plantilla HTML de factura + generación PDF (PDFKit)
├── public/                 # Frontend estático
│   ├── index.html          # Landing page
│   ├── css/styles.css      # Estilos propios
│   ├── js/tailwind.config.js
│   ├── js/data.js          # Contenido editable (testimonios, proyectos, WA)
│   ├── js/main.js          # Lógica de la landing (envía el pedido a la API)
│   ├── admin.html          # Panel del vendedor
│   └── admin.js            # Lógica del panel
└── db/                    # (no usado con Mongo; se ignora en git)
```

## Requisitos

- **Node.js 18+** (driver oficial `mongodb`). Probado en Node 24.
- **MongoDB** (Atlas o local). Configura `MONGODB_URI` en `.env`.
- npm (para instalar dependencias).

## Instalación

```bash
npm install
cp .env.example .env      # y edita ADMIN_PASSWORD, WA_NUMBER y datos de la empresa
npm start                 # Produce: TechNova corriendo en http://localhost:3000
```

Para desarrollo con recarga automática: `npm run dev`.

## Configuración (`.env`)

| Variable         | Descripción                                                  |
|------------------|--------------------------------------------------------------|
| `PORT`           | Puerto del servidor (def. 3000)                              |
| `ADMIN_PASSWORD` | Contraseña del panel `/admin`                               |
| `WA_NUMBER`      | Número de WhatsApp (sin `+`) al que se redirigen los pedidos |
| `COMPANY_NAME`   | Nombre de la empresa (aparece en facturas)                  |
| `COMPANY_RFC`    | RFC (opcional)                                              |
| `COMPANY_ADDRESS`| Domicilio fiscal                                            |
| `COMPANY_PHONE`  | Teléfono                                                     |
| `COMPANY_EMAIL`  | Correo                                                       |

## Uso

1. Abre `http://localhost:3000` — la landing page. Al enviar el formulario de agendamiento se
   **guarda el cliente y el pedido** en la base de datos y se abre WhatsApp para confirmar.
2. Abre `http://localhost:3000/admin` e inicia sesión con `ADMIN_PASSWORD`.
3. En el panel ves **Clientes** y **Pedidos**; puedes cambiar el estado de un pedido.
4. En un pedido, pulsa **Factura →** para emitirla (define subtotal/IVA) y luego
   **Imprimir / Guardar PDF** o **Descargar PDF**.

## API

| Método | Ruta                              | Auth | Descripción                              |
|--------|-----------------------------------|------|------------------------------------------|
| POST   | `/api/orders`                     | No   | Crea cliente + pedido; devuelve `waLink` |
| GET    | `/api/admin/me`                   | No   | ¿Sesión válida?                          |
| POST   | `/admin/login`                    | No   | Login (cookie `tn_session`)              |
| POST   | `/admin/logout`                   | Sí   | Cerrar sesión                            |
| GET    | `/api/admin/customers`            | Sí   | Lista de clientes                        |
| GET    | `/api/admin/orders`               | Sí   | Lista de pedidos                         |
| POST   | `/api/admin/orders/:id/status`    | Sí   | Cambia el estado de un pedido            |
| POST   | `/api/admin/invoices`             | Sí   | Emite factura para un pedido             |
| GET    | `/api/admin/invoices/:orderId`    | Sí   | Datos de la factura de un pedido         |
| GET    | `/admin/invoice/:orderId`         | Sí   | Página HTML de la factura                |
| GET    | `/admin/pdf/:orderId`             | Sí   | Descarga la factura en PDF               |

## Base de datos

Colecciones (MongoDB):

- `customers(_id, name, phone UNIQUE, email, created_at)`
- `orders(_id, customer_id, service, fecha, hora, descripcion, status, total, created_at)`
- `invoices(_id, order_id UNIQUE, number, subtotal, tax, total, issued_at, notes)`

## Notas

- La factura se emite una sola vez por pedido (`number` tipo `FAC-0001`).
- El archivo de base de datos (`db/*.db`) y `.env` están en `.gitignore`.
- El número de WhatsApp en el formulario y en el servidor debe coincidir; cámbialo en
  `public/js/data.js` (FAB) y en `.env` (`WA_NUMBER`).
