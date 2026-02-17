import "./config/env";

import app from "./app";
import { testDbConnection } from "./db";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testDbConnection();
});
