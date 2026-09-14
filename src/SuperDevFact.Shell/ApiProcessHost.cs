using System.Diagnostics;
using System.IO;
using System.Net.Http;

namespace SuperDevFact.Shell;

/// <summary>
/// Démarre et arrête l'API ASP.NET Core embarquée (SuperDevFact.Api), publiée à côté de
/// l'exécutable du shell (dossier "api"). Le shell WebView2 est un client léger : toute
/// la logique métier tourne dans ce process séparé, exactement comme en mode SaaS — seule
/// la façon de le démarrer (localement, au double-clic) change.
/// </summary>
public sealed class ApiProcessHost : IDisposable
{
    public const string BaseUrl = "http://localhost:5080";

    private Process? _process;

    public async Task<bool> StartAndWaitReadyAsync(TimeSpan timeout)
    {
        var apiDirectory = Path.Combine(AppContext.BaseDirectory, "api");
        var apiExecutable = Path.Combine(apiDirectory, "SuperDevFact.Api.exe");

        if (!File.Exists(apiExecutable))
            throw new FileNotFoundException(
                "API introuvable. Le dossier 'api' doit être publié à côté de SuperDevFact.Shell.exe.", apiExecutable);

        _process = Process.Start(new ProcessStartInfo
        {
            FileName = apiExecutable,
            WorkingDirectory = apiDirectory,
            UseShellExecute = false,
            CreateNoWindow = true,
            EnvironmentVariables = { ["ASPNETCORE_URLS"] = BaseUrl },
        });

        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            if (_process is { HasExited: true })
                return false;

            try
            {
                var response = await http.GetAsync($"{BaseUrl}/api/customers");
                if (response.IsSuccessStatusCode)
                    return true;
            }
            catch
            {
                // API pas encore prête à accepter des connexions : on retente.
            }

            await Task.Delay(300);
        }

        return false;
    }

    public void Dispose()
    {
        if (_process is { HasExited: false })
        {
            try { _process.Kill(entireProcessTree: true); }
            catch { /* déjà arrêté */ }
        }
        _process?.Dispose();
    }
}
