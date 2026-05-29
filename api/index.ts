import { app } from "./src/app.ts";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.SERVER_PORT;

app.listen(port, () => {
  console.log(`app listening on port http://localhost:${port}`);
});