using SuperDevFact.Application.Invoices;
using SuperDevFact.Application.Quotes;
using SuperDevFact.Domain.Quotes;

namespace SuperDevFact.Api.Endpoints;

public static class QuoteEndpoints
{
    public static void MapQuoteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/quotes");

        group.MapGet("", async (string? search, QuoteStatus? status, SearchQuotesUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(search, status, ct));

        group.MapGet("/{id:guid}", async (Guid id, GetQuoteForEditingUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, ct));

        group.MapPost("", async (CreateQuoteRequest request, CreateQuoteUseCase useCase, CancellationToken ct) =>
            Results.Ok(await useCase.ExecuteAsync(request, ct)));

        group.MapPut("/{id:guid}/general-info", async (Guid id, UpdateQuoteGeneralInfoRequest request, UpdateQuoteGeneralInfoUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, request, ct));

        group.MapPut("/{id:guid}/notes", async (Guid id, UpdateNotesRequest request, UpdateQuoteNotesUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, request.InternalNotes, request.ClientMessage, ct));

        group.MapPut("/{id:guid}/discount", async (Guid id, DiscountRequest request, ApplyGlobalDiscountUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, request.DiscountRatePercent, ct));

        group.MapPost("/{id:guid}/lines", async (Guid id, QuoteLineRequest request, AddQuoteLineUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, request, ct));

        group.MapPut("/{id:guid}/lines/{lineId:guid}", async (Guid id, Guid lineId, QuoteLineRequest request, UpdateQuoteLineUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, lineId, request, ct));

        group.MapDelete("/{id:guid}/lines/{lineId:guid}", async (Guid id, Guid lineId, RemoveQuoteLineUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, lineId, ct));

        group.MapPost("/{id:guid}/send", async (Guid id, SendQuoteUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, ct));

        group.MapPost("/{id:guid}/accept", async (Guid id, AcceptQuoteUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, ct));

        group.MapPost("/{id:guid}/decline", async (Guid id, DeclineQuoteUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, ct));

        group.MapPost("/{id:guid}/convert-to-invoice", async (Guid id, ConvertQuoteToInvoiceUseCase useCase, CancellationToken ct) =>
            await useCase.ExecuteAsync(id, null, ct));
    }
}

public sealed record UpdateNotesRequest(string? InternalNotes, string? ClientMessage);

public sealed record DiscountRequest(decimal DiscountRatePercent);
