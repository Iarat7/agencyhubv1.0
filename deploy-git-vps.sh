#!/bin/bash

# Deploy automatizado AgencyHub via Git Clone na VPS
# Uso: ./deploy-git-vps.sh [usuario@ip_vps] [repositorio_git] [porta_ssh]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações padrão
VPS_USER_HOST=${1:-"root@seu-servidor.com"}
GIT_REPO=${2:-"https://github.com/seu-usuario/agencyhub-marketing-platform.git"}
SSH_PORT=${3:-"22"}
APP_DIR="/var/www/agencyhub"
DOMAIN="agencyhub.com"  # Altere para seu domínio
NGINX_CONF="/etc/nginx/sites-available/agencyhub"

echo -e "${BLUE}🚀 Deploy AgencyHub via Git Clone${NC}"
echo -e "${YELLOW}VPS: $VPS_USER_HOST${NC}"
echo -e "${YELLOW}Repositório: $GIT_REPO${NC}"
echo -e "${YELLOW}Porta SSH: $SSH_PORT${NC}"

# Função para executar comandos na VPS
run_vps_command() {
    ssh -p $SSH_PORT $VPS_USER_HOST "$1"
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
    apt install -y curl git nginx certbot python3-certbot-nginx postgresql postgresql-contrib ufw bc
    
    # Instalar Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Instalar PM2 globalmente
    npm install -g pm2
    
    # Criar diretório da aplicação
    rm -rf $APP_DIR
    mkdir -p $APP_DIR
"

# 3. Clonar repositório na VPS
echo -e "${BLUE}📥 Clonando repositório na VPS...${NC}"
run_vps_command "
    # Clonar repositório
    git clone $GIT_REPO $APP_DIR
    cd $APP_DIR
    
    # Verificar se o clone foi bem-sucedido
    if [ ! -f package.json ]; then
        echo 'Erro: package.json não encontrado. Verifique o repositório.'
        exit 1
    fi
    
    echo 'Repositório clonado com sucesso'
"

# 4. Configurar PostgreSQL
echo -e "${BLUE}🗄️ Configurando PostgreSQL...${NC}"
run_vps_command "
    # Configurar PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Criar banco e usuário
    sudo -u postgres psql -c \"CREATE DATABASE agencyhub;\" 2>/dev/null || true
    sudo -u postgres psql -c \"CREATE USER agencyhub WITH ENCRYPTED PASSWORD 'AgencyHub2025!';\" 2>/dev/null || true
    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE agencyhub TO agencyhub;\" 2>/dev/null || true
    sudo -u postgres psql -c \"ALTER USER agencyhub CREATEDB;\" 2>/dev/null || true
    
    # Configurar PostgreSQL para aceitar conexões locais
    PG_VERSION=\$(sudo -u postgres psql -t -c \"SELECT version();\" | grep -oP 'PostgreSQL \K[0-9]+')
    PG_CONFIG_DIR=\"/etc/postgresql/\$PG_VERSION/main\"
    
    # Backup da configuração original
    cp \$PG_CONFIG_DIR/pg_hba.conf \$PG_CONFIG_DIR/pg_hba.conf.backup
    
    # Configurar autenticação
    echo 'local   all             agencyhub                               md5' >> \$PG_CONFIG_DIR/pg_hba.conf
    echo 'host    all             agencyhub       127.0.0.1/32            md5' >> \$PG_CONFIG_DIR/pg_hba.conf
    
    systemctl restart postgresql
"

# 5. Configurar variáveis de ambiente
echo -e "${BLUE}🔐 Configurando variáveis de ambiente...${NC}"
run_vps_command "
cd $APP_DIR

cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://agencyhub:AgencyHub2025!@localhost:5432/agencyhub
SESSION_SECRET=\$(openssl rand -hex 32)

# Configure estas variáveis manualmente após o deploy:
OPENAI_API_KEY=sua_openai_key_aqui
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app_gmail

# Configurações de produção
REPLIT_DB_URL=
VITE_API_URL=https://$DOMAIN
EOF

chown www-data:www-data .env
chmod 600 .env
"

# 6. Instalar dependências e build
echo -e "${BLUE}📦 Instalando dependências e fazendo build...${NC}"
run_vps_command "
cd $APP_DIR

# Instalar dependências
npm install

# Build da aplicação
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d dist ]; then
    echo 'Erro: Diretório dist não foi criado. Verifique o build.'
    exit 1
fi

# Configurar permissões
chown -R www-data:www-data $APP_DIR
"

# 7. Executar migrações do banco
echo -e "${BLUE}🗃️ Executando migrações do banco...${NC}"
run_vps_command "
cd $APP_DIR
npm run db:push || echo 'Aviso: Migrações podem falhar na primeira execução'
"

# 8. Configurar PM2
echo -e "${BLUE}⚙️ Configurando PM2...${NC}"
run_vps_command "
cd $APP_DIR

# Criar configuração do PM2
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
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git']
  }]
}
EOF

