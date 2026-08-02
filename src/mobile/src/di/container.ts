import "reflect-metadata";
import { container } from "tsyringe";
import { DI_TOKENS } from "./tokens";
import { AuthServiceClient, IAuthService } from "@/services/authService";
import { CustomerServiceClient, ICustomerService } from "@/services/customerService";
import { ProductServiceClient, IProductService } from "@/services/productService";

container.register(DI_TOKENS.IAuthService, { useClass: AuthServiceClient });
container.register(DI_TOKENS.ICustomerService, { useClass: CustomerServiceClient });
container.register(DI_TOKENS.IProductService, { useClass: ProductServiceClient });

export { container };
