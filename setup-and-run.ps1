# EduFlow LMS - Setup and Run Script
# PowerShell script to setup and run the application

Write-Host "🎓 EduFlow LMS - Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean install
Write-Host "📦 Step 1: Cleaning and reinstalling dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "   ✓ Removed old node_modules" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "   ✓ Removed old package-lock.json" -ForegroundColor Green
}

Write-Host "   Installing dependencies (this may take a minute)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error installing dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Check MongoDB
Write-Host "🗄️  Step 2: Checking MongoDB..." -ForegroundColor Yellow
$mongoRunning = docker ps --format "{{.Names}}" | Select-String "mongodb"
if ($mongoRunning) {
    Write-Host "   ✓ MongoDB container is running" -ForegroundColor Green
} else {
    Write-Host "   ! MongoDB not running. Starting MongoDB..." -ForegroundColor Yellow
    docker run -d -p 27017:27017 --name mongodb mongo:7.0
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ MongoDB started successfully!" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } else {
        Write-Host "   ! Trying to restart existing container..." -ForegroundColor Yellow
        docker restart mongodb
        Start-Sleep -Seconds 3
    }
}
Write-Host ""

# Step 3: Check .env file
Write-Host "⚙️  Step 3: Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ! Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "   ✓ .env file created" -ForegroundColor Green
    Write-Host "   ⚠️  Please update NEXTAUTH_SECRET in .env file" -ForegroundColor Red
}
Write-Host ""

# Step 4: Seed database
Write-Host "🌱 Step 4: Seeding database..." -ForegroundColor Yellow
$seedChoice = Read-Host "   Do you want to seed the database with test data? (Y/n)"
if ($seedChoice -eq "" -or $seedChoice -eq "Y" -or $seedChoice -eq "y") {
    npm run db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Database seeded successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "   📝 Test Accounts Created:" -ForegroundColor Cyan
        Write-Host "   • Student: student@eduflow.com / password123" -ForegroundColor White
        Write-Host "   • Instructor: instructor@eduflow.com / password123" -ForegroundColor White
        Write-Host "   • Admin: admin@eduflow.com / password123" -ForegroundColor White
    }
} else {
    Write-Host "   ⊘ Skipped database seeding" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Start dev server
Write-Host "🚀 Step 5: Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Application will open at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Test Login:" -ForegroundColor Yellow
Write-Host "   Email: student@eduflow.com" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npm run dev

