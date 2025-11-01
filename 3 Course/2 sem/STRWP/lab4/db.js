const util = require("util");
const ee = require("events");

let db_data = [
  { id: 1, name: "Родионов Даниил", bday: "2002-08-06" },
  { id: 2, name: "Алешина Екатерина", bday: "2001-03-30" },
  { id: 3, name: "Денисова Мария", bday: "2003-11-04" },
  { id: 4, name: "Панин Василий", bday: "1990-12-05" },
];

function DB() {
  this.getIndex = () => {
    return db_data.length ? Math.max(...db_data.map((item) => item.id)) + 1 : 1;
  };

  this.select = () => {
    return db_data.filter((item) => item.name !== "" && item.bday !== "");
  };

  this.insert = (row) => {
    console.log("Добавление:", row);
    if (row.name.trim() === "" || row.bday.trim() === "") {
      return JSON.parse('{"Ошибка": "Невозможно добавить пустые данные"}');
    }
    row.id = this.getIndex();
    db_data.push(row);
    return row;
  };

  this.update = (row) => {
    console.log("Обновление:", row);
    let id = parseInt(row.id);
    let index = db_data.findIndex((el) => el.id === id);
    if (index === -1) return JSON.parse('{"Ошибка": "id не найден"}');
    db_data[index] = row;
    return row;
  };

  this.delete = (id) => {
    console.log("Удаление:", id);
    let idInt = parseInt(id);
    let index = db_data.findIndex((el) => el.id === idInt);
    if (index === -1) return JSON.parse('{"Ошибка": "id не найден"}');
    let del_row = db_data[index];
    db_data.splice(index, 1);
    db_data.forEach((item, idx) => (item.id = idx + 1));
    return del_row;
  };
}

util.inherits(DB, ee.EventEmitter);
exports.DB = DB;
