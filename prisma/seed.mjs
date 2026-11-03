import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const comptes = [
  { nom: "Gérant Démo", identifiant: "gerant", motDePasse: "gerant1234", role: "GERANT" },
  { nom: "Magasinier Démo", identifiant: "magasinier", motDePasse: "magasin1234", role: "MAGASINIER" },
  { nom: "Karim", identifiant: "karim", motDePasse: "livreur1234", role: "LIVREUR" },
];

for (const c of comptes) {
  await prisma.utilisateur.upsert({
    where: { identifiant: c.identifiant },
    update: {}, // ne modifie pas un compte existant
    create: {
      nom: c.nom,
      identifiant: c.identifiant,
      motDePasseHash: await bcrypt.hash(c.motDePasse, 10),
      role: c.role,
    },
  });
  console.log(`OK : ${c.identifiant} (${c.role})`);
}
const categories = ["Savons", "Shampoings", "Hygiène bucco-dentaire", "Papier hygiénique"];
for (const nom of categories) {
  await prisma.categorie.upsert({ where: { nom }, update: {}, create: { nom } });
  console.log(`OK : catégorie ${nom}`);
}
await prisma.$disconnect();
