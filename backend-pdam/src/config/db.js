import mysql from "mysql2/promise";
console.log('[✓] MySQL2 promise loaded');

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "pdam_app",
});

// const db = mysql.createPool({
//   host: "tirtowening.my.id",
//   user: "tirtowen_rhinno",
//   password: "0P1s!(-UWRWxx1V}",
//   database: "tirtowen_pdam_app",
// });

console.log('[✓] Database pool created - localhost:pdam_app');

export default db;