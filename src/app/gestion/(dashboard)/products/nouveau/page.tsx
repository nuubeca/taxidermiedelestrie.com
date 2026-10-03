import { categoryOptions, tagOptions } from "@/lib/gestion/catalog";
import { PageHeader } from "@/components/gestion/ui";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, tags] = await Promise.all([categoryOptions(), tagOptions()]);
  return (
    <div>
      <PageHeader back={{ href: "/gestion/products", label: "Produits" }} title="Nouveau produit" description="Enregistré en brouillon par défaut : publiez-le quand il est prêt." />
      <ProductForm
        action={createProduct}
        submitLabel="Créer le produit"
        categories={categories}
        tags={tags}
        initial={{
          name: "", slug: "", shortDescription: "", description: "", status: "DRAFT", featured: false,
          sku: "", regularPrice: "", salePrice: "", manageStock: false, stockQuantity: "", stockStatus: "instock", weight: "",
          metaTitle: "", metaDescription: "", primaryImageUrl: null, galleryImageUrls: [], categoryIds: [], tagIds: [],
          attributes: [], variants: [],
        }}
      />
    </div>
  );
}
