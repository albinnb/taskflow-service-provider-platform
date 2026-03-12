import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the OpenAPI YAML spec
// Resolving Path relative to this file's execution (src/config) up one directory
const swaggerDocument = YAML.load(path.join(__dirname, '../../swagger.yaml'));

/**
 * Attaches the Swagger UI to the provided Express app
 * @param {import('express').Application} app 
 */
export const setupSwagger = (app) => {
    // Custom options to make the UI look slightly better
    const options = {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'TaskFlow API Docs',
    };

    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
};
