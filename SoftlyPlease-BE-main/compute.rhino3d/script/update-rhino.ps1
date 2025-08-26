# Update Rhino
# Requires -RunAsAdministrator
param (
    [Parameter(Mandatory = $true)][string] $Email
)

function Write-Step { 
    Write-Host "===> "$args[0] -ForegroundColor Darkgreen
}
function Download {
    param (
        [Parameter(Mandatory = $true)][string] $url,
        [Parameter(Mandatory = $true)][string] $output
    )
    Invoke-WebRequest -Uri $url -OutFile $output
}

try {
    Write-Step 'Checking for update'
    $rhino7DownloadUrl = "https://www.rhino3d.com/download/rhino-for-windows/7/latest/direct?email=$Email"
    if ((Get-Host).Version.Major -gt 5) {
        $uri = (Invoke-WebRequest -Method 'GET' -MaximumRedirection 0 -Uri $rhino7DownloadUrl -ErrorAction Ignore -SkipHttpErrorCheck).Headers.Location
    } else {
        $uri = (Invoke-WebRequest -Method 'GET' -MaximumRedirection 0 -Uri $rhino7DownloadUrl -ErrorAction Ignore).Headers.Location
    }
    $packageName = [System.IO.Path]::GetFileName($uri)
    $packageVersion = [Version][System.IO.Path]::GetFileNameWithoutExtension($uri).split('_')[-1]

    $installedVersion = [Version] (get-itemproperty -Path HKLM:\SOFTWARE\McNeel\Rhinoceros\7.0\Install -name "version").Version

    if ($installedVersion -ge $packageVersion) {
        Write-Host "Latest version avaliable is already installed! ($installedVersion >= $packageVersion)" -ForegroundColor Red
        exit 1
    }

    Write-Step 'Creating temp directory'
    $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
    $null = New-Item -ItemType Directory -Path $tempDir -Force -ErrorAction SilentlyContinue

    Write-Step "Downloading Rhino version $packageVersion"
    $packagePath = Join-Path -Path $tempDir -ChildPath $packageName
    Download $rhino7DownloadUrl $packagePath

    # Automated install
    # https://wiki.mcneel.com/rhino/installingrhino/6
    $process = Start-Process -FilePath $packagePath -ArgumentList "-quiet", "-norestart" -Wait -PassThru
    if ($process.exitcode -ne 0) {
        throw "Install failed, please rerun install and ensure you have administrator rights"
    }
}
finally {
    Write-Step 'Deleting temp directory'
    if((-not [string]::IsNullOrEmpty($tempDir)) -and (Test-Path -Path $tempDir)) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}



