const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Faculty = require("./Faculty");

const Pulpit = sequelize.define(
  "Pulpit",
  {
    PULPIT: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
    },
    PULPIT_NAME: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    FACULTY: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
  },
  {
    tableName: "PULPIT",
    timestamps: false,
  }
);

module.exports = Pulpit;
