const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Pulpit = require("./Pulpit");

const Subject = sequelize.define(
  "Subject",
  {
    SUBJECT: {
      type: DataTypes.STRING(10),
      primaryKey: true,
      allowNull: false,
    },
    SUBJECT_NAME: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    PULPIT: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
  },
  {
    tableName: "SUBJECT",
    timestamps: false,
  }
);

module.exports = Subject;
