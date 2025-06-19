#!/bin/bash

# Deploy automatizado do AgencyHub para VPS
# Uso: ./deploy-vps.sh [usuario@ip_vps] [porta_ssh]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações padrão
VPS_USER_HOST=${1:-"root@seu-servidor.com"}
SSH_PORT=${2:-"22"}
APP_DIR="/var/www/agencyhub"
DOMAIN="agencyhub.com"  # Altere para seu domínio
NGINX_CONF="/etc/nginx/sites-available/agencyhub"

echo -e "${BLUE}🚀 Iniciando deploy automatizado do AgencyHub${NC}"
echo -e "${YELLOW}VPS: $VPS_USER_HOST${NC}"
echo -e "${YELLOW}Porta SSH: $SSH_PORT${NC}"

# Função para executar comandos na VPS
run_vps_command() {
    ssh -p $SSH_PORT $VPS_USER_HOST "$1"
}

# Função para copiar arquivos para VPS
copy_to_vps() {
    scp -P $SSH_PORT -r "$1" $VPS_USER_HOST:"$2"
}

# 1. Verificar conexão SSH
echo -e "${BLUE}📡 Testando conexão SSH...${NC}"
if ! ssh -p $SSH_PORT -o ConnectTimeout=10 $VPS_USER_HOST "echo 'Conexão SSH estabelecida'" 2>/dev/null; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao servidor VPS${NC}"
    echo -e "${YELLOW}Verifique:${NC}"
    echo "- IP/hostname do servidor"
    echo "- Porta SSH (padrão: 22)"
    echo "- Chaves SSH configuradas"
    echo "- Firewall/Security Groups"
    exit 1
fi
echo -e "${GREEN}✅ Conexão SSH estabelecida${NC}"

# 2. Preparar ambiente na VPS
echo -e "${BLUE}🔧 Preparando ambiente na VPS...${NC}"
run_vps_command "
    # Atualizar sistema
    apt update && apt upgrade -y
    
    # Instalar dependências
    apt install -y curl git nginx certbot python3-certbot-nginx pm2 postgresql postgresql-contrib
    
    # Instalar Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Criar diretório da aplicação
    mkdir -p $APP_DIR
    chown -R www-data:www-data $APP_DIR
"

# 3. Configurar PostgreSQL
echo -e "${BLUE}🗄️ Configurando PostgreSQL...${NC}"
run_vps_command "
    # Configurar PostgreSQL
    sudo -u postgres psql -c \"CREATE DATABASE agencyhub;\" 2>/dev/null || true
    sudo -u postgres psql -c \"CREATE USER agencyhub WITH ENCRYPTED PASSWORD 'senha_forte_aqui';\" 2>/dev/null || true
    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE agencyhub TO agencyhub;\" 2>/dev/null || true
    sudo -u postgres psql -c \"ALTER USER agencyhub CREATEDB;\" 2>/dev/null || true
"

# 4. Build da aplicação localmente
echo -e "${BLUE}🔨 Fazendo build da aplicação...${NC}"
npm install
npm run build

# 5. Copiar aplicação para VPS
echo -e "${BLUE}📤 Enviando aplicação para VPS...${NC}"
copy_to_vps "." "$APP_DIR/"

# 6. Instalar dependências na VPS
echo -e "${BLUE}📦 Instalando dependências na VPS...${NC}"
run_vps_command "
    cd $APP_DIR
    npm install --production
    chown -R www-data:www-data $APP_DIR
"

# 7. Configurar variáveis de ambiente
echo -e "${BLUE}🔐 Configurando variáveis de ambiente...${NC}"
run_vps_command "
cat > $APP_DIR/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://agencyhub:senha_forte_aqui@localhost:5432/agencyhub
SESSION_SECRET=\$(openssl rand -hex 32)
OPENAI_API_KEY=sua_openai_key_aqui
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
EOF
chown www-data:www-data $APP_DIR/.env
chmod 600 $APP_DIR/.env
"

# 8. Configurar Nginx
echo -e "${BLUE}🌐 Configurando Nginx...${NC}"
run_vps_command "
cat > $NGINX_CONF << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;
    add_header Content-Security-Policy \"default-src 'self' http: https: data: blob: 'unsafe-inline'\" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ativar site
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
"

# 9. Configurar PM2
echo -e "${BLUE}⚙️ Configurando PM2...${NC}"
run_vps_command "
cd $APP_DIR

# Configurar PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'agencyhub',
    script: 'dist/index.js',
    cwd: '$APP_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/agencyhub/error.log',
    out_file: '/var/log/agencyhub/out.log',
    log_file: '/var/log/agencyhub/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

# Criar diretório de logs
mkdir -p /var/log/agencyhub
chown -R www-data:www-data /var/log/agencyhub

# Instalar PM2 globalmente e configurar
npm install -g pm2
pm2 delete agencyhub 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u www-data --hp /var/www
"

# 10. Executar migrações do banco
echo -e "${BLUE}🗃️ Executando migrações do banco...${NC}"
run_vps_command "
cd $APP_DIR
npm run db:push
"

# 11. Configurar SSL com Let's Encrypt
echo -e "${BLUE}🔒 Configurando SSL...${NC}"
run_vps_command "
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect
systemctl enable certbot.timer
"

# 12. Configurar firewall
echo -e "${BLUE}🛡️ Configurando firewall...${NC}"
run_vps_command "
# Configurar UFW
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5432 # PostgreSQL (apenas se necessário acesso externo)
ufw --force enable
"

