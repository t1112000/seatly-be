require('dotenv').config();
const schemaConfig = process.env.SCHEMA_NAME;

const baseConfig = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_MASTER_HOST || process.env.DB_HOST,
  port: +process.env.DB_PORT || 5432,
  dialect: 'postgres',
  schema: schemaConfig,
  migrationStorageTableSchema: schemaConfig,
  dialectOptions: process.env.DB_SSL_REQUIRED
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : undefined,
};

module.exports = {
  development: baseConfig,
  production: baseConfig,
};
