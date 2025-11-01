const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AuditoriumType = sequelize.define(
  "AuditoriumType",
  {
    AUDITORIUM_TYPE: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
    },
    AUDITORIUM_TYPENAME: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "AUDITORIUM_TYPE",
    timestamps: false,
  }
);

module.exports = AuditoriumType;
