import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const jourPlus = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

const CATEGORIES = [
  "Savons",
  "Shampoings",
  "Hygiène bucco-dentaire",
  "Papier hygiénique",
  "Désinfection",
  "Entretien",
];

// cartons : stock initial au dépôt. Deux produits démarrent SOUS leur seuil (alertes).
const PRODUITS = [
  { reference: "SAV-001", nom: "Savon 100g", categorie: "Savons", prix: 1.5, piecesParCarton: 24, seuilMin: 48, cartons: 40 },
  { reference: "SAV-002", nom: "Savon 50g", categorie: "Savons", prix: 1.0, piecesParCarton: 20, seuilMin: 40, cartons: 30 },
  { reference: "SAV-003", nom: "Savon liquide 500 ml", categorie: "Savons", prix: 3.2, piecesParCarton: 12, seuilMin: 60, cartons: 25 },
  { reference: "SHA-001", nom: "Shampoing 250 ml", categorie: "Shampoings", prix: 2.8, piecesParCarton: 12, seuilMin: 60, cartons: 30 },
  { reference: "SHA-002", nom: "Shampoing 400 ml", categorie: "Shampoings", prix: 3.9, piecesParCarton: 12, seuilMin: 48, cartons: 20 },
  { reference: "SHA-003", nom: "Après-shampoing 250 ml", categorie: "Shampoings", prix: 3.1, piecesParCarton: 12, seuilMin: 48, cartons: 18 },
  { reference: "DEN-001", nom: "Dentifrice 75 ml", categorie: "Hygiène bucco-dentaire", prix: 1.6, piecesParCarton: 24, seuilMin: 96, cartons: 35 },
  { reference: "DEN-002", nom: "Brosse à dents", categorie: "Hygiène bucco-dentaire", prix: 0.9, piecesParCarton: 48, seuilMin: 96, cartons: 20 },
  { reference: "DEN-003", nom: "Bain de bouche 250 ml", categorie: "Hygiène bucco-dentaire", prix: 2.5, piecesParCarton: 12, seuilMin: 96, cartons: 5 },
  { reference: "PAP-001", nom: "Papier toilette x6", categorie: "Papier hygiénique", prix: 2.4, piecesParCarton: 8, seuilMin: 40, cartons: 40 },
  { reference: "PAP-002", nom: "Papier toilette x12", categorie: "Papier hygiénique", prix: 4.6, piecesParCarton: 6, seuilMin: 36, cartons: 28 },
  { reference: "PAP-003", nom: "Mouchoirs x10", categorie: "Papier hygiénique", prix: 0.5, piecesParCarton: 60, seuilMin: 120, cartons: 15 },
  { reference: "PAP-004", nom: "Essuie-tout rouleau", categorie: "Papier hygiénique", prix: 1.8, piecesParCarton: 12, seuilMin: 60, cartons: 3 },
  { reference: "DES-001", nom: "Gel hydroalcoolique 500 ml", categorie: "Désinfection", prix: 4.9, piecesParCarton: 24, seuilMin: 48, cartons: 22, peremption: "2027-09-30" },
  { reference: "DES-002", nom: "Lingettes désinfectantes", categorie: "Désinfection", prix: 2.2, piecesParCarton: 24, seuilMin: 48, cartons: 16, peremption: "2027-03-31" },
  { reference: "ENT-001", nom: "Nettoyant multi-surfaces 1 L", categorie: "Entretien", prix: 2.6, piecesParCarton: 12, seuilMin: 48, cartons: 24 },
  { reference: "ENT-002", nom: "Eau de Javel 1 L", categorie: "Entretien", prix: 1.2, piecesParCarton: 12, seuilMin: 48, cartons: 30 },
];

const SECTEURS = [
  { nom: "Centre-ville", ville: "Tunis" },
  { nom: "Cité Ennasr", ville: "Ariana" },
  { nom: "Ben Arous Centre", ville: "Ben Arous" },
  { nom: "La Marsa", ville: "La Marsa" },
];