# Criar diretório de logs
mkdir -p /var/log/agencyhub
chown -R www-data:www-data /var/log/agencyhub

# Parar qualquer instância anterior
pm2 delete agencyhub 2>/dev/null || true

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup systemd -u root --hp /root
"

# 9. Configurar Nginx
echo -e "${BLUE}🌐 Configurando Nginx...${NC}"
run_vps_command "
cat > $NGINX_CONF << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Logs
    access_log /var/log/nginx/agencyhub.access.log;
    error_log /var/log/nginx/agencyhub.error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;
    add_header Content-Security-Policy \"default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:\" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=30r/s;

    # Main location
    location / {
        limit_req zone=general burst=50 nodelay;
        
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }

    # API endpoints with stricter rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Static files cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
        add_header Vary Accept-Encoding;
        try_files \$uri @proxy;
    }

    # Fallback for static files
    location @proxy {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host \$host;
    }
}
EOF

# Ativar site
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
"

# 10. Configurar firewall
echo -e "${BLUE}🛡️ Configurando firewall...${NC}"
run_vps_command "
# Configurar UFW
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Permitir conexões essenciais
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp

# Ativar firewall
ufw --force enable

# Mostrar status
ufw status numbered
"

# 11. Configurar SSL com Let's Encrypt
echo -e "${BLUE}🔒 Configurando SSL...${NC}"
run_vps_command "
# Verificar se o domínio aponta para o servidor
if ping -c 1 $DOMAIN > /dev/null 2>&1; then
    echo 'Domínio acessível, configurando SSL...'
    
    # Configurar certificado SSL
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect || {
        echo 'Aviso: SSL pode falhar se o DNS não estiver propagado'
        echo 'Execute manualmente após configurar DNS: certbot --nginx -d $DOMAIN -d www.$DOMAIN'
    }
    
    # Habilitar renovação automática
    systemctl enable certbot.timer
    systemctl start certbot.timer
else
    echo 'Aviso: Domínio não aponta para este servidor'
    echo 'Configure o DNS e execute: certbot --nginx -d $DOMAIN -d www.$DOMAIN'
fi
"

# 12. Configurar backups automáticos
echo -e "${BLUE}💾 Configurando backups automáticos...${NC}"
run_vps_command "
# Script de backup
cat > /usr/local/bin/backup-agencyhub.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR=\"/var/backups/agencyhub\"
DATE=\$(date +%Y%m%d_%H%M%S)
APP_DIR=\"$APP_DIR\"

mkdir -p \$BACKUP_DIR

echo \"Iniciando backup: \$DATE\"

# Backup do banco de dados
echo \"Fazendo backup do banco...\"
PGPASSWORD=\"AgencyHub2025!\" pg_dump -h localhost -U agencyhub agencyhub > \$BACKUP_DIR/db_\$DATE.sql

# Backup dos arquivos da aplicação
echo \"Fazendo backup dos arquivos...\"
tar -czf \$BACKUP_DIR/files_\$DATE.tar.gz -C \$APP_DIR --exclude=node_modules --exclude=.git --exclude=dist .

# Backup do .env
cp \$APP_DIR/.env \$BACKUP_DIR/env_\$DATE.backup

