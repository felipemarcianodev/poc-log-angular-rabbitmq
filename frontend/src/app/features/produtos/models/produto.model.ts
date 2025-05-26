export class Produto {

  constructor(
    public name : string,
    public description : string,
    public price: number,
    public category: string
  )
  {

  }
  public id?: string;
  public imageUrl?: string;
  public originalPrice?: number;
  public inStock?: boolean;
  public stockQuantity?: number;
  public featured?: boolean;
  public rating?: number;
  public reviewCount?: number;
  public tags?: string[];
  public inWishlist?: boolean;

  public brand?: string;
  public sku?: string;
  public weight?: number;
  public dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  public createdAt?: Date;
  public updatedAt?: Date;
}
