namespace PocLogAngularRabbitMq.API.Models
{
    public class UserAction
    {
        public string UserId { get; set; }
        public string SessionId { get; set; }
        public string Action { get; set; }
        public string Component { get; set; }
        public DateTime Timestamp { get; set; }
        public DateTime ServerTimestamp { get; set; }
        public object? Metadata { get; set; }
        public string UserAgent { get; set; }
        public string? ClientIp { get; set; }
        public string Severity { get; set; } = "info";
        public List<string> Tags { get; set; } = new ();
    }
}
