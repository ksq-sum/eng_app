$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    $entries = (node --input-type=module -e "import { lessons } from './lessons.js'; console.log(JSON.stringify(lessons.filter(lesson => !lesson.book).flatMap(lesson => [{ name: lesson.id, text: lesson.english }, ...lesson.chunks.map(([text], index) => ({ name: lesson.id + '-chunk-' + index, text }))])));") | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw 'Unable to load lesson text.' }
    New-Item -ItemType Directory -Path (Join-Path $root 'audio') -Force | Out-Null
    $speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
    try {
        $voice = $speaker.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'en-US' } | Select-Object -First 1
        if (-not $voice) { throw 'An en-US Windows speech voice is required.' }
        $speaker.SelectVoice($voice.VoiceInfo.Name)
        $speaker.Rate = -1
        foreach ($entry in $entries) {
            $speaker.SetOutputToWaveFile((Join-Path $root ('audio/' + $entry.name + '.wav')))
            $speaker.Speak($entry.text)
            $speaker.SetOutputToNull()
        }
    } finally { $speaker.Dispose() }
    Write-Output "Generated $($entries.Count) English audio files."
} finally { Pop-Location }
