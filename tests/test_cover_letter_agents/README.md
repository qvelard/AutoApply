# Tests - Système de Génération de Lettres de Motivation

Ce dossier contient tous les tests pour le système de génération automatique de lettres de motivation.

## 📁 Structure des Tests

- `validate.mjs` - Validation de base de la structure et des dépendances
- `quick_test.mjs` - Test rapide des fonctionnalités principales
- `simple_test.mjs` - Tests unitaires simples (parsing, extraction)
- `test_cover_letter_agents.mjs` - Test complet du pipeline end-to-end

## 🚀 Exécution des Tests

### Via npm scripts (recommandé)

```bash
# Test de validation (rapide, vérifie la structure)
npm run test:validate

# Test rapide (parsing CV + extraction info)
npm run test:quick

# Test simple (fonctions individuelles)
npm run test:simple

# Test complet (pipeline entier)
npm run test:full

# Tous les tests
npm test
```

### Exécution directe

```bash
# Depuis la racine du projet
node tests/validate.mjs
node tests/quick_test.mjs
node tests/simple_test.mjs
node tests/test_cover_letter_agents.mjs
```

## 📋 Prérequis

Avant d'exécuter les tests, assurez-vous que :

1. **Ollama est démarré** avec le modèle `gpt-oss:latest`
   ```bash
   ollama serve
   ollama pull llama2  # ou gpt-oss:latest
   ```

2. **Dépendances installées**
   ```bash
   npm install
   ```

3. **Fichier de test CV présent**
   - `src/cv1.pdf` doit exister pour les tests de parsing

## 🧪 Description des Tests

### validate.mjs
- ✅ Vérifie l'existence des fichiers principaux
- ✅ Valide la structure du code (imports, exports)
- ✅ Contrôle la présence des dépendances
- ✅ Test rapide, pas de LLM requis

### quick_test.mjs
- ✅ Parsing du CV PDF
- ✅ Extraction des informations personnelles
- ✅ Génération de PDF de test
- ✅ Sauvegarde automatique du PDF généré

### simple_test.mjs
- ✅ Tests unitaires des fonctions individuelles
- ✅ Validation des exports
- ✅ Structure modulaire

### test_cover_letter_agents.mjs
- ✅ Pipeline complet end-to-end
- ✅ Scraping web (avec gestion d'erreurs)
- ✅ Génération de lettre complète
- ✅ Tests de performance

## 📊 Résultats Attendus

### Tests Réussis ✅
- Parsing CV : Extraction correcte du texte
- Extraction info : Nom, email, téléphone identifiés
- Génération PDF : Fichier créé avec contenu valide
- Structure : Tous les composants présents

### Tests avec Avertissements ⚠️
- Scraping web : Peut échouer avec URLs de test
- LLM : Nécessite Ollama démarré
- Réseau : Dépend de la connectivité

## 🔧 Dépannage

### Erreur "Cannot find module"
```bash
# Vérifier les dépendances
npm install

# Vérifier la structure des dossiers
ls -la src/
ls -la tests/
```

### Erreur "Ollama not responding"
```bash
# Démarrer Ollama
ollama serve

# Vérifier les modèles
ollama list

# Pull le modèle requis
ollama pull llama2
```

### Erreur "CV file not found"
```bash
# Vérifier la présence du fichier de test
ls -la src/cv1.pdf

# Si absent, utiliser un CV PDF existant
cp /path/to/your/cv.pdf src/cv1.pdf
```

## 📈 Métriques de Test

- **Temps d'exécution** : validate.mjs (~2s), quick_test.mjs (~10-30s)
- **Taux de succès attendu** : 90%+ pour les tests locaux
- **Dépendances externes** : Ollama pour les tests LLM

## 🎯 Bonnes Pratiques

1. **Exécuter validate.mjs** en premier (rapide, valide la structure)
2. **Démarrer Ollama** avant les tests nécessitant LLM
3. **Utiliser des URLs réelles** pour tester le scraping en production
4. **Vérifier les PDFs générés** dans le dossier de sortie

## 📝 Notes de Développement

- Les tests utilisent des chemins relatifs depuis le dossier `tests/`
- Les fichiers de test sont en `.mjs` pour les modules ES
- Les tests peuvent être exécutés indépendamment
- Les PDFs générés sont sauvegardés automatiquement pour vérification