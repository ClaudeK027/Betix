# Image de base légère
FROM python:3.11-slim

# Variables d'environnement pour Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Répertoire de travail
WORKDIR /app

# Installation des dépendances système (si nécessaire) et supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copie des requirements et installation
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source et de la configuration supervisor
COPY . .

# Port exposé
EXPOSE 8000

# Commande de démarrage avec Supervisord
CMD ["/usr/bin/supervisord", "-c", "/app/supervisord.conf"]
