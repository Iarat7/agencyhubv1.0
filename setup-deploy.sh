#!/bin/bash

# Script de configuração rápida para deploy do AgencyHub
# Este script prepara o ambiente local antes do deploy automatizado

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configuração do Deploy AgencyHub${NC}"
echo ""

# 1. Coletar informações do usuário
echo -e "${YELLOW}Insira as informações do seu servidor:${NC}"
read -p "IP ou hostname da VPS: " VPS_HOST
read -p "Usuário SSH (padrão: root): " VPS_USER
VPS_USER=${VPS_USER:-root}
read -p "Porta SSH (padrão: 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}
read -p "Seu domínio (ex: agencyhub.com): " DOMAIN

echo ""
echo -e "${YELLOW}Configurações de API:${NC}"
read -p "OpenAI API Key: " OPENAI_KEY
read -p "Email SMTP: " SMTP_EMAIL
read -s -p "Senha do Email (App Password): " SMTP_PASS
echo ""
read -p "Senha do PostgreSQL: " DB_PASSWORD

# 2. Atualizar script de deploy
echo -e "${BLUE}📝 Atualizando configurações...${NC}"

# Backup do script original
cp deploy-vps.sh deploy-vps.sh.backup

# Atualizar configurações no script
sed -i "s/VPS_USER_HOST=\${1:-\"root@seu-servidor.com\"}/VPS_USER_HOST=\${1:-\"$VPS_USER@$VPS_HOST\"}/" deploy-vps.sh
sed -i "s/SSH_PORT=\${2:-\"22\"}/SSH_PORT=\${2:-\"$SSH_PORT\"}/" deploy-vps.sh
sed -i "s/DOMAIN=\"agencyhub.com\"/DOMAIN=\"$DOMAIN\"/" deploy-vps.sh
sed -i "s/senha_forte_aqui/$DB_PASSWORD/g" deploy-vps.sh
sed -i "s/sua_openai_key_aqui/$OPENAI_KEY/" deploy-vps.sh
sed -i "s/seu_email@gmail.com/$SMTP_EMAIL/" deploy-vps.sh
sed -i "s/sua_senha_app/$SMTP_PASS/" deploy-vps.sh

# 3. Testar conexão SSH
echo -e "${BLUE}🔗 Testando conexão SSH...${NC}"
if ssh -p $SSH_PORT -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'Conexão OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ Conexão SSH estabelecida${NC}"
else
    echo -e "${YELLOW}⚠️ Não foi possível conectar via SSH${NC}"
    echo "Verifique se:"
    echo "- O IP/hostname está correto"
    echo "- A porta SSH está correta"
    echo "- As chaves SSH estão configuradas"
    echo "- O firewall permite conexões SSH"
    echo ""
    echo "Configure as chaves SSH com:"
    echo "ssh-copy-id -p $SSH_PORT $VPS_USER@$VPS_HOST"
    echo ""
fi

# 4. Verificar dependências locais
echo -e "${BLUE}🔍 Verificando dependências locais...${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️ npm não encontrado - necessário para build${NC}"
else
    echo -e "${GREEN}✅ npm encontrado${NC}"
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️ Node.js não encontrado${NC}"
else
    echo -e "${GREEN}✅ Node.js encontrado ($(node --version))${NC}"
fi

# 5. Criar arquivo de configuração
cat > deploy-config.env << EOF
# Configurações do Deploy AgencyHub
VPS_USER=$VPS_USER
VPS_HOST=$VPS_HOST
SSH_PORT=$SSH_PORT
DOMAIN=$DOMAIN
DB_PASSWORD=$DB_PASSWORD
OPENAI_KEY=$OPENAI_KEY
SMTP_EMAIL=$SMTP_EMAIL
SMTP_PASS=$SMTP_PASS
EOF

echo ""
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo "1. Configure o DNS do seu domínio para apontar para o IP da VPS"
echo "2. Certifique-se de que a conexão SSH está funcionando"
echo "3. Execute o deploy automatizado:"
echo ""
echo -e "${YELLOW}   ./deploy-vps.sh${NC}"
echo ""
echo -e "${BLUE}📁 Arquivos criados:${NC}"
echo "- deploy-config.env (suas configurações)"
echo "- deploy-vps.sh.backup (backup do script original)"
echo ""
echo -e "${YELLOW}⚠️ Importante:${NC}"
echo "- Mantenha o arquivo deploy-config.env seguro (contém senhas)"
echo "- Adicione-o ao .gitignore se usar controle de versão"