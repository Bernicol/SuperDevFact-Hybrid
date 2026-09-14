using SuperDevFact.Application.Customers;

namespace SuperDevFact.Api.Endpoints;

public static class CustomerEndpoints
{
    public static void MapCustomerEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/customers");

        group.MapGet("", async (string? search, SearchCustomersUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(search, ct));

        group.MapPost("", async (CreateCustomerRequest request, CreateCustomerUseCase useCase, CancellationToken ct) =>
            Results.Ok(await useCase.ExecuteAsync(request, ct)));
    }
}