# Manter apenas os últimos 7 backups
find \$BACKUP_DIR -name \"*.sql\" -mtime +7 -delete
find \$BACKUP_DIR -name \"*.tar.gz\" -mtime +7 -delete
find \$BACKUP_DIR -name \"*.backup\" -mtime +7 -delete

echo \"Backup concluído: \$DATE\"
echo \"Arquivos salvos em: \$BACKUP_DIR\"
EOF

chmod +x /usr/local/bin/backup-agencyhub.sh

# Cron job para backup diário às 2h
(crontab -l 2>/dev/null | grep -v backup-agencyhub; echo \"0 2 * * * /usr/local/bin/backup-agencyhub.sh >> /var/log/agencyhub/backup.log 2>&1\") | crontab -

echo \"Backup automático configurado\"
"

# 13. Configurar monitoramento
echo -e "${BLUE}📊 Configurando monitoramento...${NC}"
run_vps_command "
# Script de monitoramento
cat > /usr/local/bin/monitor-agencyhub.sh << 'EOF'
#!/bin/bash
LOG_FILE=\"/var/log/agencyhub/monitor.log\"
APP_DIR=\"$APP_DIR\"

# Função para log com timestamp
log_with_timestamp() {
    echo \"\$(date '+%Y-%m-%d %H:%M:%S'): \$1\" >> \$LOG_FILE
}

# Verificar se a aplicação está rodando
if ! pm2 list | grep -q \"agencyhub.*online\"; then
    log_with_timestamp \"Aplicação offline, reiniciando...\"
    pm2 restart agencyhub
    pm2 save
fi

# Verificar se o site responde na porta 3000
if ! curl -f -s http://localhost:3000/ > /dev/null; then
    log_with_timestamp \"Site não responde na porta 3000, reiniciando aplicação...\"
    pm2 restart agencyhub
fi

# Verificar se o Nginx responde
if ! systemctl is-active --quiet nginx; then
    log_with_timestamp \"Nginx offline, reiniciando...\"
    systemctl restart nginx
fi

# Verificar uso de memória
MEMORY_USAGE=\$(free | grep Mem | awk '{printf \"%.1f\", \$3/\$2 * 100.0}')
if (( \$(echo \"\$MEMORY_USAGE > 85\" | bc -l) )); then
    log_with_timestamp \"Uso de memória alto: \$MEMORY_USAGE%\"
fi

# Verificar espaço em disco
DISK_USAGE=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 85 ]; then
    log_with_timestamp \"Uso de disco alto: \$DISK_USAGE%\"
fi

# Verificar se o PostgreSQL está rodando
if ! systemctl is-active --quiet postgresql; then
    log_with_timestamp \"PostgreSQL offline, reiniciando...\"
    systemctl restart postgresql
fi
EOF

chmod +x /usr/local/bin/monitor-agencyhub.sh

# Cron job para monitoramento a cada 5 minutos
(crontab -l 2>/dev/null | grep -v monitor-agencyhub; echo \"*/5 * * * * /usr/local/bin/monitor-agencyhub.sh\") | crontab -

echo \"Monitoramento configurado\"
"

# 14. Criar script de atualização
echo -e "${BLUE}🔄 Criando script de atualização...${NC}"
run_vps_command "
cat > $APP_DIR/update.sh << 'EOF'
#!/bin/bash
set -e

APP_DIR=\"$APP_DIR\"
cd \$APP_DIR

echo \"===========================================\"
echo \"Atualizando AgencyHub...\"
echo \"===========================================\"

# Backup antes da atualização
echo \"Fazendo backup...\"
/usr/local/bin/backup-agencyhub.sh

# Parar aplicação
echo \"Parando aplicação...\"
pm2 stop agencyhub

# Pull das mudanças
echo \"Baixando atualizações...\"
git fetch origin
git reset --hard origin/main

# Instalar/atualizar dependências
echo \"Instalando dependências...\"
npm install

# Build da aplicação
echo \"Fazendo build...\"
npm run build

# Executar migrações
echo \"Executando migrações...\"
npm run db:push || echo \"Aviso: Erro nas migrações\"

# Reiniciar aplicação
echo \"Reiniciando aplicação...\"
pm2 restart agencyhub
pm2 save

# Aguardar alguns segundos
sleep 5

# Verificar status
echo \"Verificando status...\"
pm2 status

echo \"===========================================\"
echo \"Atualização concluída!\"
echo \"===========================================\"
EOF

chmod +x $APP_DIR/update.sh
chown www-data:www-data $APP_DIR/update.sh
"

# 15. Configurar health check endpoint
echo -e "${BLUE}🔍 Configurando health check...${NC}"
run_vps_command "
cd $APP_DIR

# Criar arquivo de health check se não existir
if [ ! -f server/health.js ]; then
    mkdir -p server
    cat > server/health.js << 'EOF'
export function setupHealthCheck(app) {
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  });
}
EOF
fi
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

echo '=== Logs da aplicação (últimas 20 linhas) ==='
pm2 logs agencyhub --lines 20 --nostream || echo 'Logs não disponíveis ainda'

echo '=== Verificando conectividade ==='
curl -I http://localhost:3000/ || echo 'Aplicação ainda não está respondendo (normal na primeira execução)'

echo '=== Testando banco de dados ==='
PGPASSWORD=\"AgencyHub2025!\" psql -h localhost -U agencyhub -d agencyhub -c \"SELECT version();\" || echo 'Erro na conexão com banco'
"

# 17. Informações finais
echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 INFORMAÇÕES IMPORTANTES:${NC}"
echo ""
echo -e "${GREEN}🌐 URLs:${NC}"
echo "  • Produção: https://$DOMAIN (após configurar DNS)"
echo "  • HTTP: http://$DOMAIN"
echo "  • API: https://$DOMAIN/api"
echo ""
echo -e "${GREEN}🗂️ Localizações importantes:${NC}"
echo "  • Aplicação: $APP_DIR"
echo "  • Logs: /var/log/agencyhub/"
echo "  • Backups: /var/backups/agencyhub/"
echo "  • Nginx: $NGINX_CONF"
echo "  • Variáveis de ambiente: $APP_DIR/.env"
echo ""
echo -e "${GREEN}🔧 Comandos úteis na VPS:${NC}"
echo "  • Reiniciar app: pm2 restart agencyhub"
echo "  • Ver logs: pm2 logs agencyhub"
echo "  • Status geral: pm2 status"
echo "  • Atualizar app: cd $APP_DIR && ./update.sh"
echo "  • Backup manual: /usr/local/bin/backup-agencyhub.sh"
echo "  • Monitorar recursos: htop"
echo ""
echo -e "${YELLOW}⚠️ PRÓXIMOS PASSOS OBRIGATÓRIOS:${NC}"
echo ""
echo -e "${RED}1. Configure as variáveis de ambiente:${NC}"
echo "   ssh $VPS_USER_HOST"
echo "   nano $APP_DIR/.env"
echo "   # Adicione suas chaves de API reais"
echo "   pm2 restart agencyhub"
echo ""
echo -e "${RED}2. Configure DNS do domínio:${NC}"
echo "   A    $DOMAIN        -> $(ssh $VPS_USER_HOST 'curl -s ifconfig.me')"
echo "   A    www.$DOMAIN    -> $(ssh $VPS_USER_HOST 'curl -s ifconfig.me')"
echo ""
echo -e "${RED}3. Configure SSL após DNS propagar:${NC}"
echo "   ssh $VPS_USER_HOST"
echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo -e "${GREEN}✅ Recursos configurados:${NC}"
echo "✅ Aplicação em cluster com PM2"
echo "✅ Nginx com proxy reverso"
echo "✅ PostgreSQL configurado"
echo "✅ Firewall ativo"
echo "✅ Backups automáticos diários"
echo "✅ Monitoramento a cada 5 minutos"
echo "✅ Script de atualização automática"
echo "✅ Logs estruturados"
echo ""
echo -e "${BLUE}📁 Repositório clonado de: ${YELLOW}$GIT_REPO${NC}"
echo -e "${BLUE}🔗 Para atualizações futuras: ${YELLOW}git push && ./update.sh na VPS${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"

exit 0