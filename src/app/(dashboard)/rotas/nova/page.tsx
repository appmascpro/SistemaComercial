import { PageHeader } from "@/components/layout/page-header";
import { RouteForm } from "@/components/routes/route-form";
import {
  seedServiceCitiesAction,
  syncServiceCityRegionsAction,
} from "@/app/actions/service-cities";
import {
  getMicroRegionsForRoutes,
  getServiceCities,
} from "@/lib/service-cities/queries";

export const dynamic = "force-dynamic";

export default async function NovaRotaPage() {
  let serviceCities = await getServiceCities().catch(() => []);

  if (serviceCities.length === 0) {
    await seedServiceCitiesAction();
    serviceCities = await getServiceCities().catch(() => []);
  } else if (serviceCities.some((city) => !city.region)) {
    await syncServiceCityRegionsAction();
    serviceCities = await getServiceCities().catch(() => []);
  }

  const microRegions = getMicroRegionsForRoutes();

  return (
    <div>
      <PageHeader
        title="Nova rota"
        description={`Organize clientes por micro-região e ordem de visita. ${serviceCities.length} cidades em ${microRegions.length} eixos de expansão.`}
      />
      <RouteForm serviceCities={serviceCities} microRegions={microRegions} />
    </div>
  );
}
