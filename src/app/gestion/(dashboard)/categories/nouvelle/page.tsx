import { categoryOptions } from "@/lib/gestion/catalog";
import { PageHeader } from "@/components/gestion/ui";
import { createCategory } from "../actions";
import { CategoryForm } from "../CategoryForm";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const parents = await categoryOptions();
  return (
    <div>
      <PageHeader back={{ href: "/gestion/categories", label: "Catégories" }} title="Nouvelle catégorie" />
      <CategoryForm
        action={createCategory}
        submitLabel="Créer la catégorie"
        parents={parents}
        initial={{ name: "", slug: "", description: "", parentId: null, imageUrl: null, position: 0 }}
      />
    </div>
  );
}
