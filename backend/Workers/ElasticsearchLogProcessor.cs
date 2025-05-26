using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Nest;
using PocLogAngularRabbitMq.API.Models;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace PocLogAngularRabbitMq.API.Workers
{
    public class ElasticsearchLogProcessor : BackgroundService, IDisposable
    {
        private IConnection _connection;
        private IChannel _channel;
        private readonly IConnectionFactory _connectionFactory;
        private readonly ElasticClient _elasticClient;
        private readonly ILogger<ElasticsearchLogProcessor> _logger;
        private Timer _batchTimer;
        private readonly List<UserAction> _actionBatch;
        private readonly object _batchLock = new object();

        public ElasticsearchLogProcessor(
            IConnectionFactory connectionFactory,
            ElasticClient elasticClient,
            ILogger<ElasticsearchLogProcessor> logger)
        {
            _connectionFactory = connectionFactory;
            _elasticClient = elasticClient;
            _logger = logger;
            _actionBatch = new List<UserAction>();
        }

        public override async Task StartAsync(CancellationToken cancellationToken)
        {
            // Inicializa conexão no StartAsync
            _connection = await _connectionFactory.CreateConnectionAsync();
            _channel = await _connection.CreateChannelAsync();

            await _channel.QueueDeclareAsync(
                queue: "user-actions",
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null
            );

            await base.StartAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var consumer = new AsyncEventingBasicConsumer(_channel);

            // Timer para processar batch a cada 10 segundos
            _batchTimer = new Timer(async _ => await ProcessBatch(), null,
                TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(10));

            consumer.ReceivedAsync += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    var action = JsonSerializer.Deserialize<UserAction>(message);

                    if (action != null)
                    {
                        lock (_batchLock)
                        {
                            _actionBatch.Add(action);
                        }

                        // Processar batch se atingir limite
                        int currentCount;
                        lock (_batchLock)
                        {
                            currentCount = _actionBatch.Count;
                        }

                        if (currentCount >= 100)
                        {
                            await ProcessBatch();
                        }
                    }

                    await _channel.BasicAckAsync(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar mensagem do RabbitMQ");
                    await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
                }
            };

            await _channel.BasicConsumeAsync(queue: "user-actions", autoAck: false, consumer: consumer);

            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(1000, stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                // Cancelamento normal do serviço
                _logger.LogInformation("ElasticsearchLogProcessor foi cancelado");
            }
        }

        private async Task ProcessBatch()
        {
            List<UserAction> currentBatch;

            lock (_batchLock)
            {
                if (!_actionBatch.Any()) return;

                currentBatch = new List<UserAction>(_actionBatch);
                _actionBatch.Clear();
            }

            try
            {
                var indexName = $"user-actions-{DateTime.UtcNow:yyyy-MM}";

                var bulkDescriptor = new BulkDescriptor();
                foreach (var action in currentBatch)
                {
                    bulkDescriptor.Index<UserAction>(i => i
                        .Index(indexName)
                        .Document(action)
                    );
                }

                var response = await _elasticClient.BulkAsync(bulkDescriptor);

                if (response.IsValid)
                {
                    _logger.LogInformation($"Batch de {currentBatch.Count} ações enviado para Elasticsearch");
                }
                else
                {
                    _logger.LogError($"Erro ao enviar para Elasticsearch: {response.DebugInformation}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar batch para Elasticsearch");
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            // Processa batch final antes de parar
            await ProcessBatch();

            await base.StopAsync(cancellationToken);
        }

        public override void Dispose()
        {
            _batchTimer?.Dispose();

            if (_channel != null)
            {
                if (_channel.IsOpen)
                {
                    _channel.CloseAsync().GetAwaiter().GetResult();
                }
                _channel.Dispose();
            }

            if (_connection != null)
            {
                if (_connection.IsOpen)
                {
                    _connection.CloseAsync().GetAwaiter().GetResult();
                }
                _connection.Dispose();
            }

            base.Dispose();
        }
    }
}