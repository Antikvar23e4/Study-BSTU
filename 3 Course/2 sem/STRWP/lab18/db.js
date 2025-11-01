const { Sequelize } = require("sequelize");

const dbName = "NAV";
const dbUser = "sa";
const dbPassword = "a292692233";
const dbHost = "DESKTOP-IB5TTO9\\PC";

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: "mssql",
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: false,
  },
});

module.exports = sequelize;
