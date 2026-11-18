-- CreateTable
CREATE TABLE "Camion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "immatriculation" TEXT NOT NULL,
    "livreurId" INTEGER,
    CONSTRAINT "Camion_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonChargement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jour" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "commentaire" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "envoyeLe" DATETIME,
    "controleLe" DATETIME,
    "valideLe" DATETIME,
    "chargeLe" DATETIME,
    "livreurId" INTEGER NOT NULL,
    "controleParId" INTEGER,
    "valideParId" INTEGER,
    CONSTRAINT "BonChargement_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonChargement_controleParId_fkey" FOREIGN KEY ("controleParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BonChargement_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneChargement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantiteDemandee" INTEGER NOT NULL,
    "quantiteAccordee" INTEGER,
    "decision" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "motif" TEXT,
    "bonId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    CONSTRAINT "LigneChargement_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonChargement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneChargement_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jour" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "livreurId" INTEGER NOT NULL,
    "camionId" INTEGER NOT NULL,
    "secteurId" INTEGER NOT NULL,
    "bonId" INTEGER NOT NULL,
    CONSTRAINT "Tournee_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tournee_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tournee_secteurId_fkey" FOREIGN KEY ("secteurId") REFERENCES "Secteur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tournee_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonChargement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MouvementStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "variationPieces" INTEGER NOT NULL,
    "reference" TEXT,
    "motif" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produitId" INTEGER NOT NULL,
    "auteurId" INTEGER NOT NULL,
    "camionId" INTEGER,
    "bonId" INTEGER,
    CONSTRAINT "MouvementStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonChargement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MouvementStock" ("auteurId", "creeLe", "id", "motif", "produitId", "reference", "type", "variationPieces") SELECT "auteurId", "creeLe", "id", "motif", "produitId", "reference", "type", "variationPieces" FROM "MouvementStock";
DROP TABLE "MouvementStock";
ALTER TABLE "new_MouvementStock" RENAME TO "MouvementStock";
CREATE INDEX "MouvementStock_produitId_idx" ON "MouvementStock"("produitId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Camion_immatriculation_key" ON "Camion"("immatriculation");

-- CreateIndex
CREATE UNIQUE INDEX "Camion_livreurId_key" ON "Camion"("livreurId");

-- CreateIndex
CREATE INDEX "BonChargement_statut_idx" ON "BonChargement"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "BonChargement_livreurId_jour_key" ON "BonChargement"("livreurId", "jour");

-- CreateIndex
CREATE UNIQUE INDEX "LigneChargement_bonId_produitId_key" ON "LigneChargement"("bonId", "produitId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournee_bonId_key" ON "Tournee"("bonId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournee_livreurId_jour_key" ON "Tournee"("livreurId", "jour");
