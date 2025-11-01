const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Pulpit = require("./Pulpit");

const Teacher = sequelize.define(
  "Teacher",
  {
    TEACHER: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
    },
    TEACHER_NAME: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    PULPIT: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
  },
  {
    tableName: "TEACHER",
    timestamps: false,
  }
);

module.exports = Teacher;
