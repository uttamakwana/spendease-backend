import dotenv from "dotenv";
import { app } from "./app.js";
import { connectToDb } from "./db/database.js";

// configurations
dotenv.config();

// constants
const PORT = Number(process.env.PORT) || 3000;

// does: connect to the database and start listening to the server
connectToDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server started on PORT:", PORT);
    });
  })
  .catch(() => {
    console.log("Failed to connect to the server!");
  });
