-- AlterTable
ALTER TABLE "Tournee" ADD COLUMN "clotureeLe" DATETIME;
ALTER TABLE "Tournee" ADD COLUMN "verifieLe" DATETIME;

-- CreateTable
CREATE TABLE "EcartTournee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantiteTheorique" INTEGER NOT NULL,
    "quantiteReelle" INTEGER NOT NULL,
    "motif" TEXT NOT NULL,
    "commentaire" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "commentaireGerant" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decideLe" DATETIME,
    "tourneeId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    "decideParId" INTEGER,
    CONSTRAINT "EcartTournee_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EcartTournee_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EcartTournee_decideParId_fkey" FOREIGN KEY ("decideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "tourneeId" INTEGER,
    CONSTRAINT "MouvementStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_tourneeId_fkey" FOREIGN KEY ("tourneeId") REFERENCES "Tournee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MouvementStock_bonId_fkey" FOREIGN KEY ("bonId") REFERENCES "BonChargement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MouvementStock" ("auteurId", "bonId", "camionId", "creeLe", "id", "livraisonId", "motif", "produitId", "reference", "type", "variationPieces") SELECT "auteurId", "bonId", "camionId", "creeLe", "id", "livraisonId", "motif", "produitId", "reference", "type", "variationPieces" FROM "MouvementStock";
DROP TABLE "MouvementStock";
ALTER TABLE "new_MouvementStock" RENAME TO "MouvementStock";
CREATE INDEX "MouvementStock_produitId_idx" ON "MouvementStock"("produitId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EcartTournee_tourneeId_produitId_key" ON "EcartTournee"("tourneeId", "produitId");
