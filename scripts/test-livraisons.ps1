param(
  [string]$Livreur = "sofia",
  [int]$ProduitId = 1,
  [int]$SecteurId = 1,
  [int]$ClientId = 1,          # un client du secteur SecteurId
  [int]$AutreClientId = 0,     # (facultatif) un client d'un AUTRE secteur
  [string]$AutreLivreur = ""   # (facultatif) un livreur sans tournée aujourd'hui
)

$base = "http://localhost:3000"
$jour = (Get-Date).ToString("yyyy-MM-dd")

function Connexion($identifiant, $motDePasse) {
  $body = @{ identifiant = $identifiant; motDePasse = $motDePasse } | ConvertTo-Json
  $r = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$base/api/auth/login" `
    -ContentType "application/json" -Body $body -SessionVariable s
  return @{ Session = $s; User = ($r.Content | ConvertFrom-Json) }
}

function Appel($methode, $chemin, $qui, $corps = $null) {
  $p = @{
    UseBasicParsing = $true; Method = $methode; Uri = "$base$chemin"
    WebSession = $qui.Session; ContentType = "application/json"
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
    if ($msg) { try { $msg = ($msg | ConvertFrom-Json).error } catch {} }
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
$moi = Connexion $Livreur "livreur1234"
Write-Host "Connexions réussies ($Livreur, jour $jour)`n"

# --- Préparation : stock au dépôt, secteur du jour, bon pour aujourd'hui ---
Verifier "Réception de 5 cartons" 201 (Appel "POST" "/api/receptions" $magasinier @{
  reference = "TEST-LIVRAISON"
  lignes = @(@{ produitId = $ProduitId; cartons = 5; pieces = 0 })
})
Verifier "Secteur affecté au livreur aujourd'hui" 200 (Appel "PUT" "/api/affectations" $gerant @{
  livreurId = $moi.User.id; secteurId = $SecteurId; jour = $jour
})

$res = Appel "POST" "/api/bons" $moi @{
  jour = $jour; envoyer = $true
  lignes = @(@{ produitId = $ProduitId; cartons = 2; pieces = 0 })
}
if ($res.Status -ne 201) {
  Write-Host "Impossible de créer le bon du jour : code $($res.Status), $($res.Data)" -ForegroundColor Red
  Write-Host "Si un bon existe déjà aujourd'hui pour $Livreur, relance avec -Livreur karim (ou un livreur sans bon aujourd'hui)."
  exit 1
}
$bon = $res.Data
$stock = $bon.lignes[0].quantiteDemandee
$ligneId = $bon.lignes[0].id
Write-Host "OK    Bon du jour envoyé (id $($bon.id), $stock pièces demandées)" -ForegroundColor Green

# --- T6 : pas de livraison avant le chargement ---
Verifier "Livraison avant le chargement bloquée (T6)" 409 (Appel "POST" "/api/livraisons" $moi @{
  clientId = $ClientId
  lignes = @(@{ produitId = $ProduitId; quantiteLivree = 1; quantiteRetour = 0 })
})

# --- Le circuit jusqu'au chargement ---
Verifier "Magasinier accepte la ligne" 200 (Appel "PATCH" "/api/bons/$($bon.id)/lignes/$ligneId" $magasinier @{ decision = "ACCEPTEE" })
Verifier "Magasinier soumet" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "SOUMETTRE" })
Verifier "Gérant valide" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $gerant @{ action = "VALIDER" })
Verifier "Magasinier charge le camion" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "CHARGER" })

# --- Les livraisons ---
$res1 = Appel "POST" "/api/livraisons" $moi @{
  clientId = $ClientId
  lignes = @(@{ produitId = $ProduitId; quantiteLivree = 5; quantiteRetour = 0 })
}
Verifier "Livraison de 5 pièces" 201 $res1

Verifier "Livrer plus que le stock du camion refusé (T8)" 400 (Appel "POST" "/api/livraisons" $moi @{
  clientId = $ClientId
  lignes = @(@{ produitId = $ProduitId; quantiteLivree = ($stock + 1); quantiteRetour = 0 })
})
Verifier "Retour sans motif refusé" 400 (Appel "POST" "/api/livraisons" $moi @{
  clientId = $ClientId
  lignes = @(@{ produitId = $ProduitId; quantiteLivree = 0; quantiteRetour = 2 })
})
Verifier "Ligne vide refusée" 400 (Appel "POST" "/api/livraisons" $moi @{
  clientId = $ClientId
  lignes = @(@{ produitId = $ProduitId; quantiteLivree = 0; quantiteRetour = 0 })
})

$res2 = Appel "POST" "/api/livraisons" $moi @{
  clientId = $ClientId
  lignes = @(@{ produitId = $ProduitId; quantiteLivree = 3; quantiteRetour = 2; motifRetour = "ABIME" })
}
Verifier "Livraison de 3 pièces avec 2 retours (abîmé)" 201 $res2

if ($AutreClientId -gt 0) {
  Verifier "Client d'un autre secteur refusé (T18)" 404 (Appel "POST" "/api/livraisons" $moi @{
    clientId = $AutreClientId
    lignes = @(@{ produitId = $ProduitId; quantiteLivree = 1; quantiteRetour = 0 })
  })
}

# --- Annulation tracée ---
Verifier "Annulation de la livraison avec retour" 200 (Appel "PATCH" "/api/livraisons/$($res2.Data.id)" $moi @{ action = "ANNULER" })
Verifier "Deuxième annulation refusée" 409 (Appel "PATCH" "/api/livraisons/$($res2.Data.id)" $moi @{ action = "ANNULER" })
Verifier "Le gérant ne peut pas annuler une livraison" 403 (Appel "PATCH" "/api/livraisons/$($res1.Data.id)" $gerant @{ action = "ANNULER" })

if ($AutreLivreur -ne "") {
  $autre = Connexion $AutreLivreur "livreur1234"
  Verifier "Livreur sans tournée aujourd'hui bloqué" 409 (Appel "POST" "/api/livraisons" $autre @{
    clientId = $ClientId
    lignes = @(@{ produitId = $ProduitId; quantiteLivree = 1; quantiteRetour = 0 })
  })
}

$restant = $stock - 5
Write-Host "`nTerminé. Stock attendu dans le camion de $Livreur pour ce produit : $restant pièces."
Write-Host "Vérifie dans Prisma Studio : MouvementStock (types LIVRAISON, RETOUR_CLIENT, ANNULATION_LIVRAISON) et Livraison (une ligne annulee = true)."