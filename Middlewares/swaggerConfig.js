import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Navkar Logistics API Documentation',
      version: '1.0.0',
      description: 'API documentation for Navkar Logistics',
    },
    servers: [
      {
        url: 'http://localhost:8088/api/v1',
        description: 'Local server',
      },
    ],
  },
  apis: ['./Routes/*.js'], // Path to your API files
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwaggerDocs = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger docs available at http://localhost:8088/api-docs');
};

export default setupSwaggerDocs;