# 13. Configurar backups automáticos
echo -e "${BLUE}💾 Configurando backups automáticos...${NC}"
run_vps_command "
# Script de backup
cat > /usr/local/bin/backup-agencyhub.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=\"/var/backups/agencyhub\"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup do banco
sudo -u postgres pg_dump agencyhub > \$BACKUP_DIR/db_\$DATE.sql

# Backup dos arquivos
tar -czf \$BACKUP_DIR/files_\$DATE.tar.gz -C $APP_DIR .

# Manter apenas os últimos 7 backups
find \$BACKUP_DIR -name \"*.sql\" -mtime +7 -delete
find \$BACKUP_DIR -name \"*.tar.gz\" -mtime +7 -delete

echo \"Backup concluído: \$DATE\"
EOF

chmod +x /usr/local/bin/backup-agencyhub.sh

# Cron job para backup diário às 2h
(crontab -l 2>/dev/null; echo \"0 2 * * * /usr/local/bin/backup-agencyhub.sh\") | crontab -
"

# 14. Configurar monitoramento
echo -e "${BLUE}📊 Configurando monitoramento...${NC}"
run_vps_command "
# Script de monitoramento
cat > /usr/local/bin/monitor-agencyhub.sh << 'EOF'
#!/bin/bash
LOG_FILE=\"/var/log/agencyhub/monitor.log\"

# Verificar se a aplicação está rodando
if ! pm2 list | grep -q \"agencyhub.*online\"; then
    echo \"\$(date): Aplicação offline, reiniciando...\" >> \$LOG_FILE
    pm2 restart agencyhub
fi

# Verificar se o site responde
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo \"\$(date): Site não responde, reiniciando...\" >> \$LOG_FILE
    pm2 restart agencyhub
fi

# Verificar uso de memória
MEMORY_USAGE=\$(free | grep Mem | awk '{printf \"%.1f\", \$3/\$2 * 100.0}')
if (( \$(echo \"\$MEMORY_USAGE > 85\" | bc -l) )); then
    echo \"\$(date): Uso de memória alto: \$MEMORY_USAGE%\" >> \$LOG_FILE
fi

# Verificar espaço em disco
DISK_USAGE=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 85 ]; then
    echo \"\$(date): Uso de disco alto: \$DISK_USAGE%\" >> \$LOG_FILE
fi
EOF

chmod +x /usr/local/bin/monitor-agencyhub.sh

# Cron job para monitoramento a cada 5 minutos
(crontab -l 2>/dev/null; echo \"*/5 * * * * /usr/local/bin/monitor-agencyhub.sh\") | crontab -
"

# 15. Criar script de deploy futuro
echo -e "${BLUE}🔄 Criando script para deploys futuros...${NC}"
run_vps_command "
cat > $APP_DIR/update.sh << 'EOF'
#!/bin/bash
cd $APP_DIR

echo \"Atualizando AgencyHub...\"

# Backup antes da atualização
/usr/local/bin/backup-agencyhub.sh

# Pull das mudanças
git pull origin main

# Instalar dependências
npm install --production

# Build da aplicação
npm run build

# Executar migrações
npm run db:push

# Reiniciar aplicação
pm2 restart agencyhub

echo \"Atualização concluída!\"
EOF

chmod +x $APP_DIR/update.sh
chown www-data:www-data $APP_DIR/update.sh
"

# 16. Verificações finais
echo -e "${BLUE}🔍 Verificações finais...${NC}"
sleep 5

echo -e "${BLUE}Verificando status dos serviços...${NC}"
run_vps_command "
echo '=== Status do PostgreSQL ==='
systemctl status postgresql --no-pager -l

echo '=== Status do Nginx ==='
systemctl status nginx --no-pager -l

echo '=== Status do PM2 ==='
pm2 status

echo '=== Status do Firewall ==='
ufw status

echo '=== Verificando conectividade ==='
curl -I http://localhost:3000/ || echo 'Aplicação ainda não está respondendo'
"

# 17. Informações finais
echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 INFORMAÇÕES IMPORTANTES:${NC}"
echo ""
echo -e "${GREEN}🌐 URLs:${NC}"
echo "  • Produção: https://$DOMAIN"
echo "  • API: https://$DOMAIN/api"
echo ""
echo -e "${GREEN}🗂️ Localizações importantes:${NC}"
echo "  • Aplicação: $APP_DIR"
echo "  • Logs: /var/log/agencyhub/"
echo "  • Backups: /var/backups/agencyhub/"
echo "  • Nginx: $NGINX_CONF"
echo ""
echo -e "${GREEN}🔧 Comandos úteis:${NC}"
echo "  • Reiniciar app: pm2 restart agencyhub"
echo "  • Ver logs: pm2 logs agencyhub"
echo "  • Status: pm2 status"
echo "  • Deploy futuro: cd $APP_DIR && ./update.sh"
echo "  • Backup manual: /usr/local/bin/backup-agencyhub.sh"
echo ""
echo -e "${YELLOW}⚠️ PRÓXIMOS PASSOS:${NC}"
echo "1. Configure suas variáveis de ambiente em $APP_DIR/.env"
echo "2. Adicione suas chaves de API (OpenAI, SMTP, etc.)"
echo "3. Configure seu domínio DNS apontando para o IP da VPS"
echo "4. Teste todas as funcionalidades"
echo ""
echo -e "${GREEN}✅ Sistema de monitoramento ativo${NC}"
echo -e "${GREEN}✅ Backups automáticos configurados${NC}"
echo -e "${GREEN}✅ SSL configurado${NC}"
echo -e "${GREEN}✅ Firewall ativo${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"

exit 0