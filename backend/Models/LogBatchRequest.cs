using System.ComponentModel.DataAnnotations;

namespace PocLogAngularRabbitMq.API.Models
{
    public class LogBatchRequest
    {
        [Required]
        [MinLength(1, ErrorMessage = "Deve conter pelo menos 1 ação")]
        [MaxLength(100, ErrorMessage = "Máximo 100 ações por batch")]
        public List<UserAction> Actions { get; set; } = new List<UserAction>();

        // Metadados opcionais da requisição
        public string? BatchId { get; set; }
        public DateTime RequestTimestamp { get; set; } = DateTime.UtcNow;
        public string? ClientVersion { get; set; }
    }
}
