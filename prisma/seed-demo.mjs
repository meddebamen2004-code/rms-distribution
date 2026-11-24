import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- Secteurs ---
const secteursData = [
  { nom: "Cité Ennasr", ville: "Tunis" },
  { nom: "El Menzah", ville: "Tunis" },
];
const secteurs = [];
for (const s of secteursData) {
  const sec = await prisma.secteur.upsert({
    where: { nom_ville: s },
    update: {},
    create: s,
  });
  secteurs.push(sec);
  console.log(`OK : secteur ${sec.nom} (id ${sec.id})`);
}

// --- Clients (2 par secteur) ---
const clientsData = [
  { nomCommerce: "Épicerie Ben Ali", responsable: "Ali Ben Ali", telephone: "20111222", adresse: "12 rue de la Liberté", secteur: 0 },
  { nomCommerce: "Superette Najah", responsable: "Najah Trabelsi", telephone: "20333444", adresse: "5 avenue Habib Bourguiba", secteur: 0 },
  { nomCommerce: "Mini Market Salma", responsable: "Salma Gharbi", telephone: "20555666", adresse: "8 rue des Jasmins", secteur: 1 },
  { nomCommerce: "Alimentation Chaabane", responsable: "Omar Chaabane", telephone: "20777888", adresse: "21 rue de Carthage", secteur: 1 },
];
for (const c of clientsData) {
  const existant = await prisma.client.findFirst({ where: { nomCommerce: c.nomCommerce } });
  if (existant) {
    console.log(`Déjà là : client ${c.nomCommerce} (id ${existant.id})`);
    continue;
  }
  const cl = await prisma.client.create({
    data: {
      nomCommerce: c.nomCommerce,
      responsable: c.responsable,
      telephone: c.telephone,
      adresse: c.adresse,
      secteurId: secteurs[c.secteur].id,
    },
  });
  console.log(`OK : client ${cl.nomCommerce} (id ${cl.id}, secteur ${secteurs[c.secteur].nom})`);
}

// --- Produits ---
const categories = await prisma.categorie.findMany();
const cat = (nom) => categories.find((c) => c.nom === nom);

const produitsData = [
  { reference: "SAV-001", nom: "Savon de Marseille 100g", prix: 1.2, piecesParCarton: 48, seuilMin: 48, categorie: "Savons" },
  { reference: "SHA-001", nom: "Shampoing 250ml", prix: 4.5, piecesParCarton: 24, seuilMin: 24, categorie: "Shampoings" },
  { reference: "DEN-001", nom: "Dentifrice 75ml", prix: 3.0, piecesParCarton: 36, seuilMin: 36, categorie: "Hygiène bucco-dentaire" },
  { reference: "PAP-001", nom: "Papier hygiénique x6", prix: 5.8, piecesParCarton: 12, seuilMin: 12, categorie: "Papier hygiénique" },
];

const magasinier = await prisma.utilisateur.findUnique({ where: { identifiant: "magasinier" } });
if (!magasinier) throw new Error("Compte magasinier introuvable : lancez d'abord node prisma/seed.mjs");

for (const p of produitsData) {
  const categorie = cat(p.categorie);
  if (!categorie) throw new Error(`Catégorie introuvable : ${p.categorie} (lancez node prisma/seed.mjs)`);
  const produit = await prisma.produit.upsert({
    where: { reference: p.reference },
    update: {},
    create: {
      reference: p.reference,
      nom: p.nom,
      prix: p.prix,
      piecesParCarton: p.piecesParCarton,
      seuilMin: p.seuilMin,
      categorieId: categorie.id,
    },
  });
  console.log(`OK : produit ${produit.nom} (id ${produit.id})`);

  // Stock initial au dépôt : 20 cartons, seulement si aucun mouvement n'existe pour ce produit.
  const deja = await prisma.mouvementStock.count({ where: { produitId: produit.id } });
  if (deja === 0) {
    await prisma.mouvementStock.create({
      data: {
        type: "ENTREE_FOURNISSEUR",
        variationPieces: 20 * p.piecesParCarton,
        reference: "DEMO-STOCK-INITIAL",
        produitId: produit.id,
        auteurId: magasinier.id,
      },
    });
    console.log(`   stock ajouté : ${20 * p.piecesParCarton} pièces`);
  }
}

await prisma.$disconnect();
console.log("\nTerminé.");