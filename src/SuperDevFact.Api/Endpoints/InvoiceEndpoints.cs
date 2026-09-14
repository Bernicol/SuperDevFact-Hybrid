using SuperDevFact.Application.Invoices;
using SuperDevFact.Domain.Invoices;

namespace SuperDevFact.Api.Endpoints;

public static class InvoiceEndpoints
{
    public static void MapInvoiceEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/invoices");

        group.MapGet("", async (string? search, InvoiceStatus? status, SearchInvoicesUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(search, status, ct));

        group.MapGet("/{id:guid}", async (Guid id, GetInvoiceForViewingUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, ct));

        group.MapPost("/{id:guid}/payments", async (Guid id, RecordPaymentRequest request, RecordPaymentUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, request, ct));
    }
}
