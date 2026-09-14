using System.IO;
using System.Windows;
using System.Windows.Shell;
using Microsoft.Web.WebView2.Core;

namespace SuperDevFact.Shell;

/// <summary>
/// Fenêtre unique du shell : une simple coquille native autour d'un contrôle WebView2.
/// Aucune logique métier ici — tout l'applicatif vit dans le front React servi par l'API.
/// La barre de titre Windows par défaut est remplacée par une barre custom (via
/// WindowChrome) pour rester dans les couleurs de l'application plutôt que le bleu pâle
/// système.
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        StateChanged += (_, _) =>
        {
            UpdateMaximizeIcon();
            // Avec WindowStyle="None", l'état maximisé déborde par-dessus la barre des
            // tâches et les bords d'écran ; on compense par une marge le temps que la
            // fenêtre est maximisée (correctif standard pour WindowChrome + ResizeMode).
            RootBorder.Margin = WindowState == WindowState.Maximized ? new Thickness(7) : new Thickness(0);
        };
    }

    public async Task NavigateToAppAsync(string url)
    {
        // Dossier de données WebView2 explicitement placé dans %LocalAppData% (toujours
        // accessible en écriture, quel que soit l'endroit où l'appli est installée —
        // contrairement au dossier voisin de l'exe, utilisé par défaut, qui pollue le
        // répertoire d'installation et peut ne pas être inscriptible).
        var userDataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "SuperDevFact", "WebView2");

        var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: userDataFolder);
        await Browser.EnsureCoreWebView2Async(environment);
        LoadingPanel.Visibility = Visibility.Collapsed;
        Browser.CoreWebView2.Navigate(url);
    }

    private void OnMinimizeClick(object sender, RoutedEventArgs e) => SystemCommands.MinimizeWindow(this);

    private void OnMaximizeClick(object sender, RoutedEventArgs e) =>
        WindowState = WindowState == WindowState.Maximized ? WindowState.Normal : WindowState.Maximized;

    private void OnCloseClick(object sender, RoutedEventArgs e) => SystemCommands.CloseWindow(this);

    private void UpdateMaximizeIcon() =>
        MaximizeButton.Content = WindowState == WindowState.Maximized ? "\uE923" : "\uE922";
}
