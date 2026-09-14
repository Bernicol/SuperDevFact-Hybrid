using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Json;
using SuperDevFact.Api.Endpoints;
using SuperDevFact.Api.Infrastructure;
using SuperDevFact.Application;
using SuperDevFact.Domain.Invoices;
using SuperDevFact.Domain.Quotes;
using SuperDevFact.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.Secrets.json", optional: true);

var connectionString = Environment.GetEnvironmentVariable("SUPERDEVFACT_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Aucune chaîne de connexion PostgreSQL configurée.");

builder.Services.AddApplication();
builder.Services.AddInfrastructure(connectionString);
builder.Services.AddSingleton<ScopedUseCaseRunner>();
builder.Services.AddSingleton<DemoDataSeeder>();

builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

var app = builder.Build();

// Filet de sécurité : une violation de règle métier (ex. QuoteDomainException) se
// traduit par une réponse 400 lisible plutôt qu'un 500 opaque ou un crash serveur.
app.UseExceptionHandler(handler =>
{
    handler.Run(async context =>
    {
        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var exception = feature?.Error;

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            SuperDevFact.Application.Abstractions.NotFoundException => StatusCodes.Status404NotFound,
            InvalidOperationException => StatusCodes.Status400BadRequest,
            ArgumentException => StatusCodes.Status400BadRequest,
            _ => StatusCodes.Status500InternalServerError
        };

        await context.Response.WriteAsJsonAsync(new { message = exception?.Message ?? "Erreur inattendue." });
    });
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapCustomerEndpoints();
app.MapQuoteEndpoints();
app.MapInvoiceEndpoints();
app.MapPaymentEndpoints();

app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DemoDataSeeder>();
    await seeder.SeedIfEmptyAsync();
}

app.Run();
