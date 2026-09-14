namespace SuperDevFact.Api.Infrastructure;

/// <summary>
/// Exécute un cas d'usage Application dans son propre scope DI (donc son propre
/// DbContext). Utilisé uniquement pour le seed de démarrage (hors requête HTTP) :
/// dans les endpoints, ASP.NET Core fournit déjà un scope par requête.
/// </summary>
public sealed class ScopedUseCaseRunner(IServiceProvider rootProvider)
{
    public async Task<TResult> RunAsync<TUseCase, TResult>(Func<TUseCase, Task<TResult>> action) where TUseCase : notnull
    {
        using var scope = rootProvider.CreateScope();
        var useCase = scope.ServiceProvider.GetRequiredService<TUseCase>();
        return await action(useCase);
    }

    public async Task RunAsync<TUseCase>(Func<TUseCase, Task> action) where TUseCase : notnull
    {
        using var scope = rootProvider.CreateScope();
        var useCase = scope.ServiceProvider.GetRequiredService<TUseCase>();
        await action(useCase);
    }
}
