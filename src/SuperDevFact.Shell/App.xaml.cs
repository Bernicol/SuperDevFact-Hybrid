using System.Windows;

namespace SuperDevFact.Shell;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    private readonly ApiProcessHost _apiHost = new();

    protected override async void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        var window = new MainWindow();
        window.Show();

        var ready = await _apiHost.StartAndWaitReadyAsync(TimeSpan.FromSeconds(20));
        if (!ready)
        {
            MessageBox.Show(
                "Impossible de démarrer le service local SUPER DEV FACT (API non disponible après 20s).",
                "Erreur de démarrage", MessageBoxButton.OK, MessageBoxImage.Error);
            Shutdown(1);
            return;
        }

        await window.NavigateToAppAsync(ApiProcessHost.BaseUrl);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _apiHost.Dispose();
        base.OnExit(e);
    }
}
