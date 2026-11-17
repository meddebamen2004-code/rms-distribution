-- CreateTable
CREATE TABLE "Secteur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomCommerce" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "secteurId" INTEGER NOT NULL,
    CONSTRAINT "Client_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "Secteur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Affectation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jour" TEXT NOT NULL,
    "livreurId" INTEGER NOT NULL,
    "secteurId" INTEGER NOT NULL,
    CONSTRAINT "Affectation_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Affectation_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "Secteur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Secteur_nom_ville_key" ON "Secteur"("nom", "ville");

-- CreateIndex
CREATE INDEX "Client_secteurId_idx" ON "Client"("secteurId");

-- CreateIndex
CREATE UNIQUE INDEX "Affectation_livreurId_jour_key" ON "Affectation"("livreurId", "jour");
