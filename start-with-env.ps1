# Load environment variables from .env.local
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "Set $name"
        }
    }
    Write-Host "Environment variables loaded from .env.local"
} else {
    Write-Host ".env.local file not found"
}

# Start the API server with fallback database
Write-Host "Starting API server with fallback database..."
go run cmd/api/main.go