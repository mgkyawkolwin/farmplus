## Validation
- Only validate fields for business logic at the place where fields values will be used.
- Do not validate unncessary fields and let it fail fast by throwing exception

## Logging
- Log debug message at controller functions
- Log trace message at the rest of the application

## Exception Handling
- Do not catch exception eveywhere
- Catch exception only at event handler or api controller
- Throw CustomException for buisiness logic validation failures