import "reflect-metadata";
import { container } from "tsyringe";
import { DI_TOKENS } from "./tokens";
import { AuthServiceClient, IAuthService } from "@/services/authService";
import { CustomerServiceClient, ICustomerService } from "@/services/customerService";
import { ProductServiceClient, IProductService } from "@/services/productService";
import { UserServiceClient, IUserService } from "@/services/userService";
import { RoleServiceClient } from "@/services/roleService";
import { PurchaseServiceClient } from "@/services/purchaseService";
import { SaleServiceClient } from "@/services/saleService";

container.register(DI_TOKENS.IAuthService, { useClass: AuthServiceClient });
container.register(DI_TOKENS.ICustomerService, { useClass: CustomerServiceClient });
container.register(DI_TOKENS.IProductService, { useClass: ProductServiceClient });
container.register(DI_TOKENS.IUserService, { useClass: UserServiceClient });
container.register(DI_TOKENS.IRoleService, { useClass: RoleServiceClient });
container.register(DI_TOKENS.IPurchaseService, { useClass: PurchaseServiceClient });
container.register(DI_TOKENS.ISaleService, { useClass: SaleServiceClient });

export { container };
