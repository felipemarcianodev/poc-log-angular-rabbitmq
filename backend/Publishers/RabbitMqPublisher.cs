using RabbitMQ.Client;
using System.Text.Json;
using System.Text;
using PocLogAngularRabbitMq.API.Interfaces;

namespace PocLogAngularRabbitMq.API.Publishers
{
    public class RabbitMqPublisher : IMessagePublisher
    {
        #region Private Fields

        private IChannel _channel;
        private IConnection _connection;

        #endregion Private Fields

        #region Public Constructors

        public RabbitMqPublisher(IConnectionFactory connectionFactory)
        {
            InitRabbitAsync(connectionFactory);
        }

        #endregion Public Constructors

        #region Public Methods

        public async Task PublishAsync<T>(string queueName, T message)
        {
            var json = JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            var properties = new BasicProperties
            {
                Persistent = true,
                Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            };

            await _channel.BasicPublishAsync(
                exchange: "",
                routingKey: queueName,
                basicProperties: properties,
                mandatory: false,
                body: body
            );

            await Task.CompletedTask;
        }

        #endregion Public Methods

        #region Private Methods

        private async Task InitRabbitAsync(IConnectionFactory connectionFactory)
        {
            _connection = await connectionFactory.CreateConnectionAsync();
            _channel = await _connection.CreateChannelAsync();

            await _channel.QueueDeclareAsync(
                queue: "user-actions",
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null
            );
        }

        #endregion Private Methods
    }
}