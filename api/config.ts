//configuration layer : sert à centraliser toutes les variables de configuration de l'application

export const config = {
  port: parseInt(process.env.PORT || "3000"),
  allowedOrigin: getSafe(process.env.ALLOWED_ORIGIN, "ALLOWED_ORIGIN"),
  jwtSecret: getSafe(process.env.JWT_SECRET, "JWT_SECRET")
};

// Fonction qui nous prévient lorsqu'en production, on oublie de mettre une variable d'environnement dans le .env
function getSafe(variable: unknown, variableName: string) {
  if (typeof variable !== "string") {
    throw new Error(`Missing environment variable: ${variableName}`);
  }
  return variable;
}