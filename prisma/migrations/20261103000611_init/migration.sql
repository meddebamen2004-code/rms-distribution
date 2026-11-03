-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "identifiant" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "tentativesEchouees" INTEGER NOT NULL DEFAULT 0,
    "bloqueJusqua" DATETIME,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_identifiant_key" ON "Utilisateur"("identifiant");
