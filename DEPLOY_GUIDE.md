# Guia Completo de Deploy Automatizado - AgencyHub

## Preparação Pré-Deploy

### 1. Configurar VPS
- **Sistema Operacional**: Ubuntu 20.04 LTS ou superior
- **Recursos Mínimos**: 2GB RAM, 2 CPUs, 50GB SSD
- **Acesso SSH**: Configurado com chaves públicas

### 2. Configurar DNS
Configure seu domínio para apontar para o IP da VPS:
```
A    agencyhub.com        -> IP_DA_VPS
A    www.agencyhub.com    -> IP_DA_VPS
```

### 3. Preparar Chaves de API
Tenha em mãos:
- OpenAI API Key
- Credenciais SMTP (Gmail App Password recomendado)
- Senha forte para PostgreSQL

## Deploy Automatizado

### Comando de Deploy
```bash
# Executar no Replit
./deploy-vps.sh root@SEU_IP_VPS 22
```

### Personalização do Script
Edite o arquivo `deploy-vps.sh` antes de executar:

```bash
# Linha 16: Altere para seu servidor
VPS_USER_HOST=${1:-"root@seu-servidor.com"}

# Linha 19: Altere para seu domínio
DOMAIN="agencyhub.com"
```

## O que o Script Faz Automaticamente

### 1. Infraestrutura
- Instala Node.js 20, PostgreSQL, Nginx, PM2, Certbot
- Configura firewall UFW
- Cria usuário e banco PostgreSQL

### 2. Aplicação
- Faz build da aplicação localmente
- Envia arquivos para VPS
- Instala dependências de produção
- Configura variáveis de ambiente

### 3. Servidor Web
- Configura Nginx com proxy reverso
- Ativa compressão Gzip
- Configura cache para assets estáticos
- Implementa rate limiting

### 4. SSL/HTTPS
- Instala certificado Let's Encrypt automaticamente
- Configura renovação automática

### 5. Processo Manager
- Configura PM2 para cluster mode
- Configuração de logs estruturados
- Auto-restart em caso de falha

### 6. Monitoramento
- Script de monitoramento a cada 5 minutos
- Verificação de saúde da aplicação
- Alertas de uso de recursos

### 7. Backups
- Backup automático diário às 2h
- Retenção de 7 dias
- Backup do banco PostgreSQL e arquivos

## Pós-Deploy Manual

### 1. Configurar Variáveis de Ambiente
```bash
ssh root@SEU_IP_VPS
cd /var/www/agencyhub
nano .env
```

Edite com suas chaves reais:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://agencyhub:SUA_SENHA_FORTE@localhost:5432/agencyhub
SESSION_SECRET=chave_gerada_automaticamente
OPENAI_API_KEY=sk-sua_openai_key_aqui
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app_gmail
```

### 2. Reiniciar Aplicação
```bash
pm2 restart agencyhub
```

### 3. Verificar Status
```bash
pm2 status
pm2 logs agencyhub
systemctl status nginx
systemctl status postgresql
```

## Comandos Úteis de Manutenção

### Gerenciamento da Aplicação
```bash
# Ver logs em tempo real
pm2 logs agencyhub --lines 100

# Reiniciar aplicação
pm2 restart agencyhub

# Parar aplicação
pm2 stop agencyhub

# Ver uso de recursos
pm2 monit
```

### Atualizações Futuras
```bash
# Conectar via SSH
ssh root@SEU_IP_VPS

# Executar script de atualização
cd /var/www/agencyhub
./update.sh
```

### Backup Manual
```bash
# Executar backup imediato
/usr/local/bin/backup-agencyhub.sh

# Ver backups disponíveis
ls -la /var/backups/agencyhub/
```

### Restaurar Backup
```bash
# Parar aplicação
pm2 stop agencyhub

# Restaurar banco
sudo -u postgres psql agencyhub < /var/backups/agencyhub/db_YYYYMMDD_HHMMSS.sql

# Restaurar arquivos
cd /var/www
tar -xzf /var/backups/agencyhub/files_YYYYMMDD_HHMMSS.tar.gz

# Reiniciar aplicação
pm2 restart agencyhub
```

## Monitoramento e Logs

### Localização dos Logs
```bash
# Logs da aplicação
/var/log/agencyhub/

# Logs do Nginx
/var/log/nginx/

# Logs do sistema
/var/log/syslog
```

### Verificação de Saúde
```bash
# Status geral
curl -I https://seu-dominio.com

# API health check
curl https://seu-dominio.com/api/auth/user

# Verificar certificado SSL
openssl s_client -connect seu-dominio.com:443 -servername seu-dominio.com
```

## Solução de Problemas

### Aplicação Não Inicia
1. Verificar logs: `pm2 logs agencyhub`
2. Verificar variáveis: `cat /var/www/agencyhub/.env`
3. Testar conexão DB: `psql -U agencyhub -d agencyhub -h localhost`

### Site Não Carrega
1. Verificar Nginx: `systemctl status nginx`
2. Testar configuração: `nginx -t`
3. Verificar firewall: `ufw status`

### SSL Não Funciona
1. Verificar certificado: `certbot certificates`
2. Renovar manualmente: `certbot renew`
3. Recarregar Nginx: `systemctl reload nginx`

### Banco de Dados
```bash
# Conectar ao banco
sudo -u postgres psql agencyhub

# Verificar tabelas
\dt

# Ver conexões ativas
SELECT * FROM pg_stat_activity;
```

## Segurança

### Firewall Ativo
- SSH (porta 22)
- HTTP/HTTPS (portas 80/443)
- PostgreSQL bloqueado externamente

### Headers de Segurança
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Content-Security-Policy

### Rate Limiting
- 10 requests/segundo por IP
- Burst de 20 requests

## Performance

### Configurações de Cluster
- PM2 em modo cluster (usa todos os CPUs)
- Restart automático em caso de crash
- Limite de memória: 1GB por processo

### Cache
- Assets estáticos: cache de 1 ano
- Compressão Gzip ativa
- Proxy cache configurado

## Backup e Disaster Recovery

### Estratégia de Backup
- Backups diários automáticos
- Retenção de 7 dias
- Inclui banco de dados e arquivos

### Procedimento de Disaster Recovery
1. Provisionar nova VPS
2. Executar script de deploy
3. Restaurar último backup
4. Atualizar DNS se necessário

---

**Suporte**: Em caso de problemas, verifique os logs em `/var/log/agencyhub/` e `/var/log/nginx/`