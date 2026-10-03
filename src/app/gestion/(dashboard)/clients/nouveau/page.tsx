import { ActionForm, Feedback, SubmitButton } from "@/components/gestion/forms";
import { Field, PageHeader, Panel, inputClass } from "@/components/gestion/ui";
import { createClientAccount } from "../actions";
import { ClientFields } from "../ClientFields";

export default function NewClientPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        back={{ href: "/gestion/clients", label: "Clients" }}
        title="Nouveau client"
        description="Le client pourra se connecter au site avec son courriel : un code lui sera envoyé à chaque connexion."
      />
      <ActionForm
        action={createClientAccount}
        className="flex flex-col gap-6"
        submitLabel="Créer le client"
      >
        <Panel title="Compte">
          <Field label="Courriel" htmlFor="email">
            <input id="email" name="email" type="email" required className={inputClass} />
          </Field>
        </Panel>
        <Panel title="Coordonnées">
          <ClientFields v={{ firstName: "", lastName: "", company: "", phone: "", address1: "", address2: "", city: "", state: "QC", postcode: "" }} />
        </Panel>
      </ActionForm>
    </div>
  );
}
