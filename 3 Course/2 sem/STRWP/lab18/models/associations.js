const Faculty = require("./Faculty");
const Pulpit = require("./Pulpit");
const Teacher = require("./Teacher");
const Subject = require("./Subject");
const AuditoriumType = require("./AuditoriumType");
const Auditorium = require("./Auditorium");

// Связи Факультет <-> Кафедра (Один-Ко-Многим)
Faculty.hasMany(Pulpit, {
  foreignKey: "FACULTY",
  sourceKey: "FACULTY",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Pulpit.belongsTo(Faculty, { foreignKey: "FACULTY", targetKey: "FACULTY" });

// Связи Кафедра <-> Преподаватель (Один-Ко-Многим)
Pulpit.hasMany(Teacher, {
  foreignKey: "PULPIT",
  sourceKey: "PULPIT",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Teacher.belongsTo(Pulpit, { foreignKey: "PULPIT", targetKey: "PULPIT" });

// Связи Кафедра <-> Дисциплина (Один-Ко-Многим)
Pulpit.hasMany(Subject, {
  foreignKey: "PULPIT",
  sourceKey: "PULPIT",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Subject.belongsTo(Pulpit, { foreignKey: "PULPIT", targetKey: "PULPIT" });

// Связи Тип Аудитории <-> Аудитория (Один-Ко-Многим)
AuditoriumType.hasMany(Auditorium, {
  foreignKey: "AUDITORIUM_TYPE",
  sourceKey: "AUDITORIUM_TYPE",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Auditorium.belongsTo(AuditoriumType, {
  foreignKey: "AUDITORIUM_TYPE",
  targetKey: "AUDITORIUM_TYPE",
});

console.log("Sequelize associations defined."); // Для проверки, что код выполнился
