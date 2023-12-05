const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // Especificação OpenAPI utilizada
    info: {
      title: 'API Naquela Mesa',
      version: '1.0.0',
      description: 'API do aplicativo de comida intitulado como Naquela Mesa',
    },
    servers: [
        {
          url: 'https://naquela-mesa-db.vercel.app',
          description: 'Development server',
        },
      ],
  },
  apis: ['./index.js'], // Caminho para seus arquivos de rota
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
