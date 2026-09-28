
# TradeLab - Simulation Boursière (SAE BUT2)

## Description

TradeLab est une application web de simulation boursière développée pour une société financière. L'objectif de cette plateforme est de permettre aux utilisateurs de s'initier à la gestion de portefeuille et au trading de manière virtuelle, sans investir d'argent réel.

Chaque utilisateur débute avec un capital fictif de 100 000 € qu'il peut investir sur différents marchés (Actions, Indices, Devises, et Cryptomonnaies). La plateforme intègre des données de marché via des API financières réelles, un suivi de rentabilité, et un système de classement global pour stimuler la compétition entre les participants.

## Fonctionnalités Principales

-   **Authentification & Profil :** Création de compte et gestion de l'espace utilisateur.
    
-   **Portefeuille Virtuel (100 000 €) :** Saisie et validation des ordres d'achat et de vente avec contrôle des soldes.
    
-   **Données en Temps Réel :** Récupération et affichage des cours (actions, devises, marchés) via une API financière.
    
-   **Suivi des Performances :** Calcul de la valeur du portefeuille, de la rentabilité et affichage de graphiques d'évolution.
    
-   **Classement :** Comparaison des performances avec les autres participants grâce à un classement général.
    
-   **Espace Administrateur :** Gestion des utilisateurs, des simulations et modération globale.
    

## Installation & Démarrage (Getting Started)

Le projet repose sur une architecture front-end classique (HTML / CSS / JS natif) et ne requiert pas de framework lourd.

1.  Clonez le dépôt sur votre machine locale :
```
git clone https://iutbg-gitlab.iutbourg.univ-lyon1.fr/sae-but2/2026-2027/simulation-boursiere/sae-but2.git
```

2.  Placez-vous dans le répertoire du projet :
```
cd sae-but2
```

3.  Ouvrez le projet dans votre éditeur (ex: VS Code) et lancez le fichier `index.html` à la racine via une extension comme **Live Server**, ou simplement dans un navigateur internet.
    

## Structure du projet

-   `/css/style.css` : Fichier de style unique gérant le design global, la grille responsive et les animations.
    
-   `/js/script.js` : Logique applicative (appels API, génération du DOM, gestion du carrousel et des données fictives de secours).
    
-   `*.html` : Les différentes vues de l'application (Accueil, Marchés, Portefeuille, etc.).
    
    
## Auteurs et Remerciements

-   **Développement :** Laura SAUNOIS, Marwan MADANI, Enzo VALENTINO, Antonin TEP
    
-   **Tuteur de projet :** Fatih TURSUN
    
-   **Ressources :** API Binance pour les données de marché en temps réel et NewsData.io pour le flux d'actualités.

