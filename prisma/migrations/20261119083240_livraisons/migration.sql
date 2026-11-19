-- CreateTable
CREATE TABLE "Livraison" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dateHeure" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "annulee" BOOLEAN NOT NULL DEFAULT false,
    "annuleeLe" DATETIME,
    "tourneeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    CONSTRAINT "Livraison_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Livraison_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneLivraison" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantiteLivree" INTEGER NOT NULL DEFAULT 0,
    "quantiteRetour" INTEGER NOT NULL DEFAULT 0,
    "motifRetour" TEXT,
    "livraisonId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    CONSTRAINT "LigneLivraison_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneLivraison_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "livraisonId" INTEGER,
    CONSTRAINT "MouvementStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonChargement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MouvementStock" ("auteurId", "bonId", "camionId", "creeLe", "id", "motif", "produitId", "reference", "type", "variationPieces") SELECT "auteurId", "bonId", "camionId", "creeLe", "id", "motif", "produitId", "reference", "type", "variationPieces" FROM "MouvementStock";
DROP TABLE "MouvementStock";
ALTER TABLE "new_MouvementStock" RENAME TO "MouvementStock";
CREATE INDEX "MouvementStock_produitId_idx" ON "MouvementStock"("produitId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Livraison_tourneeId_idx" ON "Livraison"("tourneeId");

-- CreateIndex
CREATE INDEX "Livraison_clientId_idx" ON "Livraison"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "LigneLivraison_livraisonId_produitId_key" ON "LigneLivraison"("livraisonId", "produitId");
