import { Field, inputClass } from "@/components/gestion/ui";

export type ClientValues = {
  firstName: string; lastName: string; company: string; phone: string;
  address1: string; address2: string; city: string; state: string; postcode: string;
};

/** Champs communs de la fiche client (rendu serveur). */
export function ClientFields({ v }: { v: ClientValues }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Prénom" htmlFor="firstName"><input id="firstName" name="firstName" defaultValue={v.firstName} className={inputClass} /></Field>
      <Field label="Nom" htmlFor="lastName"><input id="lastName" name="lastName" defaultValue={v.lastName} className={inputClass} /></Field>
      <Field label="Téléphone" htmlFor="phone"><input id="phone" name="phone" type="tel" defaultValue={v.phone} className={inputClass} /></Field>
      <Field label="Entreprise" htmlFor="company"><input id="company" name="company" defaultValue={v.company} className={inputClass} /></Field>
      <Field label="Adresse" htmlFor="address1" className="sm:col-span-2"><input id="address1" name="address1" defaultValue={v.address1} className={inputClass} /></Field>
      <Field label="Appartement, bureau" htmlFor="address2" className="sm:col-span-2"><input id="address2" name="address2" defaultValue={v.address2} className={inputClass} /></Field>
      <Field label="Ville" htmlFor="city"><input id="city" name="city" defaultValue={v.city} className={inputClass} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Province" htmlFor="state"><input id="state" name="state" defaultValue={v.state || "QC"} className={inputClass} /></Field>
        <Field label="Code postal" htmlFor="postcode"><input id="postcode" name="postcode" defaultValue={v.postcode} className={inputClass} /></Field>
      </div>
    </div>
  );
}
