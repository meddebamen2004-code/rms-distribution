param(
  [int]$ProduitId = 1,
  [int]$SecteurId = 1
)

$base = "http://localhost:3000"

function Connexion($identifiant, $motDePasse) {
  $body = @{ identifiant = $identifiant; motDePasse = $motDePasse } | ConvertTo-Json
  $r = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$base/api/auth/login" `
    -ContentType "application/json" -Body $body -SessionVariable s
  return @{ Session = $s; User = ($r.Content | ConvertFrom-Json) }
}

function Appel($methode, $chemin, $qui, $corps = $null) {
  $p = @{
    UseBasicParsing = $true
    Method          = $methode
    Uri             = "$base$chemin"
    WebSession      = $qui.Session
    ContentType     = "application/json"
  }
  if ($null -ne $corps) { $p.Body = ($corps | ConvertTo-Json -Depth 6) }
  try {
    $r = Invoke-WebRequest @p
    return @{ Status = [int]$r.StatusCode; Data = ($r.Content | ConvertFrom-Json) }
  } catch {
    $code = [int]$_.Exception.Response.StatusCode
    $msg = $_.ErrorDetails.Message
    if (-not $msg -and $_.Exception.Response) {
      $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
      $msg = $reader.ReadToEnd()
    }
    try { $msg = ($msg | ConvertFrom-Json).error } catch {}
    return @{ Status = $code; Data = $msg }
  }
}

function Verifier($nom, $attendu, $res) {
  if ($res.Status -eq $attendu) {
    Write-Host "OK    $nom" -ForegroundColor Green
  } else {
    Write-Host "ECHEC $nom (attendu $attendu, reçu $($res.Status) : $($res.Data))" -ForegroundColor Red
  }
}

$gerant = Connexion "gerant" "gerant1234"
$magasinier = Connexion "magasinier" "magasin1234"
$karim = Connexion "karim" "livreur1234"
Write-Host "Connexions réussies`n"

# --- Préparation : du stock au dépôt ---
Verifier "Réception de 5 cartons" 201 (Appel "POST" "/api/receptions" $magasinier @{
  reference = "TEST-RECHARGE"
  lignes = @(@{ produitId = $ProduitId; cartons = 5; pieces = 0 })
})

# --- Le livreur prépare son bon (premier jour sans bon) ---
$bon = $null
for ($d = 1; $d -le 60; $d++) {
  $jour = (Get-Date).AddDays($d).ToString("yyyy-MM-dd")
  $res = Appel "POST" "/api/bons" $karim @{
    jour = $jour; envoyer = $false
    lignes = @(@{ produitId = $ProduitId; cartons = 1; pieces = 0 })
  }
  if ($res.Status -eq 201) { $bon = $res.Data; break }
  # 409 = un bon existe déjà ce jour-là : on essaie le jour suivant. Autre code : on s'arrête.
  if ($res.Status -ne 409) { break }
}
if (-not $bon) {
  Write-Host "Impossible de créer un bon : code $($res.Status), message : $($res.Data)" -ForegroundColor Red
  exit 1
}
Write-Host "OK    Bon créé pour le $jour (id $($bon.id))" -ForegroundColor Green

Verifier "Secteur affecté au livreur ce jour-là" 200 (Appel "PUT" "/api/affectations" $gerant @{
  livreurId = $karim.User.id; secteurId = $SecteurId; jour = $jour
})

Verifier "Deuxième bon le même jour refusé" 409 (Appel "POST" "/api/bons" $karim @{
  jour = $jour; lignes = @(@{ produitId = $ProduitId; cartons = 1; pieces = 0 })
})
Verifier "Quantité supérieure au stock bloquée" 400 (Appel "PUT" "/api/bons/$($bon.id)" $karim @{
  envoyer = $false; lignes = @(@{ produitId = $ProduitId; cartons = 9999; pieces = 0 })
})

# --- Le livreur corrige puis envoie ---
$res = Appel "PUT" "/api/bons/$($bon.id)" $karim @{
  envoyer = $true; lignes = @(@{ produitId = $ProduitId; cartons = 2; pieces = 0 })
}
Verifier "Livreur corrige et envoie le bon" 200 $res
$ligneId = $res.Data.lignes[0].id
Verifier "Bon envoyé : plus modifiable" 409 (Appel "PUT" "/api/bons/$($bon.id)" $karim @{
  envoyer = $false; lignes = @(@{ produitId = $ProduitId; cartons = 1; pieces = 0 })
})

# --- Le magasinier contrôle ligne par ligne ---
Verifier "Rejet sans motif refusé" 400 (Appel "PATCH" "/api/bons/$($bon.id)/lignes/$ligneId" $magasinier @{ decision = "REJETEE" })
Verifier "Soumission avec ligne non traitée refusée" 409 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "SOUMETTRE" })
Verifier "Magasinier accepte la ligne" 200 (Appel "PATCH" "/api/bons/$($bon.id)/lignes/$ligneId" $magasinier @{ decision = "ACCEPTEE" })
Verifier "Livreur ne peut pas soumettre" 403 (Appel "PATCH" "/api/bons/$($bon.id)" $karim @{ action = "SOUMETTRE" })
Verifier "Magasinier soumet au gérant" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "SOUMETTRE" })

# --- Le gérant décide en dernier ---
Verifier "Magasinier ne peut pas valider" 403 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "VALIDER" })
Verifier "Renvoi sans commentaire refusé" 400 (Appel "PATCH" "/api/bons/$($bon.id)" $gerant @{ action = "RENVOYER" })
Verifier "Gérant valide le bon" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $gerant @{ action = "VALIDER" })

# --- Chargement : le stock passe du dépôt au camion ---
Verifier "Magasinier confirme le chargement" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "CHARGER" })
Verifier "Bon chargé : modification impossible (T7)" 409 (Appel "PUT" "/api/bons/$($bon.id)" $karim @{
  envoyer = $false; lignes = @(@{ produitId = $ProduitId; cartons = 1; pieces = 0 })
})
Verifier "Double chargement refusé" 409 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "CHARGER" })

Write-Host "`nTerminé. Vérifie dans Prisma Studio : BonChargement (statut CHARGE), MouvementStock (2 lignes CHARGEMENT), Tournee (1 ligne)."