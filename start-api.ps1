# Load .env.local and start API
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

# Set Redis connection
$env:REDIS_ADDR = "localhost:6379"
$env:PORT = "8080"

# Run API
go run .\cmd\api\main.go
