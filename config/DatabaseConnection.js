var mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "wow_pets",
  port: "3306",
});

// var db = mysql.createConnection({
//   host: "localhost",
//   user: "wowpbwxi_pet_user",
//   password: "a02t,Gxs#hsU",
// database: "wowpbwxi_pets_test",
// });

db.connect(function (err) {
  if (err) {
    console.log(err, "Error in database");
  } else {
    console.log("MySQL Database Connected Successfully");
  }
});

module.exports = db;
