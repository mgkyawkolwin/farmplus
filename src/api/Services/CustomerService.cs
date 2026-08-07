using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using FarmPlus.Api.Data;
using FarmPlus.Api.Dtos;
using FarmPlus.Api.Dtos.Customers;
using FarmPlus.Api.Entities;
using FarmPlus.Api.Exceptions;
using FarmPlus.Api.I18N;
using FarmPlus.Api.Mappings;
using FarmPlus.Api.Utilities;

namespace FarmPlus.Api.Services;

public interface ICustomerService
{
    Task<PaginatedResultDto<CustomerDto>> GetCustomersAsync(int page, int pageSize, string? name = null, bool? isActive = null);
    Task<CustomerDto?> GetCustomerByIdAsync(Guid id);
    Task<CustomerDto> CreateCustomerAsync(CreateCustomerRequestDto request, Guid currentUserId);
    Task<CustomerDto?> UpdateCustomerAsync(Guid id, UpdateCustomerRequestDto request, Guid currentUserId);
    Task<bool> DeleteCustomerAsync(Guid id);
}

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<CustomerService> logger)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
    }

    public async Task<PaginatedResultDto<CustomerDto>> GetCustomersAsync(int page, int pageSize, string? name = null, bool? isActive = null)
    {
        _logger.LogDebug("CALLED: GetCustomersAsync(page={Page}, pageSize={PageSize}, name={Name}, isActive={IsActive})", page, pageSize, name ?? "null", isActive);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Customers.AsNoTracking();
        
        if (!string.IsNullOrWhiteSpace(name))
        {
            query = query.Where(c => c.Name.Contains(name));
        }

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        query = query.OrderBy(c => c.Name);
        var total = await query.CountAsync();

        var customers = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var customerDtos = customers.MapToDtoList();
        return new PaginatedResultDto<CustomerDto>(customerDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<CustomerDto?> GetCustomerByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetCustomerByIdAsync(id={Id})", id);
        var customer = await _dbContext.Customers.AsNoTracking().SingleOrDefaultAsync(c => c.Id == id);
        return customer?.MapToDto();
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerRequestDto request, Guid currentUserId)
    {
        _logger.LogDebug("CALLED: CreateCustomerAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "Name", request.Name);

        var normalizedName = request.Name.Trim();
        var customerExists = await _dbContext.Customers.AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower());
        if (customerExists)
        {
            throw new CustomException("A customer with this name already exists.");
        }

        var customer = new CustomerEntity
        {
            Name = normalizedName,
            NationalIdNumber = !string.IsNullOrWhiteSpace(request.NationalIdNumber) ? request.NationalIdNumber.Trim() : null,
            Phone = !string.IsNullOrWhiteSpace(request.Phone) ? request.Phone.Trim() : null,
            Email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email.Trim() : null,
            Address = !string.IsNullOrWhiteSpace(request.Address) ? request.Address.Trim() : null,
            City = !string.IsNullOrWhiteSpace(request.City) ? request.City.Trim() : null,
            Country = !string.IsNullOrWhiteSpace(request.Country) ? request.Country.Trim() : null,
            PostalCode = !string.IsNullOrWhiteSpace(request.PostalCode) ? request.PostalCode.Trim() : null,
            IsActive = request.IsActive ?? true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = currentUserId,
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = currentUserId
        };

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync();

        return customer.MapToDto();
    }

    public async Task<CustomerDto?> UpdateCustomerAsync(Guid id, UpdateCustomerRequestDto request, Guid currentUserId)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateCustomerAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);

            var customer = await _dbContext.Customers.SingleOrDefaultAsync(c => c.Id == id) ?? throw new CustomException("Customer not found.");

            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                var normalizedName = request.Name.Trim();
                var customerExists = await _dbContext.Customers.AnyAsync(c => c.Id != id && c.Name.ToLower() == normalizedName.ToLower());
                if (customerExists)
                {
                    throw new CustomException("A customer with this name already exists.");
                }

                customer.Name = normalizedName;
            }

            if (request.NationalIdNumber != null)
            {
                customer.NationalIdNumber = !string.IsNullOrWhiteSpace(request.NationalIdNumber) ? request.NationalIdNumber.Trim() : null;
            }

            if (request.Phone != null)
            {
                customer.Phone = !string.IsNullOrWhiteSpace(request.Phone) ? request.Phone.Trim() : null;
            }

            if (request.Email != null)
            {
                customer.Email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email.Trim() : null;
            }

            if (request.Address != null)
            {
                customer.Address = !string.IsNullOrWhiteSpace(request.Address) ? request.Address.Trim() : null;
            }

            if (request.City != null)
            {
                customer.City = !string.IsNullOrWhiteSpace(request.City) ? request.City.Trim() : null;
            }

            if (request.Country != null)
            {
                customer.Country = !string.IsNullOrWhiteSpace(request.Country) ? request.Country.Trim() : null;
            }

            if (request.PostalCode != null)
            {
                customer.PostalCode = !string.IsNullOrWhiteSpace(request.PostalCode) ? request.PostalCode.Trim() : null;
            }

            if (request.IsActive.HasValue)
            {
                customer.IsActive = request.IsActive.Value;
            }

            _dbContext.Entry(customer).Property(c => c.RowVersion).OriginalValue = request.RowVersion;
            customer.UpdatedAtUtc = DateTime.UtcNow;
            customer.UpdatedById = currentUserId;
            await _dbContext.SaveChangesAsync();

            return customer.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<bool> DeleteCustomerAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteCustomerAsync(id={Id})", id);
        var customer = await _dbContext.Customers.SingleOrDefaultAsync(c => c.Id == id) ?? throw new CustomException("Customer not found.");
        _dbContext.Customers.Remove(customer);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
