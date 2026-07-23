import "reflect-metadata";
import { container } from "tsyringe";
import { DI_TOKENS } from "./tokens";
import { AuthServiceClient, IAuthService } from "@/services/authService";

container.register(DI_TOKENS.IAuthService, { useClass: AuthServiceClient });

export { container };
