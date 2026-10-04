import { container, DI_TOKENS } from '@/di';
import { ProductItem } from '@/models/product';
import { IProductService } from '@/services/productService';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);
const PAGE_SIZE = 100;

export async function getInventoryProducts(): Promise<ProductItem[]> {
  const products: ProductItem[] = [];
  let page = 1;

  while (true) {
    const pageProducts = await productService.getProducts(page, PAGE_SIZE);
    products.push(...pageProducts);
    if (pageProducts.length < PAGE_SIZE) return products;
    page += 1;
  }
}