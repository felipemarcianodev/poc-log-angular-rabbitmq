using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PocLogAngularRabbitMq.API.Interfaces;
using PocLogAngularRabbitMq.API.Models;

namespace PocLogAngularRabbitMq.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private readonly IMessagePublisher _messagePublisher;
        private readonly ILogger<LogsController> _logger;

        public LogsController(IMessagePublisher messagePublisher, ILogger<LogsController> logger)
        {
            _messagePublisher = messagePublisher;
            _logger = logger;
        }

        [HttpPost("batch")]
        [Authorize]
        public async Task<IActionResult> LogBatch([FromBody] LogBatchRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();

                foreach (var action in request.Actions)
                {
                    // Enriquecer dados com informações do servidor
                    action.UserId = userId;
                    action.ServerTimestamp = DateTime.UtcNow;
                    action.ClientIp = clientIp;

                    // Validar e sanitizar dados
                    if (IsValid(action))
                    {
                        await _messagePublisher.PublishAsync("user-actions", action);
                    }
                }

                return Ok(new { message = "Logs processados com sucesso", count = request.Actions.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar batch de logs");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        private bool IsValid(UserAction action)
        {
            return !string.IsNullOrEmpty(action.Action) &&
                   !string.IsNullOrEmpty(action.Component) &&
                   action.Timestamp != default;
        }
    }
}
