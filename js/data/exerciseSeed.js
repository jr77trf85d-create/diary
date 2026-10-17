// Recherchierte Standard-Übungsdatenbank (77 gängige Grund- und Isolationsübungen),
// jeweils mit kurzer Anleitung, Muskel-Hinweis und primärer Muskelgruppe für die Filterung.
export const EXERCISE_SEED = [
  // Brust
  { name: "Bankdrücken", instructions: "Langhantel auf der Flachbank in Bauchhöhe ablegen, Griff schulterbreit, Hantel kontrolliert zur Brust senken und explosiv nach oben drücken.", muscleFeedback: "Vor allem in der mittleren/unteren Brust sowie leicht im Trizeps spürbar.", muscleGroup: "brust" },
  { name: "Schrägbankdrücken", instructions: "Auf einer 30-45° geneigten Bank die Langhantel oder Kurzhanteln zur oberen Brust senken und nach oben drücken.", muscleFeedback: "Fokus auf dem oberen Brustmuskel, zusätzlich vordere Schulter.", muscleGroup: "brust" },
  { name: "Negativ-Bankdrücken", instructions: "Auf einer nach unten geneigten Bank die Hantel zur unteren Brust führen und wieder hochdrücken.", muscleFeedback: "Betont den unteren Teil des Brustmuskels.", muscleGroup: "brust" },
  { name: "Kurzhantel-Bankdrücken", instructions: "Mit Kurzhanteln auf der Flachbank liegend die Gewichte parallel zur Brust senken und hochdrücken - größerer Bewegungsradius als mit der Langhantel.", muscleFeedback: "Intensiveres Dehnungsgefühl in der gesamten Brust durch den größeren Bewegungsumfang.", muscleGroup: "brust" },
  { name: "Kurzhantel-Fliegende", instructions: "Mit leicht gebeugten Armen die Kurzhanteln aus einer weiten Position bogenförmig über der Brust zusammenführen.", muscleFeedback: "Starke Dehnung und Anspannung in der Brustmitte, kaum Trizepseinsatz.", muscleGroup: "brust" },
  { name: "Dips (Brust)", instructions: "Am Dip-Barren mit nach vorn geneigtem Oberkörper absenken, bis die Schultern leicht gedehnt sind, dann hochdrücken.", muscleFeedback: "Untere/äußere Brust und Trizeps.", muscleGroup: "brust" },
  { name: "Butterfly (Maschine)", instructions: "An der Butterfly-Maschine die Arme aus einer geöffneten Position vor der Brust zusammenführen.", muscleFeedback: "Isolierter Reiz auf die Brustmitte durch die geführte Bewegung.", muscleGroup: "brust" },
  { name: "Liegestütze", instructions: "Körper gestreckt in Plank-Position, Hände schulterbreit, Brust kontrolliert zum Boden senken und wieder hochdrücken.", muscleFeedback: "Ganzheitliches Brust-, Schulter- und Trizepsgefühl, verstärkt bei tiefer Ausführung.", muscleGroup: "brust" },
  { name: "Kabelüberzüge (Cable Crossover)", instructions: "An zwei hoch eingestellten Kabelzügen die Griffe von außen oben in einem Bogen vor dem Körper zusammenführen.", muscleFeedback: "Starke Dehnung und Anspannung der inneren/unteren Brust.", muscleGroup: "brust" },
  { name: "Schrägbank-Kurzhantel-Fliegende", instructions: "Auf der Schrägbank die Kurzhanteln mit leicht gebeugten Armen bogenförmig über der oberen Brust zusammenführen.", muscleFeedback: "Dehnung und Anspannung im oberen Bereich der Brust.", muscleGroup: "brust" },
  { name: "Plyometrische Liegestütze", instructions: "Liegestütz explosiv ausführen, sodass sich die Hände kurz vom Boden lösen, dann kontrolliert abfangen.", muscleFeedback: "Brust, Schulter und Trizeps mit zusätzlichem Kraft-/Schnelligkeitsreiz.", muscleGroup: "brust" },
  { name: "Smith-Machine Bankdrücken", instructions: "Bankdrücken an der geführten Multipresse (Smith Machine), die Bewegung ist auf eine vertikale Bahn fixiert.", muscleFeedback: "Ähnlich klassischem Bankdrücken, durch die Führung etwas weniger Stabilisationsarbeit.", muscleGroup: "brust" },

  // Rücken
  { name: "Kreuzheben", instructions: "Langhantel dicht am Schienbein vom Boden heben, Rücken gerade halten, über die Hüfte aufrichten.", muscleFeedback: "Ganzkörperspannung, besonders unterer Rücken, Gesäß und hintere Oberschenkel.", muscleGroup: "ruecken" },
  { name: "Klimmzüge", instructions: "Im Obergriff an der Stange hochziehen, bis das Kinn über die Stange kommt, kontrolliert absenken.", muscleFeedback: "Breiter Rückenmuskel (Latissimus) und Bizeps.", muscleGroup: "ruecken" },
  { name: "Klimmzüge im Untergriff", instructions: "Wie Klimmzüge, jedoch im Untergriff (Handflächen zum Körper) ausgeführt.", muscleFeedback: "Stärkerer Bizeps-Anteil zusätzlich zum Rücken.", muscleGroup: "ruecken" },
  { name: "Latzug", instructions: "An der Kabelmaschine die Stange im Obergriff vor dem Körper zur oberen Brust ziehen.", muscleFeedback: "Guter Einstieg für das Rückenbreiten-Gefühl, ähnlich wie Klimmzüge, aber dosierbar.", muscleGroup: "ruecken" },
  { name: "Langhantelrudern", instructions: "Mit vorgebeugtem Oberkörper die Langhantel zum unteren Bauch ziehen, Ellbogen eng am Körper führen.", muscleFeedback: "Mittlerer Rücken und breiter Rückenmuskel, Spannung zwischen den Schulterblättern.", muscleGroup: "ruecken" },
  { name: "Kurzhantelrudern (einarmig)", instructions: "Mit einem Knie und einer Hand auf der Bank abgestützt, die Kurzhantel seitlich zur Hüfte ziehen.", muscleFeedback: "Isolierter Zug auf eine Rückenseite, gutes Gefühl für die seitliche Rückenmuskulatur.", muscleGroup: "ruecken" },
  { name: "Kabelrudern (sitzend)", instructions: "Am Kabelzug sitzend den Griff zum Bauch ziehen, Rücken aufrecht, Schulterblätter zusammenziehen.", muscleFeedback: "Mittlerer Rücken, besonders zwischen den Schulterblättern spürbar.", muscleGroup: "ruecken" },
  { name: "Rückenstrecker (Hyperextension)", instructions: "Auf der Hyperextensions-Bank den Oberkörper aus einer nach vorne gebeugten Position aufrichten.", muscleFeedback: "Unterer Rücken (Rückenstrecker) und Gesäß.", muscleGroup: "ruecken" },
  { name: "Sumo-Kreuzheben", instructions: "Kreuzheben mit breitem Stand und Griff innerhalb der Beine, Oberkörper bleibt aufrechter als beim klassischen Kreuzheben.", muscleFeedback: "Rücken, Gesäß und Innenseite der Oberschenkel, etwas schonender für den unteren Rücken.", muscleGroup: "ruecken" },
  { name: "T-Bar-Rudern", instructions: "Mit der T-Bar-Stange oder Langhantel in einer Ecke vorgebeugt zum Oberkörper ziehen.", muscleFeedback: "Mittlerer Rücken mit starker Dehnung in der Ausgangsposition.", muscleGroup: "ruecken" },
  { name: "Kabelzug einarmig (stehend)", instructions: "Am Kabelzug stehend einarmig zur Hüfte ziehen, Rumpf stabil halten.", muscleFeedback: "Seitlicher Rücken, zusätzlich Rumpfstabilität gefordert.", muscleGroup: "ruecken" },
  { name: "Good Mornings", instructions: "Mit Langhantel im Nacken den Oberkörper aus der Hüfte nach vorne beugen, Rücken bleibt gerade, dann aufrichten.", muscleFeedback: "Unterer Rücken und hintere Oberschenkel (Beinbizeps).", muscleGroup: "ruecken" },

  // Schultern
  { name: "Schulterdrücken", instructions: "Hantel(n) von Schulterhöhe senkrecht nach oben drücken, ohne den unteren Rücken durchzudrücken.", muscleFeedback: "Vordere und seitliche Schulter, in der Überkopfposition auch Trizeps.", muscleGroup: "schultern" },
  { name: "Seitheben", instructions: "Kurzhanteln mit leicht gebeugten Armen seitlich bis auf Schulterhöhe anheben.", muscleFeedback: "Isolierter Reiz auf die seitliche Schulter (mittlerer Deltamuskel).", muscleGroup: "schultern" },
  { name: "Frontheben", instructions: "Kurzhantel oder Langhantel mit gestreckten Armen vor dem Körper bis Schulterhöhe anheben.", muscleFeedback: "Vordere Schulter.", muscleGroup: "schultern" },
  { name: "Reverse Butterfly / Face Pulls", instructions: "An der Butterfly-Maschine oder am Kabelzug die Arme rückwärts auseinanderziehen, Fokus auf die hintere Schulter.", muscleFeedback: "Hintere Schulter und obere Rückenmuskulatur, wichtig für eine gesunde Schulterhaltung.", muscleGroup: "schultern" },
  { name: "Arnold Press", instructions: "Kurzhanteln vor dem Körper mit Handflächen zum Gesicht beginnen, während des Hochdrückens nach außen rotieren.", muscleFeedback: "Alle drei Schulterköpfe, durch die Rotation stärkerer Reiz auf vordere und seitliche Schulter.", muscleGroup: "schultern" },
  { name: "Schulterdrücken (Maschine)", instructions: "An der Schulterpresse-Maschine die Griffe aus Schulterhöhe nach oben drücken.", muscleFeedback: "Vordere und seitliche Schulter, geführte Bewegung mit weniger Stabilisationsaufwand.", muscleGroup: "schultern" },
  { name: "Kabel-Seitheben", instructions: "Am tief eingestellten Kabelzug den Arm seitlich bis auf Schulterhöhe anheben.", muscleFeedback: "Seitliche Schulter mit konstanter Spannung über die gesamte Bewegung.", muscleGroup: "schultern" },
  { name: "Cuban Press", instructions: "Kurzhanteln seitlich auf Schulterhöhe anheben, im Ellbogen nach oben rotieren, dann nach oben drücken.", muscleFeedback: "Seitliche und hintere Schulter sowie die Rotatorenmanschette.", muscleGroup: "schultern" },
  { name: "Aufrechtes Rudern", instructions: "Langhantel oder Kurzhanteln eng am Körper bis knapp unter das Kinn hochziehen, Ellbogen führen nach außen oben.", muscleFeedback: "Seitliche Schulter und oberer Trapezmuskel.", muscleGroup: "schultern" },

  // Bizeps
  { name: "Bizepscurls", instructions: "Langhantel oder Kurzhanteln aus gestreckter Armposition zur Schulter hochcurlen, Ellbogen bleiben am Körper.", muscleFeedback: "Vorderseite des Oberarms (Bizeps).", muscleGroup: "bizeps" },
  { name: "Hammercurls", instructions: "Wie Bizepscurls, jedoch mit neutralem Griff (Handflächen zeigen zueinander).", muscleFeedback: "Bizeps und zusätzlich der äußere Unterarmmuskel (Brachialis).", muscleGroup: "bizeps" },
  { name: "Konzentrationscurls", instructions: "Sitzend den Ellbogen an der Innenseite des Oberschenkels abstützen und die Kurzhantel isoliert hochcurlen.", muscleFeedback: "Sehr isolierter Bizeps-Reiz durch den fixierten Ellbogen.", muscleGroup: "bizeps" },
  { name: "Kabel-Bizepscurls", instructions: "Am tief eingestellten Kabelzug mit Stange oder Seil den Bizeps curlen, Ellbogen bleiben fixiert.", muscleFeedback: "Bizeps mit konstanter Spannung durch den Kabelzug, auch am oberen Bewegungsende.", muscleGroup: "bizeps" },
  { name: "21s (Bizeps)", instructions: "7 Wiederholungen im unteren Bewegungsbereich, 7 im oberen, 7 über die volle Range curlen.", muscleFeedback: "Intensiver Bizeps-Reiz durch die verlängerte Anspannungsdauer.", muscleGroup: "bizeps" },
  { name: "Scott-Curls", instructions: "Am Scott-Pult die Oberarme auf der Polsterung ablegen und die Hantel curlen.", muscleFeedback: "Isolierter Bizeps-Reiz, besonders im unteren, gedehnten Bewegungsbereich.", muscleGroup: "bizeps" },
  { name: "Reverse Curls", instructions: "Bizepscurls im Obergriff (Handrücken zeigen nach oben) ausführen.", muscleFeedback: "Unterarmstrecker und Brachialis, weniger klassischer Bizeps.", muscleGroup: "bizeps" },

  // Trizeps
  { name: "Trizepsdrücken (Kabel)", instructions: "Am Kabelzug mit Seil oder Stange die Arme von gebeugter Position nach unten strecken, Ellbogen bleiben fixiert.", muscleFeedback: "Rückseite des Oberarms (Trizeps).", muscleGroup: "trizeps" },
  { name: "Trizepsdips", instructions: "Zwischen zwei Bänken oder am Barren mit engem Armabstand den Körper absenken und wieder hochdrücken.", muscleFeedback: "Trizeps, bei aufrechtem Oberkörper stärker isoliert als bei Brust-Dips.", muscleGroup: "trizeps" },
  { name: "Enges Bankdrücken", instructions: "Bankdrücken mit schulterschmalem Griff ausführen, Ellbogen nah am Körper führen.", muscleFeedback: "Stärkerer Trizeps-Anteil im Vergleich zum normalen Bankdrücken.", muscleGroup: "trizeps" },
  { name: "Überkopf-Trizepsstrecken", instructions: "Kurzhantel oder Langhantel hinter dem Kopf absenken und die Arme wieder strecken, Oberarme bleiben ruhig.", muscleFeedback: "Trizeps, besonders der lange Kopf durch die gedehnte Ausgangsposition.", muscleGroup: "trizeps" },
  { name: "Skullcrusher", instructions: "Im Liegen die Langhantel oder EZ-Stange von gestreckter Armposition Richtung Stirn absenken und wieder strecken.", muscleFeedback: "Trizeps, besonders der lange Kopf durch die gedehnte Position.", muscleGroup: "trizeps" },
  { name: "Trizeps-Kickbacks", instructions: "Vorgebeugt den Oberarm parallel zum Boden halten und den Unterarm mit der Kurzhantel nach hinten strecken.", muscleFeedback: "Isolierter Trizeps-Reiz, besonders in der gestreckten Endposition.", muscleGroup: "trizeps" },
  { name: "Diamant-Liegestütze", instructions: "Liegestütz mit eng zusammengeführten Händen (Daumen und Zeigefinger bilden eine Raute) ausführen.", muscleFeedback: "Starker Trizeps-Reiz zusätzlich zur Brust.", muscleGroup: "trizeps" },

  // Unterarme
  { name: "Handgelenkscurls", instructions: "Unterarme auf einer Bank ablegen, Handgelenke mit der Hantel im Untergriff auf- und abbewegen.", muscleFeedback: "Unterarmbeuger (Innenseite des Unterarms).", muscleGroup: "unterarme" },
  { name: "Reverse Wrist Curls", instructions: "Wie Handgelenkscurls, jedoch im Obergriff (Handrücken oben).", muscleFeedback: "Unterarmstrecker (Außenseite des Unterarms).", muscleGroup: "unterarme" },
  { name: "Farmer's Walk", instructions: "Mit einer schweren Kurzhantel oder Kettlebell in jeder Hand aufrecht eine festgelegte Strecke gehen.", muscleFeedback: "Unterarme/Griffkraft sowie Rumpf und Trapezmuskel als Stabilisatoren.", muscleGroup: "unterarme" },

  // Quadrizeps
  { name: "Kniebeugen", instructions: "Langhantel im Nacken, Hüfte nach hinten schieben und in die Knie gehen, bis die Oberschenkel parallel zum Boden sind, dann aufstehen.", muscleFeedback: "Vorderer Oberschenkel (Quadrizeps), Gesäß und unterer Rücken als Stabilisator.", muscleGroup: "quadrizeps" },
  { name: "Beinpresse", instructions: "An der Beinpresse die Plattform aus gebeugter Position nach oben drücken, ohne die Knie durchzustrecken.", muscleFeedback: "Vorderer Oberschenkel und Gesäß, geführte Bewegung mit weniger Rückenbelastung.", muscleGroup: "quadrizeps" },
  { name: "Ausfallschritte", instructions: "Einen großen Schritt nach vorne machen und beide Knie beugen, bis das hintere Knie fast den Boden berührt, dann zurückdrücken.", muscleFeedback: "Vorderer Oberschenkel und Gesäß des vorderen Beins, zusätzlich Gleichgewicht.", muscleGroup: "quadrizeps" },
  { name: "Beinstrecker", instructions: "An der Maschine sitzend die Unterschenkel gegen den Widerstand strecken.", muscleFeedback: "Isolierter Reiz auf den vorderen Oberschenkel (Quadrizeps).", muscleGroup: "quadrizeps" },
  { name: "Frontkniebeugen", instructions: "Langhantel vorne auf den Schultern ablegen, aufrechter Oberkörper, in die Knie gehen.", muscleFeedback: "Starker Fokus auf den vorderen Oberschenkel, zusätzlich Rumpfstabilität.", muscleGroup: "quadrizeps" },
  { name: "Hackenschmidt-Kniebeugen", instructions: "An der Hackenschmidt-Maschine mit dem Rücken an der Schrägfläche in die Knie gehen.", muscleFeedback: "Vorderer Oberschenkel, geführte Bewegung mit weniger Rückenbelastung.", muscleGroup: "quadrizeps" },
  { name: "Bulgarian Split Squat", instructions: "Mit einem Fuß erhöht hinter dem Körper abgestützt auf dem vorderen Bein in die Knie gehen.", muscleFeedback: "Vorderer Oberschenkel und Gesäß des vorderen Beins, zusätzlich Gleichgewicht.", muscleGroup: "quadrizeps" },
  { name: "Goblet Squat", instructions: "Eine Kurzhantel oder Kettlebell vor der Brust halten und in die Kniebeuge gehen.", muscleFeedback: "Vorderer Oberschenkel, einsteigerfreundliche Variante der Kniebeuge.", muscleGroup: "quadrizeps" },

  // Beinbizeps
  { name: "Rumänisches Kreuzheben", instructions: "Mit fast gestreckten Beinen die Hantel entlang der Oberschenkel absenken, Rücken gerade, dann die Hüfte nach vorne strecken.", muscleFeedback: "Starke Dehnung und Spannung im hinteren Oberschenkel (Beinbizeps) und Gesäß.", muscleGroup: "beinbizeps" },
  { name: "Beinbeuger", instructions: "An der Maschine liegend oder sitzend die Fersen gegen den Widerstand zum Gesäß ziehen.", muscleFeedback: "Isolierter Reiz auf die hintere Oberschenkelmuskulatur (Beinbizeps).", muscleGroup: "beinbizeps" },
  { name: "Nordic Hamstring Curl", instructions: "Füße fixieren, aus dem Kniestand den Oberkörper kontrolliert nach vorne absenken und wieder hochziehen.", muscleFeedback: "Sehr intensiver Reiz für die hintere Oberschenkelmuskulatur.", muscleGroup: "beinbizeps" },
  { name: "Einbeiniger Beinbeuger", instructions: "Wie Beinbeuger an der Maschine, jedoch ein Bein nach dem anderen.", muscleFeedback: "Isolierter, seitengleicher Reiz auf die hintere Oberschenkelmuskulatur.", muscleGroup: "beinbizeps" },

  // Gesäß
  { name: "Hüftstrecker (Hip Thrust)", instructions: "Mit dem oberen Rücken an einer Bank abgestützt, die Hüfte mit Gewicht auf dem Becken nach oben drücken.", muscleFeedback: "Starker, isolierter Reiz im Gesäß.", muscleGroup: "gesaess" },
  { name: "Kickbacks am Kabel", instructions: "Am tief eingestellten Kabelzug mit einer Fußschlaufe das Bein nach hinten oben strecken.", muscleFeedback: "Isolierter Reiz auf das Gesäß.", muscleGroup: "gesaess" },
  { name: "Hüftabduktion (Maschine)", instructions: "An der Maschine sitzend die Beine gegen den Widerstand nach außen drücken.", muscleFeedback: "Seitliches Gesäß (Hüftabduktoren).", muscleGroup: "gesaess" },
  { name: "Hüftadduktion (Maschine)", instructions: "An der Maschine sitzend die Beine gegen den Widerstand zusammenführen.", muscleFeedback: "Innenseite der Oberschenkel (Adduktoren).", muscleGroup: "gesaess" },

  // Waden
  { name: "Wadenheben", instructions: "Stehend oder sitzend die Fersen so weit wie möglich anheben und langsam absenken.", muscleFeedback: "Wadenmuskulatur, besonders in der obersten Position spürbar.", muscleGroup: "waden" },
  { name: "Wadenheben sitzend", instructions: "Sitzend mit Gewicht auf den Oberschenkeln die Fersen anheben und absenken.", muscleFeedback: "Wadenmuskulatur mit Fokus auf den unteren Wadenmuskel (Soleus) durch die gebeugte Kniestellung.", muscleGroup: "waden" },
  { name: "Wadenheben an der Beinpresse", instructions: "An der Beinpresse nur mit den Fußballen auf der Plattform die Fersen anheben und absenken.", muscleFeedback: "Wadenmuskulatur mit hoher erreichbarer Belastung.", muscleGroup: "waden" },

  // Bauch/Core
  { name: "Crunches", instructions: "Im Liegen die Schultern kontrolliert Richtung Becken einrollen, unterer Rücken bleibt am Boden.", muscleFeedback: "Vordere Bauchmuskulatur (gerader Bauchmuskel).", muscleGroup: "bauch" },
  { name: "Unterarmstütz (Plank)", instructions: "Auf Unterarmen und Zehenspitzen eine gerade Linie von Kopf bis Ferse halten.", muscleFeedback: "Ganzheitliche Rumpfspannung, besonders tiefe Bauchmuskulatur.", muscleGroup: "bauch" },
  { name: "Beinheben", instructions: "Hängend an der Stange oder liegend die gestreckten oder angewinkelten Beine kontrolliert anheben.", muscleFeedback: "Untere Bauchmuskulatur und Hüftbeuger.", muscleGroup: "bauch" },
  { name: "Russian Twists", instructions: "Im Sitzen mit angehobenen Füßen den Oberkörper mit einem Gewicht kontrolliert von Seite zu Seite drehen.", muscleFeedback: "Seitliche Bauchmuskulatur (schräge Bauchmuskeln).", muscleGroup: "bauch" },
  { name: "Kabel-Crunches", instructions: "Am Kabelzug kniend das Seil hinter dem Kopf halten und den Oberkörper einrollen.", muscleFeedback: "Vordere Bauchmuskulatur mit zusätzlichem, einstellbarem Widerstand.", muscleGroup: "bauch" },
  { name: "Ab Wheel Rollout", instructions: "Mit dem Ab-Rad vom Kniestand nach vorne ausrollen und wieder zurückziehen, Rumpf bleibt stabil.", muscleFeedback: "Intensive Anspannung der gesamten Bauch- und Rumpfmuskulatur.", muscleGroup: "bauch" },
  { name: "Bergsteiger (Mountain Climbers)", instructions: "In der Liegestütz-Position die Knie abwechselnd schnell Richtung Brust ziehen.", muscleFeedback: "Bauchmuskulatur und Hüftbeuger, zusätzlich konditionelle Komponente.", muscleGroup: "bauch" },
  { name: "Seitstütz (Side Plank)", instructions: "Seitlich auf einem Unterarm abgestützt den Körper in einer geraden Linie halten.", muscleFeedback: "Seitliche Bauchmuskulatur (schräge Bauchmuskeln) und Rumpfstabilität.", muscleGroup: "bauch" },
];
