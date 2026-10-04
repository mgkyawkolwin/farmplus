export const DI_TOKENS = {
  IAuthService: Symbol.for("IAuthService"),
  ICustomerService: Symbol.for("ICustomerService"),
  IProductService: Symbol.for("IProductService"),
  IUserService: Symbol.for("IUserService"),
  IRoleService: Symbol.for("IRoleService"),
  IPurchaseService: Symbol.for("IPurchaseService"),
  ISaleService: Symbol.for("ISaleService"),
} as const;