const CLIENTS = [
  { secteur: "Centre-ville", nomCommerce: "Épicerie El Baraka", responsable: "Mohamed Trabelsi", telephone: "20 111 001", adresse: "12 rue de Marseille" },
  { secteur: "Centre-ville", nomCommerce: "Supérette Médina", responsable: "Sana Ben Ali", telephone: "22 222 002", adresse: "5 avenue Habib Bourguiba" },
  { secteur: "Centre-ville", nomCommerce: "Grossiste Ben Salah", responsable: "Slim Ben Salah", telephone: "98 333 003", adresse: "Rue Charles de Gaulle" },
  { secteur: "Centre-ville", nomCommerce: "Mini-market Le Passage", responsable: "Rim Gharbi", telephone: "55 444 004", adresse: "8 rue de Palestine" },
  { secteur: "Cité Ennasr", nomCommerce: "Supérette Ennasr", responsable: "Hichem Jlassi", telephone: "21 555 005", adresse: "Avenue Hédi Nouira" },
  { secteur: "Cité Ennasr", nomCommerce: "Épicerie Chez Ali", responsable: "Ali Mejri", telephone: "23 666 006", adresse: "Rue de l'Environnement" },
  { secteur: "Cité Ennasr", nomCommerce: "Supermarché Le Parc", responsable: "Nadia Karoui", telephone: "50 777 007", adresse: "Boulevard de la Terre" },
  { secteur: "Ben Arous Centre", nomCommerce: "Grossiste Hammami", responsable: "Fares Hammami", telephone: "97 888 008", adresse: "Route de Radès" },
  { secteur: "Ben Arous Centre", nomCommerce: "Épicerie Es-Salam", responsable: "Leila Dridi", telephone: "24 999 009", adresse: "Rue de la République" },
  { secteur: "Ben Arous Centre", nomCommerce: "Supérette Mourouj", responsable: "Anis Bouzid", telephone: "52 101 010", adresse: "Cité El Mourouj" },
  { secteur: "La Marsa", nomCommerce: "Épicerie Corniche", responsable: "Yosra Mansour", telephone: "29 202 011", adresse: "Avenue Taïeb Mhiri" },
  { secteur: "La Marsa", nomCommerce: "Supérette Gammarth", responsable: "Walid Chaabane", telephone: "53 303 012", adresse: "Route de Gammarth" },
  { secteur: "La Marsa", nomCommerce: "Épicerie Safsaf", responsable: "Mouna Zouari", telephone: "25 404 013", adresse: "Rue Safsaf" },
];

const magasinier = await prisma.utilisateur.findUnique({ where: { identifiant: "magasinier" } });
if (!magasinier) {
  throw new Error("Compte magasinier introuvable : lancez d'abord  node prisma/seed.mjs");
}

// Catégories
const catId = {};
for (const nom of CATEGORIES) {
  const c = await prisma.categorie.upsert({ where: { nom }, update: {}, create: { nom } });
  catId[nom] = c.id;
}

// Produits + stock initial (seulement pour les produits qui n'existent pas encore)
let nbProduits = 0;
for (const p of PRODUITS) {
  const existe = await prisma.produit.findUnique({ where: { reference: p.reference } });
  if (existe) continue;
  const produit = await prisma.produit.create({
    data: {
      reference: p.reference,
      nom: p.nom,
      prix: p.prix,
      piecesParCarton: p.piecesParCarton,
      seuilMin: p.seuilMin,
      datePeremption: p.peremption ? new Date(p.peremption) : null,
      categorieId: catId[p.categorie],
    },
  });
  await prisma.mouvementStock.create({
    data: {
      type: "ENTREE_FOURNISSEUR",
      variationPieces: p.cartons * p.piecesParCarton,
      reference: "STOCK-DEMO",
      motif: "Stock initial de démonstration",
      produitId: produit.id,
      auteurId: magasinier.id,
    },
  });
  nbProduits++;
}

// Secteurs
const secteurs = [];
for (const s of SECTEURS) {
  secteurs.push(
    await prisma.secteur.upsert({
      where: { nom_ville: { nom: s.nom, ville: s.ville } },
      update: {},
      create: s,
    })
  );
}
const secteurParNom = Object.fromEntries(secteurs.map((s) => [s.nom, s]));

// Clients
let nbClients = 0;
for (const c of CLIENTS) {
  const secteur = secteurParNom[c.secteur];
  const existe = await prisma.client.findFirst({
    where: { nomCommerce: c.nomCommerce, secteurId: secteur.id },
  });
  if (existe) continue;
  await prisma.client.create({
    data: {
      nomCommerce: c.nomCommerce,
      responsable: c.responsable,
      telephone: c.telephone,
      adresse: c.adresse,
      secteurId: secteur.id,
    },
  });
  nbClients++;
}

// Planning : 14 jours, chaque livreur a un secteur différent chaque jour.
// Les affectations déjà existantes ne sont pas modifiées.
const livreurs = await prisma.utilisateur.findMany({
  where: { role: "LIVREUR", actif: true },
  orderBy: { id: "asc" },
});
let nbAffectations = 0;
for (let i = 0; i < 14; i++) {
  const jour = jourPlus(i);
  for (const [k, l] of livreurs.entries()) {
    const secteur = secteurs[(i + k) % secteurs.length];
    const deja = await prisma.affectation.findUnique({
      where: { livreurId_jour: { livreurId: l.id, jour } },
    });
    if (deja) continue;
    await prisma.affectation.create({
      data: { livreurId: l.id, secteurId: secteur.id, jour },
    });
    nbAffectations++;
  }
}

console.log(`Produits ajoutés : ${nbProduits}`);
console.log(`Secteurs : ${secteurs.length}`);
console.log(`Clients ajoutés : ${nbClients}`);
console.log(`Affectations ajoutées : ${nbAffectations} (${livreurs.length} livreurs × 14 jours)`);

await prisma.$disconnect();