using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cluspedia.FarmPlus.Api.Dtos.Categories;
using Cluspedia.FarmPlus.Api.Exceptions;
using Cluspedia.FarmPlus.Api.Services;

namespace Cluspedia.FarmPlus.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CategoriesController : BaseController
{
    private readonly ICategoryService _categoryService;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(ICategoryService categoryService, ILogger<CategoriesController> logger) : base(logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogDebug("CALLED: GetCategories(page={Page}, pageSize={PageSize})", page, pageSize);

            var result = await _categoryService.GetCategoriesAsync(page, pageSize);

            return Ok(new
            {
                Success = true,
                Data = new
                {
                    Items = result.Items,
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalCount = result.Total,
                    TotalPages = result.TotalPages
                }
            });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCategoryById(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: GetCategoryById(id={Id})", id);
            var category = await _categoryService.GetCategoryByIdAsync(id);
            if (category == null)
            {
                return NotFound(new { Success = false, Message = "Category not found." });
            }

            return Ok(new { Success = true, Data = category });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: CreateCategory(request={Request})", request);

            var categoryEntity = await _categoryService.CreateCategoryAsync(request, GetCurrentUserId() ?? Guid.Empty);
            return Ok(new { Success = true, Data = categoryEntity });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequestDto request)
    {
        try
        {
            _logger.LogDebug("CALLED: UpdateCategory(id={Id}, request={Request})", id, request);

            var category = await _categoryService.UpdateCategoryAsync(id, request, GetCurrentUserId() ?? Guid.Empty);
            if (category == null)
            {
                return NotFound(new { Success = false, Message = "Category not found." });
            }

            return Ok(new { Success = true, Data = category });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        try
        {
            _logger.LogDebug("CALLED: DeleteCategory(id={Id})", id);
            var deleted = await _categoryService.DeleteCategoryAsync(id);
            return Ok(new { Success = true, Message = "Category deleted successfully." });
        }
        catch (CustomException ex)
        {
            _logger.LogError("Custom exception occurred: {Message}", ex.Message);
            return Ok(new { Success = false, Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred.");
            return StatusCode((int)HttpStatusCode.InternalServerError, new { Success = false, Message = "An unexpected error occurred." });
        }
    }
}
