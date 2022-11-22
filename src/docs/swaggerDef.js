const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Skeding API documentation',
    version,
    license: {
      name: 'MIT',
      url: 'https://github.com/Genus-Tech/Skeding-Backend/tree/dev',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/v1`,
      url: `https://skeding.eu/api/v1`,
    },
  ],
};

module.exports = swaggerDef;
