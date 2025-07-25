// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./stores.db'); // 파일 자동 생성됨

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    rating REAL
  )`);
});

module.exports = db;
