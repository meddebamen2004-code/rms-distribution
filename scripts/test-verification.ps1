param(
  [string]$Livreur = "sofia",
  [int]$ProduitId = 1,
  [int]$SecteurId = 1,
  [int]$ClientId = 1,
  [switch]$SansEcart
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

function Egal($nom, $attendu, $reel) {
  if ($reel -eq $attendu) {
    Write-Host "OK    $nom" -ForegroundColor Green
  } else {
    Write-Host "ECHEC $nom (attendu '$attendu', reçu '$reel')" -ForegroundColor Red
  }
}

$gerant = Connexion "gerant" "gerant1234"
$magasinier = Connexion "magasinier" "magasin1234"
$moi = Connexion $Livreur "livreur1234"
Write-Host "Connexions réussies ($Livreur, jour $jour)`n"

# --- Préparation : un camion chargé aujourd'hui, puis une livraison ---
Verifier "Réception de 5 cartons" 201 (Appel "POST" "/api/receptions" $magasinier @{
  reference = "TEST-VERIF"
  lignes = @(@{ produitId = $ProduitId; cartons = 5; pieces = 0 })
})
Verifier "Secteur affecté aujourd'hui" 200 (Appel "PUT" "/api/affectations" $gerant @{
  livreurId = $moi.User.id; secteurId = $SecteurId; jour = $jour
})
$res = Appel "POST" "/api/bons" $moi @{
  jour = $jour; envoyer = $true
  lignes = @(@{ produitId = $ProduitId; cartons = 2; pieces = 0 })
}
if ($res.Status -ne 201) {
  Write-Host "Impossible de créer le bon du jour : code $($res.Status), $($res.Data)" -ForegroundColor Red
  Write-Host "Si un bon existe déjà aujourd'hui pour $Livreur, relance avec un autre livreur (-Livreur karim)."
  exit 1
}
$bon = $res.Data
$stock = $bon.lignes[0].quantiteDemandee
$ligneId = $bon.lignes[0].id
Verifier "Magasinier accepte la ligne" 200 (Appel "PATCH" "/api/bons/$($bon.id)/lignes/$ligneId" $magasinier @{ decision = "ACCEPTEE" })
Verifier "Magasinier soumet" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "SOUMETTRE" })
Verifier "Gérant valide" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $gerant @{ action = "VALIDER" })
Verifier "Magasinier charge le camion" 200 (Appel "PATCH" "/api/bons/$($bon.id)" $magasinier @{ action = "CHARGER" })
Verifier "Livraison de 5 pièces" 201 (Appel "POST" "/api/livraisons" $moi @{
  clientId = $ClientId
  lignes = @(@{ produitId = $ProduitId; quantiteLivree = 5; quantiteRetour = 0 })
})
$theorique = $stock - 5
Write-Host "`nStock théorique du camion : $theorique pièces`n"

if ($SansEcart) {
  # --- Scénario sans écart : validation en un clic (T9) ---
  $res = Appel "POST" "/api/verification" $moi @{ reelles = @() }
  Verifier "Vérification sans écart" 200 $res
  Egal "Tournée prête pour le déchargement" "A_DECHARGER" $res.Data.statut
  $tid = $res.Data.tourneeId
  Verifier "Livraison après la vérification bloquée" 409 (Appel "POST" "/api/livraisons" $moi @{
    clientId = $ClientId
    lignes = @(@{ produitId = $ProduitId; quantiteLivree = 1; quantiteRetour = 0 })
  })
  Verifier "Le livreur ne peut pas décharger" 403 (Appel "PATCH" "/api/tournees/$tid" $moi @{ action = "DECHARGER" })
  Verifier "Magasinier décharge le camion" 200 (Appel "PATCH" "/api/tournees/$tid" $magasinier @{ action = "DECHARGER" })
  Verifier "Double déchargement refusé" 409 (Appel "PATCH" "/api/tournees/$tid" $magasinier @{ action = "DECHARGER" })
  Write-Host "`nTerminé. Le dépôt a récupéré $theorique pièces, le camion est à 0."
  exit 0
}

# --- Scénario avec écart (T10) ---
$reelle = $theorique - 2
Verifier "Écart sans motif refusé" 400 (Appel "POST" "/api/verification" $moi @{
  reelles = @(@{ produitId = $ProduitId; quantiteReelle = $reelle })
})
Verifier "Motif « autre » sans précision refusé" 400 (Appel "POST" "/api/verification" $moi @{
  reelles = @(@{ produitId = $ProduitId; quantiteReelle = $reelle; motif = "AUTRE" })
})

$res = Appel "POST" "/api/verification" $moi @{
  reelles = @(@{ produitId = $ProduitId; quantiteReelle = $reelle; motif = "CASSE"; commentaire = "Cartons écrasés" })
}
Verifier "Vérification avec un écart de -2" 200 $res
Egal "Tournée en attente de décision" "ECART_EN_ATTENTE" $res.Data.statut
$tid = $res.Data.tourneeId
$ecartId = $res.Data.ecarts[0].id

Verifier "Livraison après la vérification bloquée" 409 (Appel "POST" "/api/livraisons" $moi @{
  clientId = $ClientId
  lignes = @(@{ produitId = $ProduitId; quantiteLivree = 1; quantiteRetour = 0 })
})
Verifier "Déchargement avant la décision refusé" 409 (Appel "PATCH" "/api/tournees/$tid" $magasinier @{ action = "DECHARGER" })
Verifier "Le magasinier ne peut pas décider d'un écart" 403 (Appel "PATCH" "/api/ecarts/$ecartId" $magasinier @{ decision = "ACCEPTER" })
Verifier "Explication demandée sans commentaire refusée" 400 (Appel "PATCH" "/api/ecarts/$ecartId" $gerant @{ decision = "DEMANDER_EXPLICATION" })
Verifier "Gérant demande une explication" 200 (Appel "PATCH" "/api/ecarts/$ecartId" $gerant @{
  decision = "DEMANDER_EXPLICATION"; commentaire = "Pouvez-vous préciser la casse ?"
})
Verifier "Accepter pendant l'attente de l'explication refusé" 409 (Appel "PATCH" "/api/ecarts/$ecartId" $gerant @{ decision = "ACCEPTER" })
Verifier "Le livreur répond au gérant" 200 (Appel "POST" "/api/ecarts/$ecartId/explication" $moi @{
  commentaire = "Deux cartons tombés du camion au chargement"
})
$res = Appel "PATCH" "/api/ecarts/$ecartId" $gerant @{ decision = "ACCEPTER" }
Verifier "Gérant accepte l'écart" 200 $res
Egal "Tournée prête pour le déchargement" $true $res.Data.tourneeFinalisee

Verifier "Le livreur ne peut pas décharger" 403 (Appel "PATCH" "/api/tournees/$tid" $moi @{ action = "DECHARGER" })
Verifier "Magasinier décharge le camion" 200 (Appel "PATCH" "/api/tournees/$tid" $magasinier @{ action = "DECHARGER" })
Verifier "Double déchargement refusé" 409 (Appel "PATCH" "/api/tournees/$tid" $magasinier @{ action = "DECHARGER" })

Write-Host "`nTerminé. Le dépôt a récupéré $reelle pièces, le camion est à 0, 2 pièces sont sorties du stock (casse)."
Write-Host "Vérifie dans Prisma Studio : EcartTournee (ACCEPTE), MouvementStock (AJUSTEMENT -2, DECHARGEMENT), Tournee (CLOTUREE)."