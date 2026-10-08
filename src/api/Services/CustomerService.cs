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
    Task<CustomerDto> CreateCustomerAsync(CreateCustomerRequestDto request);
    Task<CustomerDto?> UpdateCustomerAsync(Guid id, UpdateCustomerRequestDto request);
    Task<CustomerDto?> UploadProfilePictureAsync(Guid id, IFormFile file);
    Task DeleteCustomerAsync(Guid id);
}

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _dbContext;
    private readonly IStringLocalizer<LocalizedStrings> _localizer;
    private readonly ILogger<CustomerService> _logger;
    private readonly ICurrentUserService _currentUserService;
    private readonly IStorageService _storageService;

    public CustomerService(AppDbContext dbContext, IStringLocalizer<LocalizedStrings> localizer, ILogger<CustomerService> logger, ICurrentUserService currentUserService, IStorageService storageService)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
        _currentUserService = currentUserService;
        _storageService = storageService;
    }

    public async Task<PaginatedResultDto<CustomerDto>> GetCustomersAsync(int page, int pageSize, string? name = null, bool? isActive = null)
    {
        _logger.LogDebug("CALLED: GetCustomersAsync(page={Page}, pageSize={PageSize}, name={Name}, isActive={IsActive})", page, pageSize, name ?? "null", isActive);
        page = PaginationHelper.NormalizePage(page);
        pageSize = PaginationHelper.NormalizePageSize(pageSize);

        var query = _dbContext.Customers.AsNoTracking();

        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }
        
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
        foreach (var dto in customerDtos)
        {
            dto.ProfilePictureUrl = ResolvePictureUrl(dto.ProfilePictureUrl);
        }

        return new PaginatedResultDto<CustomerDto>(customerDtos, page, pageSize, total, PaginationHelper.CalculateTotalPages(total, pageSize));
    }

    public async Task<CustomerDto?> GetCustomerByIdAsync(Guid id)
    {
        _logger.LogDebug("CALLED: GetCustomerByIdAsync(id={Id})", id);
        var query = _dbContext.Customers.AsNoTracking();
        if(_currentUserService.IsAdmin == false) {
            if (!Guid.TryParse(_currentUserService.TenantId, out var tenantId)) {
                throw new CustomException("Tenant ID is missing for the current user.");
            }
            query = query.Where(b => b.MainTenantId == tenantId);
        }
        var customer = await query.SingleOrDefaultAsync(c => c.Id == id);
        var dto = customer?.MapToDto();
        if (dto != null)
        {
            dto.ProfilePictureUrl = ResolvePictureUrl(dto.ProfilePictureUrl);
        }

        return dto;
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerRequestDto request)
    {
        _logger.LogDebug("CALLED: CreateCustomerAsync(request={Request})", request);
        ValidationHelper.ValidateRequiredString(_localizer, "Name", request.Name);

        var normalizedName = request.Name.Trim();
        var customerExists = await _dbContext.Customers.AnyAsync(c => c.Name.ToLower() == normalizedName.ToLower() && c.MainTenantId == Guid.Parse(_currentUserService.TenantId!));
        if (customerExists)
        {
            throw new CustomException("A customer with this name already exists.");
        }

        var customer = new CustomerEntity
        {
            Name = normalizedName,
            ProfilePictureUrl = !string.IsNullOrWhiteSpace(request.ProfilePictureUrl) ? request.ProfilePictureUrl.Trim() : null,
            NationalIdNumber = !string.IsNullOrWhiteSpace(request.NationalIdNumber) ? request.NationalIdNumber.Trim() : null,
            Phone = !string.IsNullOrWhiteSpace(request.Phone) ? request.Phone.Trim() : null,
            Email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email.Trim() : null,
            Address = !string.IsNullOrWhiteSpace(request.Address) ? request.Address.Trim() : null,
            City = !string.IsNullOrWhiteSpace(request.City) ? request.City.Trim() : null,
            Country = !string.IsNullOrWhiteSpace(request.Country) ? request.Country.Trim() : null,
            PostalCode = !string.IsNullOrWhiteSpace(request.PostalCode) ? request.PostalCode.Trim() : null,
            IsActive = request.IsActive ?? true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedById = Guid.Parse(_currentUserService.UserId!),
            UpdatedAtUtc = DateTime.UtcNow,
            UpdatedById = Guid.Parse(_currentUserService.UserId!),
            MainTenantId = Guid.Parse(_currentUserService.TenantId!),
        };

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync();

        return customer.MapToDto();
    }

    public async Task<CustomerDto?> UpdateCustomerAsync(Guid id, UpdateCustomerRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateCustomerAsync(id={Id}, request={Request})", id, request);
            ValidationHelper.ValidateRequiredString(_localizer, "Name", request.Name);
            ValidationHelper.ValidateRequiredGuid(_localizer, "RowVersion", request.RowVersion);

            var customer = await _dbContext.Customers.SingleOrDefaultAsync(c => c.Id == id && c.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Customer not found.");
            customer.Name = request.Name!.Trim();
            customer.ProfilePictureUrl = !string.IsNullOrWhiteSpace(request.ProfilePictureUrl) ? request.ProfilePictureUrl.Trim() : customer.ProfilePictureUrl;
            customer.NationalIdNumber = !string.IsNullOrWhiteSpace(request.NationalIdNumber) ? request.NationalIdNumber.Trim() : null;
            customer.Phone = !string.IsNullOrWhiteSpace(request.Phone) ? request.Phone.Trim() : null;
            customer.Email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email.Trim() : null;
            customer.Address = !string.IsNullOrWhiteSpace(request.Address) ? request.Address.Trim() : null;
            customer.City = !string.IsNullOrWhiteSpace(request.City) ? request.City.Trim() : null;
            customer.Country = !string.IsNullOrWhiteSpace(request.Country) ? request.Country.Trim() : null;
            customer.PostalCode = !string.IsNullOrWhiteSpace(request.PostalCode) ? request.PostalCode.Trim() : null;

            if (request.IsActive.HasValue)
            {
                customer.IsActive = request.IsActive.Value;
            }

            _dbContext.Entry(customer).Property(c => c.RowVersion).OriginalValue = request.RowVersion;
            customer.UpdatedAtUtc = DateTime.UtcNow;
            customer.UpdatedById = Guid.Parse(_currentUserService.UserId!);
            await _dbContext.SaveChangesAsync();

            return customer.MapToDto();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new CustomException(_localizer["Error.Concurrency"]);
        }
    }

    public async Task<CustomerDto?> UploadProfilePictureAsync(Guid id, IFormFile file)
    {
        _logger.LogDebug("CALLED: UploadProfilePictureAsync(id={Id}, file={FileName})", id, file?.FileName);
        if (file == null || file.Length == 0)
        {
            throw new CustomException(_localizer[$"Template.Required", "customer profile picture"]);
        }

        var customer = await _dbContext.Customers.SingleOrDefaultAsync(c => c.Id == id && c.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Customer not found.");

        if (!string.IsNullOrWhiteSpace(customer.ProfilePictureUrl) && !customer.ProfilePictureUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                await _storageService.DeleteObjectAsync(customer.ProfilePictureUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete previous customer profile picture for customer {CustomerId}", customer.Id);
            }
        }

        var objectName = await _storageService.UploadFileAsync(file);
        customer.ProfilePictureUrl = objectName;
        customer.UpdatedAtUtc = DateTime.UtcNow;
        customer.UpdatedById = Guid.Parse(_currentUserService.UserId!);
        await _dbContext.SaveChangesAsync();

        var dto = customer.MapToDto();
        dto.ProfilePictureUrl = ResolvePictureUrl(dto.ProfilePictureUrl);
        return dto;
    }

    private string? ResolvePictureUrl(string? objectName)
    {
        if (string.IsNullOrWhiteSpace(objectName))
        {
            return null;
        }

        if (objectName.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || objectName.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return objectName;
        }

        return _storageService.BuildObjectUrl(objectName);
    }

    public async Task DeleteCustomerAsync(Guid id)
    {
        _logger.LogDebug("CALLED: DeleteCustomerAsync(id={Id})", id);
        var customer = await _dbContext.Customers.SingleOrDefaultAsync(c => c.Id == id && c.MainTenantId == Guid.Parse(_currentUserService.TenantId!)) ?? throw new CustomException("Customer not found.");
        _dbContext.Customers.Remove(customer);
        await _dbContext.SaveChangesAsync();
    }
}
