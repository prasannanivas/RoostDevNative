import React from "react";
import { RealtorProvider } from "../context/RealtorContext";
import ClientDetails from "./ClientDetails";

export default function WrappedClientDetails() {
  return (
    <RealtorProvider>
      <ClientDetails />
    </RealtorProvider>
  );
}
