#!/bin/bash
echo "🚀 Iniciando ELK Stack para Logging..."

# Sobe os containers
docker-compose -f docker-compose.simple.yml up -d

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Verifica se Elasticsearch está rodando
echo "🔍 Verificando Elasticsearch..."
curl -X GET "localhost:9200/_cat/health?v"

# Verifica se Logstash está rodando
echo "🔍 Verificando Logstash..."
curl -X GET "localhost:5044"

echo "✅ Stack iniciada com sucesso!"
echo "📊 Kibana: http://localhost:5601"
echo "🔍 Elasticsearch: http://localhost:9200"
echo "📥 Logstash: http://localhost:5044"

echo ""
echo "Próximos passos:"
echo "1. Configure o environment.ts no Angular"
echo "2. Injete o SimpleLoggingService nos componentes"
echo "3. Acesse o Kibana e crie o index pattern 'user-logs-*'"
echo "4. Teste enviando alguns logs da aplicação"