
const express = require("express"); 
const app = require("./app");
const connectDatabase = require("./db/Database");


// Handle uncaught exceptions
process.on("unhandledException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
});


//config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// connect db
connectDatabase().then(() => {
    
})


// create server
const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT}`
  );
});

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandled promise rejection `);

  server.close(() => {
    process.exit(1);
  });
});



