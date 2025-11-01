const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Faculty = sequelize.define(
  "Faculty",
  {
    FACULTY: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
    },
    FACULTY_NAME: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "FACULTY",
    timestamps: false,
  }
);

module.exports = Faculty;
