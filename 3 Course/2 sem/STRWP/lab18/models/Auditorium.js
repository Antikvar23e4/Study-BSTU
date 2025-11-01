const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const AuditoriumType = require("./AuditoriumType");

const Auditorium = sequelize.define(
  "Auditorium",
  {
    AUDITORIUM: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
    },
    AUDITORIUM_NAME: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    AUDITORIUM_CAPACITY: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    AUDITORIUM_TYPE: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
  },
  {
    tableName: "AUDITORIUM",
    timestamps: false,
  }
);

module.exports = Auditorium;
