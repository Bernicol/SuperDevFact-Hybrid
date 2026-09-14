using SuperDevFact.Application.Invoices;

namespace SuperDevFact.Api.Endpoints;

public static class PaymentEndpoints
{
    public static void MapPaymentEndpoints(this WebApplication app)
    {
        app.MapGet("/api/payments", async (ListPaymentsUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(ct));
    }
}
