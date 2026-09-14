; Installeur "version light" (front web + shell WebView2) de SUPER DEV FACT.
; Compiler avec : ISCC.exe SuperDevFact-Light.iss
#define MyAppName "SUPER DEV FACT Light"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Solaris Installation"
#define MyPublishDir "..\publish\shell"

[Setup]
AppId={{7A2E4E2F-2E6A-4E33-9B7A-6D6C7E9B1B22}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\Programs\SuperDevFactLight
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=output
OutputBaseFilename=SuperDevFact-Light-Setup
Compression=lzma2/max
SolidCompression=yes
SetupIconFile=assets\AppIcon.ico
WizardImageFile=assets\WizardBanner.bmp
WizardSmallImageFile=assets\WizardSmall.bmp
WizardStyle=modern
UninstallDisplayIcon={app}\SuperDevFact.Shell.exe

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "Créer une icône sur le Bureau"; GroupDescription: "Icônes supplémentaires :"

[Files]
Source: "{#MyPublishDir}\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion
Source: "assets\MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\SuperDevFact.Shell.exe"
Name: "{group}\Désinstaller {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\SuperDevFact.Shell.exe"; Tasks: desktopicon

[Run]
; Le runtime WebView2 est déjà présent sur la quasi-totalité des Windows 10/11 récents
; (installé avec Edge) ; ce lancement est silencieux et ne fait rien s'il est déjà là.
Filename: "{tmp}\MicrosoftEdgeWebview2Setup.exe"; Parameters: "/silent /install"; StatusMsg: "Vérification du composant WebView2..."; Flags: waituntilterminated
Filename: "{app}\SuperDevFact.Shell.exe"; Description: "Lancer {#MyAppName}"; Flags: nowait postinstall skipifsilent
