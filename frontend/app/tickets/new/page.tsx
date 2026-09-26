import { redirect } from "next/navigation";

export default function NewTicketRedirectPage() {
  redirect("/tickets/create");
}
