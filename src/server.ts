import { app } from "./app";
import { sequelize } from "./config/database";

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.authenticate();
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}

start();
