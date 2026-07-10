import { TrustBar } from "@/components/landing/sections";
import { ProductDetail } from "@/components/landing/product";
import { DataSources } from "@/components/landing/data-sources";

export default function ProductPage() {
  return (
    <>
      <TrustBar />
      <ProductDetail />
      <DataSources />
    </>
  );
}
