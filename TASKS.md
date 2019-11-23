- Documentation using Swagger
- Enregistrer ses dispo
- Enregistrer dispo par segment (date de debut et fin)
- Retourner nb jours enregistres et heures de dispo sur la periode
- Retourner dispo
- Query possibilite
- Enregistrer possibilites
- Pas de generateur!!! Seulement liste heures


- IDEAS:

Save every free time on:
/freetime/userID/periods

Periods (start date / end date) will be indexed with name of startDate

DISAVANTEAGES:
If 2 periods start same time but end date is not same...
PROBLEMS: Batched writes will not work.
OR NO batched writes...
BALEK! 

Imagine on dit: Dispo du 10 janvier au 14 Janvier.

DS = Desired Start
DE = Desired End
SD = Start Date
ED = End Date

Avant de save en DB, on split en "jours". Ducoup on sauve:
Dispo du 10 Janvier au 14 Janvier
Dispo du 11 Janvier au 14 Janvier
Dispo du 12 Janvier au 14 Janvier
Dispo du 13 Janvier au 14 Janvier

Ensuite si on demande: Dispo quand entre le 12 Janvier et le 14 Janvier?
Comme on ne peux faire qu'une seule comparaison, au lieu de faire:
Trouve toutes les dispo avec SD < DS (Donc pleins de records).
On fait: Trouve toutes les dispo avec SD > DS - 1 Day.

Comme les Start Date sont split par jour, on trouvera bien la notre en prenant que 24h max de garbage.
Formula: 
Find * WHERE startDate > DesiredSTART - 1DAY |AND| startDate < DesiredEND
Comme meme filter on peux le faire.
Maintenant il faut pouvoir delete les appointements

ET CHERCHER AVEC LES NON DISPO!!!!!!!!!!!

Accepter appointments
les Refuser
En faire la liste
Get mom planning

TOUT CONVERTIR EN TIMESTAMP DES LE DEBUUUUUT

Faire table "propositions" chez tous les users, on check avec le POST APT mais on push dans cette table a la place et ensuite 1 route acpt ou refu et voilou voilou quoi


CURRENT TASK:
Post apointment with acceptation from the other

TODO URGENT:
GEOLOCALISATION!!!

- TASKS:

- [X] Poster free time
- [X] Get free time
- [X] Demander RDV
- [X] Recup liste demandes
- [X] Recup liste RDV envoyes
- [X] Accepter RDVS
- [X] REFUSER RDVS
- [X] Recup liste APTS
- [X] GEO filter (geofirestore)
- [] Signup test client
- [] Docs
- [] Cleanup code
- [] Gestion d'erreurs

TODO: Only set apt hasResponded && resp to True if the push is successfull!
