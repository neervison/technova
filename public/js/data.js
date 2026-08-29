/*============================================================
   TechNova — Datos / contenido editable
   Separado de la lógica (js/main.js) para fácil mantenimiento.
   Se expone vía window.TN para no contaminar el scope global.
   ============================================================ */
window.TN = window.TN || {};

/* Número de WhatsApp (placeholder): reemplazar por el número real */
window.TN.WA_NUMBER = '56961112430';

/* Mensaje de bienvenida prefijado en el chat de WhatsApp (relacionado con el servicio) */
window.TN.WA_GREETING = '*¡Hola!* Somos TechNova. Cuéntanos en qué te ayudamos: reparación y optimización de tu PC, mantenimiento o desarrollo web. Agenda tu cita, ¡rápido y garantizado!';

/* Testimonios del carrusel */
window.TN.testimonials = [
  { name: 'María González', role: 'Dueña de cafetería', text: 'Me repararon la computadora en el día y quedó como nueva. Súper profesionales y rápidos.', avatar: 'img/avatars/maria-gonzalez.svg' },
  { name: 'Carlos Ramírez', role: 'Emprendedor', text: 'TechNova me hizo la landing page de mi negocio y las ventas subieron desde el primer mes. ¡Gracias!', avatar: 'img/avatars/carlos-ramirez.svg' },
  { name: 'Lucía Fernández', role: 'Diseñadora', text: 'Optimizaron mi equipo y ahora edita video sin lag. Excelente servicio y buen precio.', avatar: 'img/avatars/lucia-fernandez.svg' },
  { name: 'Jorge Mendoza', role: 'Pequeña empresa', text: 'Nuestra tienda online funciona perfecta. Siempre disponibles para dudas y soporte.', avatar: 'img/avatars/jorge-mendoza.svg' },
  { name: 'Ana Torres', role: 'Estudiante', text: 'Formatearon mi laptop y recuperaron mis archivos. Trato amable y muy confiable.', avatar: 'img/avatars/ana-torres.svg' }
];

/* Proyectos del portafolio (cada uno abre un modal de detalle) */
window.TN.projects = [
  { id: '1517694712202-14dd9538aa97', seed: 'educativa', img: 'img/projects/educativa.jpg', category: 'Desarrollo Web', title: 'Plataforma Educativa', tech: ['HTML/CSS', 'JavaScript'], description: 'Plataforma de cursos online con lecciones pregrabadas, cuestionarios y panel para instructores. Diseño claro, navegación sencilla y carga rápida en cualquier dispositivo.' },
  { id: '1498050108023-c5249f4df085', seed: 'blog', img: 'img/projects/blog.jpg', category: 'Desarrollo Web', title: 'Blog Corporativo', tech: ['React', 'Tailwind'], description: 'Blog institucional con CMS headless, artículos optimizados para SEO y un buscador instantáneo. Centrado en la lectura y la conversión de contactos.' },
  { id: '1461749280684-dccba630e2f6', seed: 'tienda', img: 'img/projects/tienda.jpg', category: 'E-commerce', title: 'Tienda Online', tech: ['Shopify', 'Payments'], description: 'Tienda de ropa con catálogo filtrable, pasarela de pago segura y checkout de un solo paso. Integración con redes y seguimiento de inventario en tiempo real.' },
  { id: '1488590528505-98d2b5aba04b', seed: 'dashboard', img: 'img/projects/dashboard.jpg', category: 'Desarrollo Web', title: 'Dashboard Analytics', tech: ['Vue', 'Chart.js'], description: 'Panel de analítica en tiempo real con gráficos interactivos, filtros por fecha y exportación de reportes. Pensado para tomar decisiones rápido.' },
  { id: '1504384308090-c894fdcc538d', seed: 'institucional', img: 'img/projects/institucional.jpg', category: 'Desarrollo Web', title: 'Web Institucional', tech: ['WordPress', 'SEO'], description: 'Sitio corporativo multisección con formulario de contacto, mapa y blog. Optimizado para buscadores y con velocidad de carga garantizada.' },
  { id: '1486312338219-ce68d2c6f44d', seed: 'reservas', img: 'img/projects/reservas.jpg', category: 'Desarrollo Web', title: 'App de Reservas', tech: ['Next.js', 'API'], description: 'Aplicación de reservas con calendario en vivo, recordatorios automáticos y panel de administración. Reduce no-shows y agiliza la agenda.' }
];
