import "dotenv/config";
import { app } from "./src/app.ts";

const port = process.env.SERVER_PORT ?? "3000";

if (!process.env.DATABASE_URL) {
  console.error(
    "[API] DATABASE_URL est manquant. Crée un fichier api/.env (voir api/.env.example).",
  );
}

app.listen(port, () => {
  console.log(`app listening on port http://localhost:${port}`);
});
