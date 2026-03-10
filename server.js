require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const routes = require("./src/routes/index");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Banco EasyIce Conectado!"))
  .catch((err) => console.error("❌ Erro no Banco:", err));


app.use("/api", routes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor V2 rodando em http://localhost:${PORT}`);
});
