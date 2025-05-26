# install-dotnet-packages.sh
#!/bin/bash

set -e

echo "=== Installing .NET Logging Packages ==="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in a .NET project
if ! ls *.csproj 1> /dev/null 2>&1 && [ ! -f "*.sln" ]; then
    echo -e "${RED}Error: No .csproj or .sln files found. Make sure you're in a .NET project directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}Installing .NET logging packages...${NC}"

# Core logging packages
dotnet add package Serilog.AspNetCore --version 7.0.0
dotnet add package Serilog.Sinks.Elasticsearch --version 8.4.1
dotnet add package Serilog.Formatting.Elasticsearch --version 8.4.1
dotnet add package Serilog.Enrichers.Environment --version 2.2.0
dotnet add package Serilog.Enrichers.Process --version 2.0.2
dotnet add package Serilog.Enrichers.Thread --version 3.1.0

echo -e "${GREEN}✓ Core Serilog packages installed${NC}"

# Additional useful packages
read -p "Install additional monitoring packages? (Health checks, metrics) [y/N]: " install_additional

if [[ $install_additional =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installing additional packages...${NC}"
    
    dotnet add package Microsoft.Extensions.Diagnostics.HealthChecks --version 7.0.0
    dotnet add package Microsoft.Extensions.Diagnostics.HealthChecks.Elasticsearch --version 7.0.0
    dotnet add package Microsoft.AspNetCore.Diagnostics.HealthChecks --version 2.2.0
    dotnet add package AspNetCore.HealthChecks.UI --version 6.0.5
    
    echo -e "${GREEN}✓ Additional packages installed${NC}"
fi

# Generate configuration template
read -p "Generate logging configuration template? [y/N]: " generate_config

if [[ $generate_config =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Generating logging configuration...${NC}"
    
    # Create appsettings.json template
    cat > appsettings.Logging.json << 'EOF'
{
  "Serilog": {
    "Using": ["Serilog.Sinks.Console", "Serilog.Sinks.Elasticsearch"],
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}"
        }
      },
      {
        "Name": "Elasticsearch",
        "Args": {
          "nodeUris": "http://localhost:9200",
          "indexFormat": "dotnet-logs-{0:yyyy.MM.dd}",
          "autoRegisterTemplate": true,
          "numberOfShards": 2,
          "numberOfReplicas": 1
        }
      }
    ],
    "Enrich": ["FromLogContext", "WithMachineName", "WithProcessId", "WithThreadId"],
    "Properties": {
      "Application": "YourAppName"
    }
  }
}
EOF
    
    # Create Program.cs template section
    cat > Program.Logging.cs << 'EOF'
// Add this to your Program.cs file

using Serilog;
using Serilog.Events;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithProcessId()
    .Enrich.WithThreadId()
    .CreateLogger();

// Add Serilog to the container
builder.Host.UseSerilog();

// Add this middleware in your pipeline
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "Handled {RequestPath}";
    options.GetLevel = (httpContext, elapsed, ex) => LogEventLevel.Information;
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
    };
});
EOF
    
    echo -e "${GREEN}✓ Configuration templates created${NC}"
    echo "  - appsettings.Logging.json"
    echo "  - Program.Logging.cs"
fi

echo ""
echo -e "${GREEN}✓ .NET logging setup completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Merge appsettings.Logging.json with your appsettings.json"
echo "2. Add the Serilog configuration from Program.Logging.cs to your Program.cs"
echo "3. Configure your Elasticsearch connection string"
echo "4. Use ILogger<T> in your controllers and services"